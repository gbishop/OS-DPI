import { html, render } from "uhtml";
import sheetrock from "sheetrock";
import { Base } from "./base";
import { Data } from "../data";

export class Content extends Base {
  template() {
    return html`
        <div class="content">
            <form>
                <label for="sheetfield">Google Sheets Link: </label> 
                <input type="text" id="sheetfield"></input>
                <button type="button" onclick=${() => {
                  sheetrock({
                    url: "https://docs.google.com/spreadsheets/d/1i4sWYlXWdWmhdCxSXt7S2B_63o0XkKlZ/edit#gid=1917614370",
                    callback: (errors, options, response) => {
                      const out = response.rows
                        .filter((row) => row.num)
                        .map((row) => {
                          if (!errors) {
                            const zipped = Object.fromEntries(
                              row.labels.map((label, i) => {
                                return [
                                  row.labels[i].toLowerCase(),
                                  row.cellsArray[i],
                                ];
                              })
                            );
                            //return { num: row.num, data: zipped };
                            return zipped;
                          }
                        });

                    },
                    target: document.querySelector(
                      "div.content table#content-output"
                    ),
                  });
                }}>Submit</button>
            </form>

            <table id="content-output">
            </table>
        </div>
        `;
  }
}
