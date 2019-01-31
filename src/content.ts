import { enableContentFeature } from "./util/Feature";

import defaultFeat from "./features/default";
import loginPageO365Button from "./features/login-page-o365-button";
import allAnnouncements from "./features/all-announcements";
import clickableExercises from "./features/clickable-exercises";
import notifications from "./features/notifications";
import reminders from "./features/reminders";
import filesDownloadAll from "./features/files-download-all";
import filesSearch from "./features/files-search";

enableContentFeature(defaultFeat);
enableContentFeature(loginPageO365Button);
enableContentFeature(allAnnouncements);
enableContentFeature(clickableExercises);
enableContentFeature(reminders);
enableContentFeature(notifications);
enableContentFeature(filesDownloadAll);
enableContentFeature(filesSearch);
