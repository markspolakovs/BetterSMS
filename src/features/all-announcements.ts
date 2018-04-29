import jQuery from "jquery";
import { Feature } from "../util/Feature";
import { invariant, isNonNull } from "../util/invariant";
import { MsmDashboardWindow } from "../util/msm-types";

const feature: Feature = {
  name: "all-announcements",
  activePaths: ["https://sms.eursc.eu/content/common/dashboard.php"],
  apply: () => {
    const mainFrame = jQuery("#interface_frame");
    mainFrame
      .contents()
      .find("#dashlet_1")
      .replaceWith(
        `<iframe id="allAnnouncements-iframe" style="width: 100%; height: 400px" src="https://sms.eursc.eu/content/announcement/announcement_inbox.php"></iframe>`
      );
    const oldWindow = window;
    window.setTimeout(() => {
      const replacement = (mainFrame[0] as HTMLIFrameElement).contentDocument.getElementById(
        "allAnnouncements-iframe"
      )! as HTMLIFrameElement;
      invariant(replacement !== null, "Newly created iFrame is null");
      // now the announcement modal will open in the new iframe. let's replace the click handler
      // and open it in the main frame
      replacement.onload = function() {
        jQuery(replacement)
          .contents()
          .find("[class^=announcement]")
          .off("click")
          .on("click", function(event) {
            event.preventDefault();
            let match = jQuery(this)[0].className.match(
              /announcement_([0-9]+)/
            );
            isNonNull(match, "Failed to find announcement ID");
            match = match!;
            const id = match[1];
            (replacement.contentWindow
              .parent as MsmDashboardWindow).openAnnouncementModal(id);
            return false;
          });
      };
    }, 1);
  }
};

export default feature;
