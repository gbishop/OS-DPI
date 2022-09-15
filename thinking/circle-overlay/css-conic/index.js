window.addEventListener("load", () => {
  [...document.querySelectorAll("button")].map((button) => {
    button.addEventListener("pointerenter", ({ target }) =>
      target.setAttribute("cue", "button")
    );
    button.addEventListener("pointerleave", ({ target }) =>
      target.setAttribute("cue", "")
    );
  });
});
