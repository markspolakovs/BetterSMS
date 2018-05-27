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
  var dialogEl = $("#assignment_container");
  var __buttons = dialogEl.dialog("option", "buttons");
  var __buttonLabel = "add reminder";
  dialogEl.dialog("option", "buttons", {
      [__buttonLabel]: () => {
          var html = "<span id='__r_wrapper'><input id='__r_time'><button class='ui-button ui-button-text-only' id='__r_save'>save</button><button class='ui-button ui-button-text-only' id='__r_cancel'>cancel</button></span>";
          __buttons = dialogEl.dialog("option", "buttons")
          delete __buttons[__buttonLabel];
          dialogEl.dialog("option", "buttons", __buttons);
          $('.ui-dialog-buttonpane > div > button:eq(0)').after(html);
          var picker = window.flatpickr(document.getElementById("__r_time"), { enableTime: true, time_24hr: true });
          $("#__r_save").on("click", function() {
            window.postMessage(
          {
            feature: "reminders",
            action: "clickReminders",
            payload: {
              exerciseData: {
                title: dialogEl
                .find("table > tbody > tr:nth-child(2) > td:nth-child(2)")
                .text(),
              type: dialogEl.find("table > tbody > tr:nth-child(3) > td:nth-child(2)").text(),
              date: dialogEl.find("table > tbody > tr:nth-child(4) > td:nth-child(2)").text(),
              },
              when: picker.selectedDates[0].valueOf()
            }
          },
          "*"
        );
            __apply();
          });
          $("#__r_cancel").on("click", function() {
            __apply();
          });
      },
      ...__buttons
  });
}
__apply();

$("body").append($("<script>").attr("src", "${browser.runtime.getURL("ui/lib/flatpickr.min.js")}")).append($("<link>").attr("rel", "stylesheet").attr("href", "${browser.runtime.getURL("ui/lib/flatpickr.min.css")}"));
`;
