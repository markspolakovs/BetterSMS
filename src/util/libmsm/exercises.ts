import $ from "jquery";
import * as dateFns from "date-fns";
import { ScheduleEntry } from "../msm-types";
import { assertNotNull, invariant } from "../invariant";

let userId: string;

export async function findUserId() {
  const res = await fetch(
    "https://sms.eursc.eu/content/common/calendar_for_students.php",
    {
      credentials: "include"
    }
  );
  const userIdMatch = (await res.text()).match(
    /<input.*id="user_id".*value="([0-9]+)"/i
  );
  if (!assertNotNull(userIdMatch, "userIdMatch is null")) {
    throw "SHOULD NEVER HAPPEN";
  }
  const userId = userIdMatch[1];
  invariant(
    userId && userId.length > 1,
    "userID is less than two characters long - this probably means it wasn't loaded properly - some other APIs bork if you don't give them user_id, so we're gonna stop here"
  );
  return userId;
}

(window as any).dateFns2 = dateFns;

export async function getSchedule(
  start: number,
  end: number
): Promise<ScheduleEntry[]> {
  if (!userId) {
    userId = await findUserId();
    console.log("ate userId", userId);
  }
  console.log("has userId", userId);
  invariant(
    userId && userId.length > 1,
    "userId doesn't exist or is too short - it's dangerous to proceed."
  );
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
        start: start,
        end: end
      })
    }
  );
  let data = (await res.json()) as ScheduleEntry[];
  return data;
}

export async function getExerciseDetail(
  date: string,
  type: string,
  description: string
): Promise<ScheduleEntry | undefined> {
  console.log("ate gED");

  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);
  const dateObj = dateFns.parse(date, "dd/MM/yyyy", baseDate);

  let data = await getSchedule(
    dateObj.valueOf() / 1000,
    dateFns.setHours(dateObj, 23).valueOf() / 1000
  );

  console.log("ate data: " + data);
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
    return exer;
  }
}
