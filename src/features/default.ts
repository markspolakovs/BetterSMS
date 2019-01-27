import { Feature } from "../util/Feature";

const feature: Feature = {
  name: "default",
  activePaths: ["https://sms.eursc.eu*"],
  apply() {
    const flag = document.createElement("span");
    flag.innerText = `BetterSMS v${
      browser.runtime.getManifest().version
    } active | `;

    const uiHeader = document.getElementById("interface_user");
    if (uiHeader) {
      uiHeader
        .querySelector(".main_header")!
        .insertAdjacentElement("afterend", flag);
    } else {
      console.warn("interface_user is not a thing");
    }
  }
};

export default feature;
