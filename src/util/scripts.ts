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
