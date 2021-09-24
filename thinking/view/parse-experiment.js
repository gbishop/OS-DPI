async function main() {
  const parser = new DOMParser();

  const response = await fetch("./contact-view.frag");
  const htmlString = await response.text();

  const doc = parser.parseFromString(htmlString, "text/html");

  console.log("doc", doc);
}

window.addEventListener("load", main);
