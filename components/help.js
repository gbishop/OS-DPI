/** Implement a simple help system using github wiki
 */

const wiki = "https://github.com/UNC-Project-Open-AAC/OS-DPI/wiki/";

document.addEventListener("keydown", (/** @type {KeyboardEvent} */ event) => {
  if (
    (event.key === "?" || event.key === "/") &&
    (event.ctrlKey || event.metaKey)
  ) {
    event.preventDefault();
    console.log("help", event);
    const target = /** @type {Element} */ (event.target);
    let help = target.getAttribute("help");
    if (!help) {
      const node = target.closest("[help]");
      if (node) {
        help = node.getAttribute("help");
      } else {
        help = "";
      }
    }
    window.open(wiki + help, "help");
  }
});
