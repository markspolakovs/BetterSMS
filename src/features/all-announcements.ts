import $ from "jquery";
import { Feature } from "../util/Feature";
import { invariant, isNonNull } from "../util/invariant";

($.fn as any).bindFirst = function(name: string, fn: Function) {
  // bind as you normally would
  // don't want to miss out on any jQuery magic
  this.on(name, fn);

  // Thanks to a comment by @Martin, adding support for
  // namespaced events too.
  this.each(function(this: HTMLElement) {
      var handlers = ($ as any)._data(this, 'events')[name.split('.')[0]];
      // take out the handler we just inserted from the end
      var handler = handlers.pop();
      // move it at the beginning
      handlers.splice(0, 0, handler);
  });
};

const feature: Feature = {
  name: "all-announcements",
  activePaths: ["https://sms.eursc.eu/content/common/dashboard.php"],
  apply: () => {
    if ($("#interface_frame").length > 0) {
      // we're not in the iframe, let the content script in the frame handle it
      return;
    }
    $("#dashlet_1")
      .replaceWith(
        `<iframe id="allAnnouncements-iframe" style="width: 100%; height: 400px" src="https://sms.eursc.eu/content/announcement/announcement_inbox.php"></iframe>`
      );
    const oldWindow = window;
    window.setTimeout(() => {
      const replacement = document.getElementById(
        "allAnnouncements-iframe"
      ) as HTMLIFrameElement;
      invariant(replacement !== null, "Newly created iFrame is null");
      // now the announcement modal will open in the new iframe. let's replace the click handler
      // and open it in the main frame
      replacement.onload = function() {
        $(replacement)
          .contents()
          .find("[class^=announcement]")
          .bindFirst("click", function(event) {
            // ... but some other class names also start with "announcement"
            if ($(this).hasClass("announcement_inbox_block")) {
              return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            // Find the announcement ID from the class of da ting we clicked
            let match = $(this)[0].className.match(
              /announcement_([0-9]+)/
            );
            // The invariant will throw anyway if it's null, just that
            // TypeScript needs the if statement to know that there is *no possible way*
            // to continue
            if (!isNonNull(match, "Failed to find announcement ID")) {
              return;
            }
            const id = match[1];
            // There is no way to override SMS's event handler
            // so let it open its dumb modal, and remove it immediately after
            window.setTimeout(() => $(replacement).contents().find("#announcement_modal").remove(), 1);
            // DIRTY HAX - you can't access page variables from an extension content script
            // so we inject a script tag, which can
            // I hate the universe, but it works
            $(document.body).append(`<script>window.openAnnouncementModal("${id}")</script>`);
            return false;
          });
      };
    }, 1);
  }
};

export default feature;
