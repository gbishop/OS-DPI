import * as StackTrace from "stacktrace-js";
import { html } from "uhtml";
import "css/errors.css";
import { TreeBase } from "./treebase";

export class Messages extends TreeBase {
  /** @type {string[]} */
  messages = [];

  template() {
    if (this.messages.length) {
      const result = html`<div id="messages">
        ${this.messages.map((message) => html`<p>${message}</p>`)}
      </div> `;
      this.messages = [];
      return result;
    } else {
      return this.empty;
    }
  }

  report(message = "") {
    console.log({ message });
    this.messages.push(message);
  }
}

/** Display an error message for user feedback
 * @param {string} msg - the error message
 * @param {string[]} trace - stack trace
 */
function reportInternalError(msg, trace) {
  const result = html.node`<div id="ErrorReport">
    <h1>Internal Error</h1>
    <p>
      Your browser has detected an internal error in OS-DPI. It was very likely
      caused by our program bug. We hope you will help us by sending a report of
      the information below. Simply click this button
      <button
        onclick=${() => {
          const html =
            document.getElementById("ErrorReportBody")?.innerHTML || "";
          const blob = new Blob([html], { type: "text/html" });
          const data = [new ClipboardItem({ "text/html": blob })];
          navigator.clipboard.write(data);
        }}
      >
        Copy report to clipboard
      </button>
      and then paste into an email to
      <a href="mailto:gb@cs.unc.edu?subject=OS-DPI Error Report" target="email"
        >gb@cs.unc.edu</a
      >.
      <button
        onclick=${() => {
          document.getElementById("ErrorReport")?.remove();
        }}
      >
        Dismiss this dialog
      </button>
    </p>
    <div id="ErrorReportBody">
      <h2>Error Report</h2>
      <p>${msg}</p>
      <h2>Stack Trace</h2>
      <ul>
        ${trace.map((s) => html`<li>${s}</li>`)}
      </ul>
    </div>
  </div>`;
  document.body.prepend(result);
}

window.onerror = async function (msg, _file, _line, _col, error) {
  console.error("onerror", msg, error);
  if (error instanceof Error) {
    try {
      const frames = await StackTrace.fromError(error);
      const trace = frames.map((frame) => `${frame.toString()}`);
      reportInternalError(msg.toString(), trace);
    } catch (e) {
      const msg2 = `Caught an error trying to report an error.
        The original message was "${msg.toString()}".
        With file=${_file} line=${_line} column=${_col}
        error=${error.toString()}`;
      reportInternalError(msg2, []);
    }
  }
};

/** @param {Error} error */
export function errorHandler(error, extra = "") {
  let stack = [];
  let cause = `${error.name}${extra}`;
  if (error.stack) {
    const errorLines = error.stack.split("\n");
    stack = errorLines.slice(1);
    cause = errorLines[0] + extra;
  }
  reportInternalError(cause, stack);
}
/** @param {PromiseRejectionEvent} error */
window.onunhandledrejection = function (error) {
  console.error("onunhandlederror", error);
  error.preventDefault();
  reportInternalError(
    error.reason.message,
    error.reason.stack?.split("\n") || ["no stack"]
  );
};
