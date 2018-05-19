import { enableFeature } from "./util/Feature";

import loginPageO365Button from "./features/login-page-o365-button";
import allAnnouncements from "./features/all-announcements";
import clickableExercises from "./features/clickable-exercises";

enableFeature(loginPageO365Button);
enableFeature(allAnnouncements);
enableFeature(clickableExercises);
