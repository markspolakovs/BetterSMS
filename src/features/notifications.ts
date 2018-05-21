import $ from "jquery";
import "jqueryui";
/// <reference types="jqueryui" />
import { BackgroundFeature } from "../util/Feature";
import { sendMessageFromContent } from "../util/messaging";
import { testIcon } from "../util/resources";

let observer: MutationObserver;

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
              $("#assignmentNotifications").length === 0
            ) {
              $("body")
                .append(`<script id="assignmentNotifications">var __dialogEl = $("#assignment_container");
              var __buttons = __dialogEl.dialog("option", "buttons");
              __dialogEl.dialog("option", "buttons", {
                notifications: () => {},
                ...__buttons
              });</script>`);
              window.setTimeout(() => {
                $("#assignmentNotifications").remove();
              }, 100);
            }
          }
        }
      });
    }
  });
}

const feature: BackgroundFeature = {
  name: "notifications",
  activePaths: ["https://sms.eursc.eu**", "https://sms.eursc.eu/**"],
  async apply() {
    observer = new MutationObserver(onDomMutation);
    observer.observe(document.body, {
      attributes: false,
      childList: true,
      subtree: true
    });
  },
  unload() {
    observer.disconnect();
  },
  applyBackground() {},
  onContentMessage(action, message) {},
  onBackgroundMessage(action, message) {
    switch (action) {
      case "test":
        browser.notifications.create(null, {
          type: "basic",
          title: "BetterSMS content messaging working!",
          message: "Foo message sent from content script: " + message.foo,
          iconUrl: testIcon
        });
    }
  }
};

export default feature;
