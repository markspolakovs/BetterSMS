import $ from "jquery";
import dateFns from "date-fns";
import fp from "date-fns/fp";
import lodash from "lodash";
import { ScheduleEntry } from "../util/msm-types";
import { invariant, assertNotNull, assertString } from "../util/invariant";
import { Feature } from "../util/Feature";
import { insertTemporaryScript } from "../util/scripts";
import * as exercises from "../util/libmsm/exercises";

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
    $("table.tablesorter tbody tr").each(function() {
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
      console.log("ate description: " + description);
      $(this)
        .find("td:lt(3)")
        .css({ cursor: "pointer" })
        .click(async function() {
          console.log("ate click");
          const userId = await exercises.findUserId();
          const exer = await exercises.getExerciseDetail(
            date,
            type,
            description
          );
          if (exer) {
            // DIRTY HAX - you can't access page variables from an extension content script
            // so we inject a script tag, which can
            // I hate the universe, but it works
            insertTemporaryScript(
              `window.loadStudentExercise("${exer.id}", "${userId}")`
            );
          }
        });
    });
  }
};

export default feature;
