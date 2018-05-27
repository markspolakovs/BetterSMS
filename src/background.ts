import { enableBackgroundFeature } from "./util/Feature";

import notifications from "./features/notifications";
import reminders from "./features/reminders";

enableBackgroundFeature(notifications);
enableBackgroundFeature(reminders);
