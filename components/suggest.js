/** A simple word suggestion add-on for html input controls using uhtml */

import { render, html } from "uhtml";
import "css/suggest.css";

/**
 * @typedef {Object} SuggestState
 * @property {string[] | Set<string>} choices
 * @property {number} index
 * @property {string[]} results
 * @property {string} prefix
 */

/** @typedef {HTMLInputElement & { suggest: SuggestState }} InputWithSuggest */

/** Return a callback for ref to provide suggestions on a text input
 *
 * @param {string[]|Set<string>|undefined} suggestions
 * */
export default function suggest(suggestions) {
  if (!suggestions) {
    return () => {};
  }
  return (/** @type {InputWithSuggest} */ element) => {
    element.suggest = {
      choices: suggestions,
      index: 0,
      results: [],
      prefix: "",
    };
    element.addEventListener("input", input);
    element.addEventListener("blur", blur);
    element.addEventListener("keydown", keydown);
  };
}

/**
 * Handle input events
 * popup the menu if the current word is the prefix of some of the suggestions
 *
 * */
/** @param {InputEvent & { target: InputWithSuggest } } event */
function input(event) {
  const element = event.target;
  const charPosition = element.selectionEnd;
  // if at the beginning no need try
  if (!charPosition) {
    hideMenu(element);
    return;
  }
  const text = element.value;
  // match all the words in the text up to the charPosition
  const matches = [...text.slice(0, charPosition).matchAll(/[#$]\w*|\w+/g)];
  // find the match that contains the charPosition
  const match = matches.find(
    (match) =>
      typeof match.index === "number" &&
      match.index <= charPosition &&
      charPosition <= match.index + match[0].length
  );
  if (match) {
    // get the prefix that matched
    const prefix = match[0].toLowerCase();
    // get suggestions that match the prefix
    /** @type {string[]} */
    const results = [];
    for (const word of element.suggest.choices)
      if (word.toLowerCase().startsWith(prefix)) results.push(word);

    const div = /** @type {HTMLElement} */ (element.nextElementSibling);
    if (results.length) {
      div.style.left = `${charPosition}ch`;
      if (div.offsetLeft > element.offsetWidth) {
        div.style.left = `${element.offsetWidth}px`;
      }
      Object.assign(element.suggest, { results, prefix, index: 0 });
      drawMenu(element);
    } else {
      hideMenu(element);
    }
  } else {
    hideMenu(element);
  }
}

/** display the menu
 * @param {InputWithSuggest} element
 */
function drawMenu(element) {
  const menu = element.nextElementSibling;
  if (!menu) return;

  /** @param {MouseEvent} event */
  function mouseEnter(event) {
    const li = /** @type {HTMLLIElement} */ (event.target);

    if (!element.suggest || !li.parentNode) return;

    let index = Array.from(li.parentNode.children).indexOf(li);
    if (index != -1) {
      element.suggest.index = index;
      drawMenu(element);
    }
  }

  function mouseDown() {
    insertWord(element);
  }

  render(
    menu,
    html`<ul>
      ${element.suggest.results.map(
        (result, i) =>
          html`<li
            onmouseenter=${mouseEnter}
            onmousedown=${mouseDown}
            ?selected=${i == element.suggest.index}
          >
            ${result}
          </li>`
      )}
    </ul>`
  );
}

/** display the menu
 * @param {InputWithSuggest} element
 */
function hideMenu(element) {
  const menu = /** @type {HTMLElement} */ (element.nextElementSibling);
  menu.style.left = "-1000px";
  element.suggest.index = -1;
}

/** @param {Event & { target: InputWithSuggest } } event */
function blur(event) {
  hideMenu(event.target);
}

/** @param {KeyboardEvent & { target: InputWithSuggest } } event */
function keydown(event) {
  const element = event.target;
  if (
    !element.suggest ||
    !element.suggest.results.length ||
    element.suggest.index < 0
  )
    return;
  const { index, results } = element.suggest;
  switch (event.key) {
    case "Escape":
      hideMenu(event.target);
      break;
    case "Enter":
      insertWord(element);
      break;
    case "ArrowDown":
      if (index + 1 < results.length) {
        element.suggest.index += 1;
        drawMenu(element);
      }
      event.preventDefault();
      break;
    case "ArrowUp":
      if (index - 1 >= 0) {
        element.suggest.index -= 1;
        drawMenu(element);
      }
      event.preventDefault();
      break;
  }
}

/** @param {InputWithSuggest} element */
function insertWord(element) {
  const { index, results, prefix } = element.suggest;
  const word = results[index];
  const cp = element.selectionEnd;
  if (typeof cp !== "number") return;
  const value = element.value;
  const start = cp - prefix.length;
  const result = value.slice(0, start) + word + value.slice(cp);
  element.value = result;
  const np = cp + word.length - prefix.length;
  element.setSelectionRange(np, np, "forward");
  if (element.scrollWidth > element.offsetWidth) {
    element.scrollLeft = (np / result.length) * element.scrollWidth;
  }
  hideMenu(element);
}

/** Example of using the suggest feature on an input */
/*
function main() {
  render(
    document.body,
    html`<h1>Simple Suggest</h1>
      <div class="suggest">
        <input type="text" ref=${suggest(["$foo", "$bar", "#msg", "init"])} />
        <div></div>
      </div>
      <p>Suggestions can begin with $, # or just be a word like "init"</p> `
  );
}
*/
