import { html } from "uhtml";
import sheetrock from "sheetrock";
import { Base } from "./base";
import { openDB } from "idb";

export class Content extends Base {
  template() {
    return html`
        <div class="content">
            <form>
                <label for="sheetfield">Google Sheets Link: </label> 
                <input type="text" id="sheetfield" value=${localStorage.getItem("cached_url") || ""}></input>
                <button type="button" onclick=${() => {
                  const sheetfield_content = `${
                    document.getElementById("sheetfield").value
                  }`;
                  if (sheetfield_content == "") return;
                  localStorage.setItem("cached_url", sheetfield_content);
                  sheetrock({
                    url: `${sheetfield_content}`,
                    callback: (errors, options, response) => {
                      const out = response.rows
                        .filter((row) => row.num)
                        .map((row) => {
                          if (!errors) {
                            const regex = /^[0-9]+$/g;
                            const zipped = Object.fromEntries(
                              row.labels.map((label, i) => {
                                return [
                                  row.labels[i].toLowerCase(),
                                  row.cellsArray[i].match(regex)
                                    ? parseInt(row.cellsArray[i])
                                    : row.cellsArray[i],
                                ];
                              })
                            );

                            if (!zipped["tags"]) zipped["tags"] = [];
                            zipped["symbol"] = `./alphabet/${zipped["symbol"]}`;
                            return zipped;
                          }
                        });

                      (async () => {
                        const db = await openDB(
                          window.location.hash.slice(1) || "demo"
                        );
                        let tx = db.transaction(["data"], "readwrite");
                        await tx.objectStore("data").add(out);
                        await tx.done;
                      })();
                    },
                    target: document.querySelector(
                      "div.content table#content-output"
                    ),
                  });
                }}>Submit</button>
            </form>

            <table id="content-output">
            </table>
        </div>`;
  }
}
