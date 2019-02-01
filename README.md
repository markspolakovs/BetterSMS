# BetterSMS

## A Chrome/Firefox(/Edge?) extension to improve some things about the SMS interface

### Important Note

Since some people might be getting concerned:

 * This extension does not "hack" SMS
 * There is **no way** to access anyone's data except your own using the extension
 * This extension does not break any laws (that I am aware of)
 * This extension only uses APIs (code hooks) that SMS already makes available

### Installing

For now the extension is not available on Chrome Web Store / AMO, so the only way is to install a development build.

To use a development build, clone the repository, run `yarn && yarn build` (or `npm install && npm run build`), go to chrome://extensions, enable Developer Mode, click "Load Unpacked Extension", and browse to `<where you cloned this repo>/dist`.

### Features / To-Do List

- [x] O365 login button on login page
- [x] Show all announcements on dashboard, including expired
- [x] Clickable assignments in "Graded Exercises"
- [x] Background sync and schedule change notifications
- [x] Reminders
- [ ] Search for assignments
- [x] Search for files
