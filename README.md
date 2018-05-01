# BetterSMS

## A Chrome/Firefox(/Edge?) extension to improve some things about the SMS interface

### Important Note

Since some people might be getting concerned:

 * This extension does not "hack" SMS
 * There is **no way** to access anyone's data except your own using the extension
 * This extension does not break any laws (that I am aware of)
 * This extension only uses APIs (code hooks) that SMS already makes available

### Installing

For now the extension is not available on Chrome Web Store / AMO, so the only way is to install a development build:

1. Either `git clone https://github.com/markspolakovs/BetterSMS` or click "Download ZIP"
2. Install Node.JS and yarn
3. `yarn`
4. `yarn run build`
5. *(Chrome)* Click on the three dots in the top-right > More Tools > Extensions (or type `chrome://extensions` in the search bar)
6. *(Chrome)* Tick "Developer Mode" in the top-right
7. *(Chrome)* Click "Load Unpacked" and browse to `where you downloaded this extension`/dist
8. *(Firefox)* Enter `about:debugging` in the address bar
9. *(Firefox)* Click "Load Temporary Add-on"  and browse to `where you downloaded this extension`/dist

### Features / To-Do List

- [x] O365 login button on login page
- [x] Show all announcements on dashboard, including expired
- [ ] Clickable assignments in "Graded Exercises"
- [ ] Search for assignments
- [ ] Search for files
- [ ] Notifications