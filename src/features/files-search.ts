import $ from "jquery";
import { invariant, assertString } from "../util/invariant";
import lunr from "lunr";
/// <reference types="jqueryui" />

import { Feature } from "../util/Feature";

let index: lunr.Index | undefined;

function autocompleteSearch(searchTerm: string) {
  if (index) {
    const results = index.query(function(q) {
      // exact matches should have the highest boost
      q.term(searchTerm, { boost: 100 });
      // wildcard matches should be boosted slightly
      q.term(searchTerm, {
        boost: 10,
        usePipeline: true,
        wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
      });
      // finally, try a fuzzy search, without any boost
      q.term(searchTerm, { boost: 1, usePipeline: false, editDistance: 1 });
    });
    if (!results.length) {
      return [];
    }
    return results
      .map(function(v, i, a) {
        // extract
        return { value: (v.matchData.metadata as any).name };
      })
      .filter(function(v, i, a) {
        // uniq
        return a.indexOf(v) === i;
      });
  }
  return [];
}

const feat: Feature = {
  name: "files-search",
  activePaths: [
    "https://sms.eursc.eu/content/file_container/file_container_management.php"
  ],
  apply() {
    setTimeout(() => {
      const tabAnchor = $(".ui-tabs-nav a:contains('Shared with me')")
        .first()
        .attr("href");
      if (!assertString(tabAnchor, `No "shared with me" tab found!`)) {
        return;
      }
      const ourTab = $(tabAnchor);
      const ourDiv = $("<div>");
      const searchBox = $("<input>");
      searchBox.attr("id", "bSMS_filesSearch");
      searchBox.attr("type", "text");
      searchBox.attr("placeholder", "Type to search...");

      searchBox.keydown(function(e) {
        if (e.keyCode === 13) {
          // enter
          if (index) {
            $(".file-container > td > div").hide();
            $(".search-highlight").removeClass("search-highlight");
            const results = index.search((searchBox.val() || "").toString());
            let scrolled = false;
            for (const result of results) {
              const [id, fileName] = result.ref.split("/");
              $(`#${id}`).show();
              $(`#${id}`)
                .find(`a:contains("${fileName}")`)
                .addClass("search-highlight");
              if (!scrolled) {
                $([document.documentElement, document.body]).animate(
                  {
                    scrollTop: $(`#${id}`)
                      .find(`a:contains("${fileName}")`)
                      .first()
                      .offset()!.top
                  },
                  2000
                );
                scrolled = true;
              }
            }
          }
        }
      });

      ourDiv.append(searchBox);
      ourTab.prepend(ourDiv);

      if (!index) {
        searchBox
          .attr("disabled", "true")
          .attr("prefix", "Indexing, please wait...");
        index = lunr(function() {
          this.ref("id");
          this.field("name", { boost: 4 });
          this.field("type");
          this.field("folder");
          this.field("teacher");
          $(".file-container > td > div").each((_i, container) => {
            const key = container.id;
            const folder = $(container)
              .parents(".file-container")
              .find("a:first")
              .text();
            const teacher = $(container)
              .parents(".file-container")
              .find("td.right")
              .text();
            $(container)
              .find(`a[href*="s3.amazonaws.com"]`)
              .each((_i2, file) => {
                const fileName = file.innerText.trim();
                const toks = fileName.split(".");
                const name = toks.slice(0, toks.length - 1).join(".");
                const extension = toks[toks.length - 1];
                this.add({
                  id: key + "/" + fileName,
                  name,
                  type: extension,
                  folder,
                  teacher
                });
              });
          });
        });
        searchBox.removeAttr("disabled").attr("prefix", "Type here to search.");
      }
      window.setTimeout(() => {
        $("#bSMS_filesSearch").autocomplete({
          source: (inp: any, out: (data: any[]) => void) =>
            out(autocompleteSearch(inp.term.toLowerCase())),
          minLength: 3,
          position: { my: "left top", at: "left bottom", collision: "none" }
        });
      }, 100);
    }, 500);
  },
  reloadOnSamePage: true
};

export default feat;
