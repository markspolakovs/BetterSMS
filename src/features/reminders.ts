import $ from "jquery";
import "jqueryui";
import * as _ from "lodash";
import { BackgroundFeature } from "../util/Feature";
import { sendMessageFromContent } from "../util/messaging";
import * as scripts from "../util/scripts";
import * as C from "../util/constants";
import { MinimumExercise } from "../util/types";
import StorageObject = browser.storage.StorageObject;

/// <reference types="jqueryui" />

export interface Reminder {
  when: number;
  title: string;
  exerciseData: MinimumExercise;
}

type ReminderList = { [name: string]: Reminder };

let observer: MutationObserver;
let key: string | undefined;

function onDomMutation(
  mutations: MutationRecord[],
  observer: MutationObserver
) {
  mutations.forEach(mutation => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === "DIV") {
          const el = node as Element;
          if (el.classList.contains("ui-dialog-buttonpane")) {
            if (
              $(el)
                .parents(".ui-dialog")
                .children("#assignment_container").length > 0 &&
              $("#" + key).length === 0
            ) {
              key = scripts.insertTemporaryScript(scripts.reminderButton);
              window.setTimeout(() => {key = undefined}, 100);
            }
          }
        }
      });
    }
  });
}

/*
 One thing in particular deserves note. One does not simply modify a reminder in storage. If that happens,
 all other clients that have it set will not have the new data. Instead, one deletes the reminder
 in storage and creates a new reminder with a different key.
 */

async function syncReminders(reminders: ReminderList | null = null) {
  if (reminders === null) {
    reminders = (await browser.storage.sync.get({
      [C.STORAGE_REMINDERALARMS]: {}
    }))[C.STORAGE_REMINDERALARMS];
  }

  // First, create any alarms that are in storage but don't yet exist

  const alarms = await browser.alarms.getAll();
  const keys = Object.keys(reminders);
  keys.forEach(async key => {
    if (!alarms.some(x => x.name === key)) {
      const reminder = reminders![key];
      await browser.alarms.create(key, { when: reminder.when });
    }
  });

  // Next, delete any alarms that exist but aren't in storage

  alarms.forEach(async alarm => {
    if (keys.indexOf(alarm.name) === -1) {
      // not modifying while iterating because we used getAll()
      await browser.alarms.clear(alarm.name);
    }
  });
}

const feature: BackgroundFeature = {
  name: "reminders",
  activePaths: [
    "https://sms.eursc.eu/",
    "https://sms.eursc.eu/content/common/dashboard.php",
    "https://sms.eursc.eu/content/common/calendar_for_students.php",
    "https://sms.eursc.eu/content/studentui/grades_details.php"
  ],
  async apply() {
    if (window === window.parent) {
      $("#main_menu > div:nth-child(1)").append(
        `<div class="nav_entry" style="color: orangered"  onclick="$('#interface_frame').attr('src', '${browser.runtime.getURL(
          "ui/reminders.html"
        )}')">Reminders</div>`
      );
    } else {
      observer = new MutationObserver(onDomMutation);
      observer.observe(document.body, {
        attributes: false,
        childList: true,
        subtree: true
      });
    }
  },
  unload() {
    observer.disconnect();
  },
  async applyBackground() {
    browser.alarms.onAlarm.addListener(async alarm => {
      if (
        alarm.name.substr(0, C.STORAGE_REMINDER_PREFIX.length) ===
        C.STORAGE_REMINDER_PREFIX
      ) {
        const reminderStore = await browser.storage.sync.get({
          [C.STORAGE_REMINDERALARMS]: {}
        });
        const reminders: ReminderList = reminderStore[C.STORAGE_REMINDERALARMS];
        const reminder = reminders[alarm.name] as Reminder | undefined;
        if (!reminder) {
          console.error(`FUCKUP! reminder ${alarm.name} does not exist`);
          return;
        }
        browser.notifications.create(alarm.name, {
          iconUrl: "res/logo.png",
          title: "Reminder: " + reminder.title,
          message: "Time to do your homework! Or study. Whatever.",
          type: "basic",
          requireInteraction: true,
          // Only Chrome supports buttons, Firefox doesn't
          // and the WebExt polyfill only has properties Firefox supports
          // hence the `as any`
          // </rant>
          buttons: [{
            title: "Snooze"
          }]
        } as any);
      }
    });

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "sync") {
        console.log(changes);
        if (Object.keys(changes).some(x => x === C.STORAGE_REMINDERALARMS)) {
          syncReminders();
        }
      }
    });

    browser.notifications.onClicked.addListener(async notifName => {
      if (notifName.substr(0, C.STORAGE_REMINDER_PREFIX.length) ===
        C.STORAGE_REMINDER_PREFIX) {
        const reminderStore = await browser.storage.sync.get({
          [C.STORAGE_REMINDERALARMS]: {}
        });
        let reminders: ReminderList = reminderStore[C.STORAGE_REMINDERALARMS];
        const reminder = reminders[notifName] as Reminder | undefined;
        if (!reminder) {
          console.error(`FUCKUP! reminder ${notifName} does not exist`);
          return;
        }
        delete reminders[notifName];
        await browser.storage.sync.set({
          [C.STORAGE_REMINDERALARMS]: (reminders as any)
        });
      }
    });

    browser.notifications.onClosed.addListener(async notifName => {
      if (notifName.substr(0, C.STORAGE_REMINDER_PREFIX.length) ===
        C.STORAGE_REMINDER_PREFIX) {
        const reminderStore = await browser.storage.sync.get({
          [C.STORAGE_REMINDERALARMS]: {}
        });
        let reminders: ReminderList = reminderStore[C.STORAGE_REMINDERALARMS];
        const reminder = reminders[notifName] as Reminder | undefined;
        if (!reminder) {
          console.error(`FUCKUP! reminder ${notifName} does not exist`);
          return;
        }
        delete reminders[notifName];
        await browser.storage.sync.set({
          [C.STORAGE_REMINDERALARMS]: (reminders as any)
        });
      }
    });

    if (chrome.notifications.onButtonClicked) {
      chrome.notifications.onButtonClicked.addListener(async (notifName, button) => {
        if (notifName.substr(0, C.STORAGE_REMINDER_PREFIX.length) ===
          C.STORAGE_REMINDER_PREFIX) {
          if (button === 0) {
            // snooze button
            const reminderStore = await browser.storage.sync.get({
              [C.STORAGE_REMINDERALARMS]: {}
            });
            let reminders: ReminderList = reminderStore[C.STORAGE_REMINDERALARMS];
            const reminder = reminders[notifName] as Reminder | undefined;
            if (!reminder) {
              console.error(`FUCKUP! reminder ${notifName} does not exist`);
              return;
            }
            delete reminders[notifName];
            reminder.when += 5 * 60 * 1000;
            const newId = C.STORAGE_REMINDER_PREFIX + scripts.makeId(4);
            reminders = {
              ...reminders,
              [newId]: reminder
            };
            await browser.storage.sync.set({
              [C.STORAGE_REMINDERALARMS]: (reminders as any)
            });
            await browser.notifications.create(null, {
              type: "basic",
              iconUrl: "res/logo.png",
              title: "Snoozing for five minutes",
              message: "But don't you dare procrastinate!"
            });
          }
        }
      })
    }
  },
  onContentMessage(action, payload) {},
  onPageMessage(action, payload) {
    switch (action) {
      case "clickReminders":
        const when = payload.when as number;
        const data = payload.exerciseData as MinimumExercise;
        const msg: Reminder = {
          title: data.title,
          when,
          exerciseData: data
        };
        sendMessageFromContent(feature, C.ACTION_CREATE_REMINDER, msg);
    }
  },
  async onBackgroundMessage(action, payload) {
    switch (action) {
      case C.ACTION_CREATE_REMINDER:
        const id = C.STORAGE_REMINDER_PREFIX + scripts.makeId(4);
        const reminderStore = await browser.storage.sync.get({
          [C.STORAGE_REMINDERALARMS]: {}
        });
        let reminders: ReminderList = reminderStore[C.STORAGE_REMINDERALARMS];
        reminders = {
          ...reminders,
          [id]: payload
        };
        await browser.storage.sync.set({
          [C.STORAGE_REMINDERALARMS]: (reminders as any)
        });
    }
  }
};

export default feature;
