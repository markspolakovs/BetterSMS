import { enableContentFeature } from "./util/Feature";

import loginPageO365Button from "./features/login-page-o365-button";
import allAnnouncements from "./features/all-announcements";
import clickableExercises from "./features/clickable-exercises";
import notifications from "./features/notifications";

enableContentFeature(loginPageO365Button);
enableContentFeature(allAnnouncements);
enableContentFeature(clickableExercises);
enableContentFeature(notifications);
