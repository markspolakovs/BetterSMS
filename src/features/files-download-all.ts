import $ from "jquery";
import { Feature } from "../util/Feature";
import Zip from "jszip";
import saveFile from "save-file/browser";

const feat: Feature = {
  name: "better-files",
  activePaths: [
    "https://sms.eursc.eu/content/file_container/file_container_management.php"
  ],
  apply() {
    $(".file-container").each(function() {
      const btn = $("<a>");
      btn.attr("href", "#");
      btn.click(async () => {
        btn.removeAttr("href");
        btn.text("Starting download...");

        const urls = $(this)
          .find(`a[href*="s3.amazonaws.com"]`)
          .map((_, el) => (el as HTMLAnchorElement).href)
          .toArray();
        let downloaded = 0;
        const files = await Promise.all(
          urls.map(async url => {
            const response = await fetch(url);
            const blob = await response.blob();
            downloaded += 1;
            btn.text(`Downloading (${downloaded}/${urls.length}) files…`);
            return { url, blob };
          })
        );

        btn.text("Zipping...");

        const zip = new Zip();
        for (const file of files) {
          const segments = file.url.split("/");
          const fileName = decodeURIComponent(segments[segments.length - 1]);
          zip.file(fileName, file.blob, { binary: true });
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });

        console.log(
          $(this)
            .children("a")
            .first()
        );

        const zipName =
          $(this)
            .children("a")
            .first()
            .text() + ".zip";

        await saveFile(zipBlob, zipName);

        btn.text("Done!");
      });
      btn.text("Download all");
      $(this)
        .find("td > div")
        .prepend(btn, "<br>");
    });
  },
  reloadOnSamePage: true
};

export default feat;
