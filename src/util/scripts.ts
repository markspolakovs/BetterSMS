import $ from "jquery";

export function makeId(length: number) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

export function insertTemporaryScript(src: string, timeout = 1000) {
  const key = `__betterSMS__temporaryScript${makeId(4)}`;
  $("body").append(`<script id="${key}">${src}</script>`);
  window.setTimeout(timeout, () => {
    console.log("clearing temporary script");
    $(`#${key}`).remove();
  });
  return key;
}

export const createDivMonkeyPatch = `<script id="__createDivMonkeyPatch">
if (!window.createDiv.__monkeypatch) {
    var oldCreateDiv = window.createDiv;
    window.createDiv = function(id) {
        window.postMessage({
            feature: "__core",
            action: "beforeCreateDiv",
            payload:{id: id}
        }, "*");
        var returnValue = oldCreateDiv(id);
        window.postMessage({
            feature: "__core",
            action: "afterCreateDiv",
            payload:{id: id,
            returnValue: returnValue}
        }, "*");
        console.log("this is your monkey, reporting that the message was sent");
        return returnValue;
    };
    window.createDiv.__monkeypatch = true;
}
</script>`;

// language=JavaScript
export const reminderButton = `
function __apply() {
  console.log("__apply called");
  var dialogEl = $("#assignment_container");
  var __buttons = dialogEl.dialog("option", "buttons");
  var __buttonLabel = "add reminder";
  var popupRef;
  dialogEl.dialog("option", "buttons", {
    [__buttonLabel]: () => {
      console.log("reminder button clicked");
      var html = "<label>Reminder time <input class='__r_time'></label>";
      popupRef = $(html).dialog({
        buttons: {
          save: () => {
            window.postMessage(
              {
                feature: "reminders",
                action: "clickReminders",
                payload: {
                  exerciseData: {
                    title: dialogEl
                      .find("table > tbody > tr:nth-child(2) > td:nth-child(2)")
                      .text(),
                    type: dialogEl
                      .find("table > tbody > tr:nth-child(3) > td:nth-child(2)")
                      .text(),
                    date: dialogEl
                      .find("table > tbody > tr:nth-child(4) > td:nth-child(2)")
                      .text()
                  },
                  when: picker.selectedDates[0].valueOf()
                }
              },
              "*"
            );
            $(popupRef).dialog("close");
            $(popupRef).dialog("destroy");
            __apply();
          },
          cancel: () => {
            $(popupRef).dialog("close");
            $(popupRef).dialog("destroy");
            __apply();
          }
        },
        modal: true,
        position: "top",
        title: "Create reminder",
        close: () => {
          __apply();
        }
      });
      __buttons = dialogEl.dialog("option", "buttons");
      delete __buttons[__buttonLabel];
      dialogEl.dialog("option", "buttons", __buttons);
      console.log($(".__r_time"));
      var picker = $(".__r_time").flatpickr({
        enableTime: true,
        time_24hr: true
      });
    },
    ...__buttons,
    close: function() {
      dialogEl.dialog("close");
      window.postMessage(
        { feature: "reminders", action: "popupClosed", payload: {} },
        "*"
      );
    }
  });
  dialogEl.dialog("option", "close", () => {
    window.postMessage(
      { feature: "reminders", action: "popupClosed", payload: {} },
      "*"
    );
  });
}

__apply();

$("body").append($("<script>").attr("src", "${browser.runtime.getURL("ui/lib/flatpickr.min.js")}"));
$("head").append(
  $("<link>")
    .attr("rel", "stylesheet")
    .attr("href", "${browser.runtime.getURL("ui/lib/flatpickr.min.css")}")
);
//# sourceURL=betterSMS-reminders.js
`;
