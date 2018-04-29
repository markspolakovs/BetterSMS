import jQuery from "jquery";
import { Feature } from "../util/Feature";

const feature: Feature = {
    name: "login-page-o365-button",
    activePaths: ["https://sms.eursc.eu/login.php"],
    apply: () => {
        jQuery("#login_form > table > tbody").append(`<tr><td></td><td><button onClick="window.location = 'https://sms.eursc.eu/sso.php'; return false">O365</button></td></tr>`)
    }
};

export default feature;
