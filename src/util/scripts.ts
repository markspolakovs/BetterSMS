import $ from "jquery";

function makeId(length: number) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }

export function insertTemporaryScript(src: string, timeout = 1000) {
    const key = `__betterSMS__temporaryScript${makeId(4)}`;
    $("body").append(`<script id="${key}">${src}</script>`);
    window.setTimeout(timeout, () => {
        $(`#${key}`).remove();
    });
    return key;
}

export const createDivMonkeyPatch = `<script id="__createDivMonkeyPatch">
if (!window.createDiv.__monkeypatch) {
    var oldCreateDiv = window.createDiv;
    window.createDiv = function(id) {
        window.postMessage({
            feature: "__core",
            action: "beforeCreateDiv",
            payload:{id: id}
        }, "*");
        var returnValue = oldCreateDiv(id);
        window.postMessage({
            feature: "__core",
            action: "afterCreateDiv",
            payload:{id: id,
            returnValue: returnValue}
        }, "*");
        console.log("this is your monkey, reporting that the message was sent");
        return returnValue;
    };
    window.createDiv.__monkeypatch = true;
}
</script>`;
