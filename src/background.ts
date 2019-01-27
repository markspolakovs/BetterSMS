import { enableBackgroundFeature } from "./util/Feature";

import notifications from "./features/notifications";
import reminders from "./features/reminders";
import backgroundSync from "./features/background-sync";

enableBackgroundFeature(notifications);
enableBackgroundFeature(reminders);
enableBackgroundFeature(backgroundSync);
