/** Implement a simple help system using github wiki
 */

const wiki = "https://github.com/UNC-Project-Open-AAC/OS-DPI/wiki/";

document.addEventListener("keydown", (/** @type {KeyboardEvent} */ event) => {
  if (event.key === "?" && (event.ctrlKey || event.metaKey)) {
    console.log("help", event);
    window.open(wiki + event.target.id, "help");
  }
});
