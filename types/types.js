/**
 * Allow comparing a field in the content to a constant or state variable
 *
 * @typedef {Object} ContentFilter
 * @property {string} field
 * @property {string} operator
 * @property {string} value
 */

/**
 * @typedef {Object} Props
 * @property {string} scale
 * @property {string} background
 * @property {string} fontSize
 * @property {string} selected
 * @property {string} unselected
 * @property {number} rows
 * @property {number} columns
 * @property {ContentFilter[]} filters
 * @property {string} stateName
 * @property {string} match
 * @property {string} name
 * @property {string} label
 * @property {{value: string, text: string}[]} choices
 * @property {string} direction
 * @property {string} value
 * @property {string} tabEdge
 * @property {string} voiceURI
 * @property {string} language
 * @property {number} pitch
 * @property {number} rate
 * @property {number} volume
 * @property {string} gridSize
 * @property {string} itemPlacement
 */

/**
 * @typedef {Partial<Props>} SomeProps
 */

/** @typedef {import('../components/base').Base} Tree */

/**
 * @typedef {import("../state").State} State
 */

/**
 * @typedef {Object} Context
 * @property {import("../state").State} state
 * @property {import("../rules").Rules} rules
 * @property {import("../data").Data} data
 * @property {Tree} tree
 * @property {function} restart
 */

/**
 * @typedef {Object} Design
 * @property {string} type
 * @property {SomeProps} props
 * @property {Design[]} children
 */

/**
 * @typedef {Object} Row
 * @property {string} [message]
 * @property {string} [label]
 * @property {string} [symbol]
 * @property {number} [row]
 * @property {number} [column]
 * @property {number} [page]
 * @property {Object} [details]
 * @property {string} [sheetName]
 * */

/**
 * @typedef {Object} RowCache
 * @property {Row[]} [rows]
 * @property {string} [key]
 * @property {boolean} [updated]
 */

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
 * @property {Object<string,string>} [values]
 * @property {string} [style]
 * @property {(event: InputEventWithTarget) => boolean} [validate]
 * @property {string} [addMessage]
 * @property {string[]} [states]
 * @property {string[]} [fields]
 * @property {string} [label]
 * @property {number} [step]
 * @property {number} [min]
 * @property {number} [max]
 * @property {(props:Props) => boolean} [disabled]
 */

/** @typedef {Event & { target: HTMLInputElement } } InputEventWithTarget */

/** @typedef {import('uhtml').Hole} Hole */

/** @typedef {Object} UpdateNotification
 * @property {string} action
 * @property {string} name
 * @property {string} [newName]
 */

/** @typedef {import("../components/img-db.js").imgFromDb} ImgDb */
