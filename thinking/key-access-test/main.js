import "./style.css";

function Log(event) {
  console.log(event.type, event.target, event.target.tagName, event.key);
}

document.body.addEventListener("keydown", handle);

function handle(event) {
  Log(event);
  const target = event.target;
  const tagName = target.tagName.toLowerCase();
  const key = event.key;
  for (const handler of HandlerTable) {
    if (tagName.match(handler.tagName) && key.match(handler.key)) {
      console.log("caught", handler);
      handler.action(target);
      break;
    }
  }
}

/** @param {HTMLElement} node */
function getChildren(node) {
  // should exclude children of nested fieldsets
  const children = node.querySelectorAll("[tabindex]");
  return /** @type {HTMLElement[]} */ ([...children]);
}

/** @param {HTMLElement} node */
function getParent(node) {
  return node.closest("fieldset");
}

/**
 * @param {HTMLElement} from
 * @param {HTMLElement} to
 * */
function focusFromTo(from, to) {
  from.setAttribute("tabindex", "-1");
  to.setAttribute("tabindex", "0");
  to.focus();
}

/** @param {HTMLElement} target */
function firstChild(target) {
  const children = getChildren(target);
  const first = children[0];
  focusFromTo(target, first);
}

/** @param {HTMLElement} target */
function nextChild(target) {
  const parent = getParent(target);
  if (!parent) return;
  const peers = getChildren(parent);
  const index = peers.indexOf(target);
  if (index < peers.length - 1) {
    const next = peers[index + 1];
    focusFromTo(target, next);
  }
}

/** @param {HTMLElement} target */
function prevChild(target) {
  const parent = getParent(target);
  if (!parent) return;
  const peers = getChildren(parent);
  const index = peers.indexOf(target);
  if (index > 0) {
    const next = peers[index - 1];
    focusFromTo(target, next);
  }
}

/** @typedef {Object} HandlerEntry
 * @property {RegExp} tagName
 * @property {RegExp} key
 * @property {(target: HTMLElement) => void} action
 *
 * @type {HandlerEntry[]} */
const HandlerTable = [
  { tagName: /fieldset/, key: /F2/, action: firstChild },
  {
    tagName: /.*/,
    key: /F2/,
    /** @param {HTMLElement} target */
    action(target) {
      focusFromTo(target, getParent(target));
    },
  },
  { tagName: /.*/, key: /ArrowRight|ArrowDown/, action: nextChild },
  { tagName: /.*/, key: /ArrowLeft|ArrowUp/, action: prevChild },
];
