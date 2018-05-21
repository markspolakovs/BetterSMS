import $ from "jquery";
import dateFns from "date-fns";
import fp from "date-fns/fp";
import lodash from "lodash";
import { ScheduleEntry } from "../util/msm-types";
import { invariant, isNonNull } from "../util/invariant";
import { Feature } from "../util/Feature";

let userId: string;

async function findUserId() {
  const res = await fetch("/content/common/calendar_for_students.php", {
    credentials: "include"
  });
  const userIdMatch = (await res.text()).match(
    /<input.*id="user_id".*value="([0-9]+)"/i
  );
  if (!isNonNull(userIdMatch, "iFrame's contentDocument is null")) {
    throw "SHOULD NEVER HAPPEN";
  }
  const userId = userIdMatch[1];
  invariant(
    userId.length > 1,
    "userID is less than two characters long - this probably means it wasn't loaded properly - some other APIs bork if you don't give them user_id, so we're gonna stop here"
  );
  return userId;
}

(window as any).dateFns2 = dateFns;

async function getExerciseDetail(
  date: string,
  type: string,
  description: string
) {
  if (!userId) {
    userId = await findUserId();
  }
  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);
  const dateObj = dateFns.parse(date, "dd/MM/yyyy", baseDate);
  const res = await fetch(
    "https://sms.eursc.eu/data/common_handler.php?action=Contact::AJAX_U_GetSchedule",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: $.param({
        user_id: userId,
        inc_appointment: true,
        start: dateObj.valueOf() / 1000,
        end: dateFns.setHours(dateObj, 23).valueOf() / 1000
      })
    }
  );
  let data = (await res.json()) as ScheduleEntry[];
  // First, find just exercises
  data = data.filter(x => x.entry_type === "Exercise");
  // Then, find the one we're looking for
  const exer = data.find(
    x =>
      x.title === description && x.param_1.replace(/(.+) \/ .*/, "$1") === type
  );
  if (!exer) {
    alert("Could not unambiguously match exercise");
    return;
  } else {
    console.log(exer);
    // DIRTY HAX - you can't access page variables from an extension content script
    // so we inject a script tag, which can
    // I hate the universe, but it works
    $(document.body).append(
      `<script>window.loadStudentExercise("${exer.id}", "${userId}")</script>`
    );
  }
}

const feature: Feature = {
  name: "clickable-exercises",
  activePaths: ["https://sms.eursc.eu/content/studentui/grades_details.php*"],
  reloadOnSamePage: true,
  async apply() {
    if ($("#interface_frame").length > 0) {
      console.log("bailing");
      // we're not in the iframe, let the content script in the frame handle it
      return;
    }
    // Abort if there are no exercises
    if (
      ($("table.tablesorter td")[0] as HTMLElement).innerText ===
      "No exercises recorded on system"
    ) {
      return;
    }
    $("table.tablesorter tbody tr")
      .each(function() {
        const date = $(this)
          .find("td:eq(0)")
          .text();
        const type = $(this)
          .find("td:eq(1)")
          .text();
        // Description merits special handling - it can contain a comment
        let description: string;
        const descParent = $(this).find("td:eq(2)");
        if (descParent.children("div").length === 0) {
          // no comment div - throw it in there
          description = descParent.text();
        } else {
          description = descParent.contents()[0].textContent!;
        }
        $(this)
          .find("td:lt(3)")
          .css({ cursor: "pointer" })
          .click(async function() {
            await getExerciseDetail(date, type, description);
          });
      });
  }
};

export default feature;
