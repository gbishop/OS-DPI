/**
 * @typedef {Object} AllProps
 * @property {string} scale
 * @property {string} background
 * @property {string} selected
 * @property {string} unselected
 * @property {number} rows
 * @property {number} columns
 * @property {string[]} tags
 * @property {string} stateName
 * @property {string} match
 * @property {string} name
 * @property {string} label
 * @property {{value: string, text: string}[]} choices
 * @property {string} direction
 * @property {string} value
 * @property {string} tabEdge
 */

/**
 * @typedef {Partial<AllProps>} Props
 */

/** @typedef {import('../components/base').Base} Tree */

/**
 * @typedef {Object} Context
 * @property {import("../state").State} state
 * @property {import("../rules").Rules} [rules]
 * @property {import("../data").Data} [data]
 * @property {Tree} [tree]
 */

/**
 * @typedef {Object} Design
 * @property {string} type
 * @property {Props} props
 * @property {Design[]} children
 */

/**
 * @typedef {Object} Row
 * @property {string[]} tags
 * @property {string} [message]
 * @property {string} [label]
 * @property {string} [symbol]
 * @property {number} [row]
 * @property {number} [column]
 * @property {Object} [details]
 * */

/**
 * @typedef {Row[]} Rows
 */

/**
 * @typedef {Object} Rule
 * @property {string} origin
 * @property {string} event
 * @property {string[]} conditions
 * @property {Object<string, string>} updates
 */

/** @typedef {Object} PropertyInfo
 * @property {string} type
 * @property {string} name
 * @property {string} description
 * @property {string[]} [values]
 * @property {string} [style]
 * @property {(event: InputEventWithTarget) => boolean} [validate]
 * @property {string} [addMessage]
 * @property {string[]} [states]
 * @property {string[]} [fields]
 * @property {string} [label]
 */

/** @typedef {Event & { target: HTMLInputElement } } InputEventWithTarget */

/** @typedef {import('uhtml').Hole} Hole */
