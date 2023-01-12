import * as StackTrace from "stacktrace-js";
import { html } from "uhtml";
import "css/errors.css";

/** Display an error message for user feedback
 * @param {string} msg - the error message
 * @param {string[]} trace - stack trace
 */
function report(msg, trace) {
  const result = html.node`<div id="ErrorReport">
    <h1>Internal Error</h1>
    <p>Your browser has detected an internal error in OS-DPI. It was very likely caused by our
      program bug. We hope you will help us by sending a report of the information
      below. Simply click this button
      <button
        onclick=${() => {
          const html = document.getElementById("ErrorReportBody").innerHTML;
          const blob = new Blob([html], { type: "text/html" });
          const data = [new ClipboardItem({ "text/html": blob })];
          navigator.clipboard.write(data);
        }}>Copy report to clipboard</button> and
      then paste into an email to <a href="mailto:gb@cs.unc.edu?subject=OS-DPI Error Report" target="email">gb@cs.unc.edu</a>.
      <button
        onclick=${() => {
          document.getElementById("ErrorReport").remove();
        }}
      >Dismiss this dialog</button>
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
  const frames = await StackTrace.fromError(error);
  const trace = frames.map((frame) => `${frame.toString()}`);
  report(msg.toString(), trace);
};
/** @param {PromiseRejectionEvent} error */
window.onunhandledrejection = function (error) {
  report(error.reason.message, error.reason.stack.split("\n"));
};
