/* Thinking about making the UI more uniform and easier to program */

import { html, svg } from "uhtml";
import css from "ustyler";
import { styleString } from "./style";
// import { Trash, DownArrow, UpArrow } from "./icons";
import * as icons from "./icons";

// alternating styles for nested elements
const Backgrounds = ["#f6f6ff", "#f0f0ff", "#e6e6ff"].map(
  (color) => `background: ${color}`
);

function EditHelpers(refresh) {
  return {
    upButton(container, index) {
      return html`<button
        ?disabled=${index == 0}
        onClick=${() => {
          const item = container[index];
          container[index] = container[index - 1];
          container[index - 1] = item;
          refresh();
        }}
      >
        UpArrow
      </button>`;
    },
    downButton(container, index) {
      return html`<button
        ?disabled=${index >= container.length - 1}
        onClick=${() => {
          const item = container[index];
          container[index] = container[index + 1];
          container[index + 1] = item;
          refresh();
        }}
      >
        DownArrow
      </button>`;
    },
    deleteButton(container, index) {
      return html`<button
        onClick=${() => {
          container.splice(index, 1);
          refresh();
        }}
      >
        Trash
      </button>`;
    },
    addButton(container, item, label) {
      return html`<button
        onClick=${() => {
          container.push(item);
          refresh();
        }}
      >
        ${label}
      </button>`;
    },
  };
}

const exampleGroup = {
  name: "Top",
  cycles: 2,
  members: [
    {
      name: "Controls",
      cycles: 2,
      members: [
        [
          {
            filter: "#controls",
            comparison: "is not empty",
          },
          {
            orderBy: "#controls",
          },
        ],
      ],
    },
    [
      {
        filter: "#controls",
        comparison: "is empty",
      },
      {
        groupBy: "#name",
        name: "#name",
      },
      {
        groupBy: "#row",
        name: "row #row",
      },
    ],
  ],
};

function renderGroup(group, index = 0, parent = null, background = 0) {
  return html`<fieldset style="${Backgrounds[background]}">
    ${parent
      ? html`<legend>Group: ${group.name}</legend>
          <label>Name:</label><input type="string" .value=${group.name} />`
      : html``}

    <label>Cycles:</label><input type="number" min="1" .value=${group.cycles} />
    <ol class="groupmembers">
      ${group.members.map((member, index, memberContainer) => {
        const nextColor = (background + (index % 2) + 1) % 3;
        const render = "name" in member ? renderGroup : renderSelector;
        return html`<li>
          ${render(member, index, memberContainer, nextColor)}
        </li>`;
      })}
    </ol>
    <button>+Selector</button>
    <button>+Group</button>
    ${renderMovementButtons(group, index, parent)}
  </fieldset> `;
}

function renderSelector(selector, index, parent, background) {
  return html`<fieldset class="selector" style=${Backgrounds[background]}>
    <legend>Selector</legend>
    <ul>
      ${selector.map(
        (operator, index, member) =>
          html` <li>
            ${renderOperator(operator, index, member)}<button
              title="Delete operator"
            >
              ${icons.Trash}
            </button>
          </li>`
      )}
    </ul>
    <button>+Filter</button>
    <button>+Order by</button>
    <button>+Group by</button>
    ${renderMovementButtons(selector, index, parent)}
  </fieldset>`;
}

function renderOperator(op, index, list) {
  if ("filter" in op) {
    return html`<label>Filter</label>
      <input type="string" .value=${op.filter} />
      <input type="string" .value=${op.comparison} /> `;
  } else if ("orderBy" in op) {
    return html`<label>Order by</label>
      <input type="string" .value=${op.orderBy} /> `;
  } else if ("groupBy" in op) {
    return html`<label>Group by</label>
      <input type="string" .value=${op.groupBy} title="Field name" />
      <label>Name: </label
      ><input type="string" .value=${op.name} title="Name for each group" />`;
  }
}

function renderMovementButtons(item, index, container) {
  if (container) {
    return html`<div class="movement">
      <button ?disabled=${index == 0}>${icons.UpArrow}</button>
      <button ?disabled=${index == container.length - 1}>
        ${icons.DownArrow}
      </button>
      <button>${icons.Trash}</button>
    </div>`;
  } else {
    return html``;
  }
}

export function test() {
  return renderGroup(exampleGroup);
}

css`
  .movement {
    margin-top: 0.5em;
  }
  .movement button {
  }
  button svg {
    object-fit: contain;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    margin: -4px;
  }
  .access button {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 0.5em;
    border: outset;
  }
  .access fieldset {
    margin-bottom: 0.5em;
  }
  .access ol {
    padding-inline-start: 10px;
  }
  .access ul {
    padding-inline-start: 10px;
  }
`;

/* Syntax?

Group name="Controls" cycles=2
  Select #controls is not empty order by #controls
End group
Select #controls is empty group by #name group by #row
*/
