import { html, render } from "uhtml";
import "../css/wait.css";

/**
 * Handle displaying a "please wait" message and error reporting for
 * async functions that may take a while or throw errors
 * @template T
 * @param {Promise<T>} promise
 * @param {string} message
 * @returns {Promise<T>}
 */
export default async function wait(promise, message = "Please wait") {
  const div = document.createElement("div");
  div.id = "PleaseWait";
  document.body.appendChild(div);
  const timer = window.setTimeout(() => {
    render(div, html`<div><p class="message">${message}</p></div>`);
  }, 500);
  try {
    const result = await promise;
    clearTimeout(timer);
    div.remove();
    return result;
  } catch (e) {
    console.trace("wait error");
    clearTimeout(timer);
    return new Promise((resolve) => {
      render(
        div,
        html`<div>
          <p class="error">${e.message}</p>
          <button
            onclick=${() => {
              div.remove();
              resolve(e.message);
            }}
          >
            OK
          </button>
        </div>`
      );
    });
  }
}
