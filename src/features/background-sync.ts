import { BackgroundFeature } from "../util/Feature";
import { getSchedule } from "../util/libmsm/exercises";
import * as C from "../util/constants";
import * as dateFns from "date-fns";
import { diff } from "deep-diff";
import * as _ from "lodash";
import { ScheduleEntry } from "util/msm-types";

const TEST_MODE = false;

interface Change<T> {
  old: T;
  new: T;
}

export interface SyncReportType {
  added: Array<ScheduleEntry>;
  changed: Array<{ [K in keyof ScheduleEntry]: Change<ScheduleEntry[K]> }>;
  removed: Array<ScheduleEntry>;
}

function isSummer(): boolean {
  const now = new Date();
  const year = now.getUTCFullYear();
  const JULY = 6; // 0-based
  const SEPTEMBER = 8;
  return (
    dateFns.isBefore(now, new Date(year, SEPTEMBER, 3)) &&
    dateFns.isAfter(now, new Date(year, JULY, 7))
  );
}

function compareScheduleEntries(x: ScheduleEntry, y: ScheduleEntry): boolean {
  // id is the course's ID, not this instance's
  if (x.id !== y.id) {
    return false;
  }
  // we don't compare dates directly because then a summer shift will fucc things up
  // also, SMS lies - it says its times are in zulu time (Txx:yy:aaZ)
  // but they're actually in local time
  // but as long as the lie is in both the old and new data we can live with it
  //
  // TODO: we're wasting a lot of Date objects, maybe worth parsing initially
  // and then reusing?
  const dayOfWeek1 = dateFns.getISODay(x.start);
  const dayOfWeek2 = dateFns.getISODay(y.start);
  if (dayOfWeek1 !== dayOfWeek2) {
    return false;
  }

  const hrs1 = dateFns.getHours(x.start);
  const hrs2 = dateFns.getHours(y.start);
  const mins1 = dateFns.getMinutes(x.start);
  const mins2 = dateFns.getMinutes(y.start);

  // It's the same course, on the same weekday, at the same time
  // => it's the same schedule entry
  return hrs1 === hrs2 && mins1 === mins2;
}

async function sync() {
  let start, end;
  const now = new Date();
  if (isSummer()) {
    const year = now.getUTCFullYear();
    const SEPTEMBER = 8; // 0-based
    start = dateFns.setISODay(new Date(year, TEST_MODE ? 5 : SEPTEMBER, 21), 1);
    end = dateFns.setISODay(new Date(year, TEST_MODE ? 5 : SEPTEMBER, 21), 7);
  } else {
    start = dateFns.setISODay(now, 1);
    end = dateFns.setISODay(now, 7);
  }
  start = dateFns.setHours(
    dateFns.setMinutes(dateFns.setSeconds(start, 0), 0),
    0
  );
  end = dateFns.setHours(
    dateFns.setMinutes(dateFns.setSeconds(end, 59), 59),
    23
  );
  console.log(start, end);

  const schedule = await getSchedule(
    start.valueOf() / 1000,
    end.valueOf() / 1000
  );
  console.log(schedule);

  const courses = schedule.filter(e => e.entry_type === "Course");

  const prev = await browser.storage.local.get({
    [C.STORAGE_BS_SCHEDULE]: []
  });
  const prevCourses = prev[C.STORAGE_BS_SCHEDULE] as ScheduleEntry[];

  // Go through the new data
  // For each entry, find its corresponding entry in the old data
  // If it simply isn't there, assume it was added.
  // If it is, compare its attributes and extract the changes.
  // Then, go over the old data and repeat the process (except the diff)
  // to find the ones that were removed.

  const added: Array<ScheduleEntry> = [];
  const changed: Array<Partial<ScheduleEntry>> = [];
  const removed: Array<ScheduleEntry> = [];

  courses.forEach(course => {
    const foundMaybe = prevCourses.find(x => compareScheduleEntries(course, x));
    if (!foundMaybe) {
      added.push(course);
    } else {
      const changes = diff(course, foundMaybe);
      // can be undefined, except the typedef doesn't say
      if (changes && changes.length > 0) {
        let result: Partial<ScheduleEntry> = {};
        changes.forEach(change => {
          _.set(result, change.path, {
            old: change.lhs,
            new: change.rhs
          });
        });
        changed.push(result);
      }
    }
  });

  prevCourses.forEach(course => {
    const foundMaybe = courses.find(x => compareScheduleEntries(course, x));
    if (!foundMaybe) {
      removed.push(course);
    }
  });

  await browser.storage.local.set({
    [C.STORAGE_BS_SCHEDULE]: courses as any
  });

  console.group(
    `Sync complete. ${added.length} added, ${changed.length} changed, ${
      removed.length
    } removed.`
  );
  console.groupCollapsed("Added");
  added.forEach(x => console.log(x));
  console.groupEnd();
  console.groupCollapsed("Changed");
  changed.forEach(x => console.log(x));
  console.groupEnd();
  console.groupCollapsed("Removed");
  removed.forEach(x => console.log(x));
  console.groupEnd();
  console.groupEnd();

  if (added.length > 0 || changed.length > 0 || removed.length > 0) {
    const id = new Date().valueOf().toString(10);
    await browser.storage.local.set({
      [C.STORAGE_SYNC_REPORT + id]: { added, changed, removed } as any
    });
    await browser.notifications.create(C.SYNC_NOTIFICATION_PREFIX + id, {
      type: "basic",
      title: "Schedule changed!",
      message: "Click here to see the changes.",
      requireInteraction: true,
      iconUrl: "res/logo.png"
    } as any);
  }
}

const feature: BackgroundFeature = {
  name: "background-sync",
  activePaths: ["https://sms.eursc.eu**", "https://sms.eursc.eu/**"],
  apply() {},
  applyBackground() {
    browser.alarms.onAlarm.addListener(async alarm => {
      if (alarm.name !== C.ALARM_BS_ID) {
        return;
      }
      const txt = await (await fetch("https://sms.eursc.eu/")).text();
      if (txt.indexOf("WARNING") !== -1) {
        console.error("Login expired, aborting sync.");
        return;
      }
      await sync();
    });

    browser.notifications.onClicked.addListener(key => {
      if (
        key.substr(0, C.SYNC_NOTIFICATION_PREFIX.length) ===
        C.SYNC_NOTIFICATION_PREFIX
      ) {
        const reportId = key.substring(C.SYNC_NOTIFICATION_PREFIX.length);
        browser.tabs.create({
          url:
            browser.runtime.getURL("ui/backgroundSync/syncReport.html") +
            C.SYNC_QUERY_PREFIX + reportId
        });
      }
    });

    console.log("setting alarm", TEST_MODE ? "in test mode" : "");
    if (TEST_MODE) {
      browser.alarms.create(C.ALARM_BS_ID, {
        delayInMinutes: 0.1
      });
    } else {
      const FOUR_HOURS = 60 * 4;
      browser.alarms.create(C.ALARM_BS_ID, {
        delayInMinutes: 1,
        periodInMinutes: FOUR_HOURS
      });
    }
  },
  unloadBackground() {
    browser.alarms.clear(C.ALARM_BS_ID);
  }
};

export default feature;
