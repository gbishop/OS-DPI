/**
 * Allow comparing a field in the content to a constant or state variable
 *
 * @typedef {Object} ContentFilter
 * @property {string} field
 * @property {string} operator
 * @property {string|number|boolean} value
 */

/**
 * Selectors let us build groups of buttons
 *
 * @typedef {Object} Selector
 * @property {string} operatorName
 * @property {OperatorArg[]} args
 *
 * @typedef {Object} OperatorArg
 * @property {string} type
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
 * @property {string} name
 * @property {string} label
 * @property {{value: string, text: string}[]} choices
 * @property {string} direction
 * @property {string} value
 * @property {string} tabEdge
 * @property {string} voiceURI
 * @property {number} pitch
 * @property {number} rate
 * @property {number} volume
 * @property {boolean} fillItems
 */

/**
 * @typedef {Partial<Props>} SomeProps
 */

/** @typedef {import('components/treebase').TreeBase} TreeBase */

/**
 * @typedef {import("app/state").State} State
 */

/**
 * @typedef {Object} DesignObject
 * @property {Object} [layout]
 * @property {Object} [actions]
 * @property {Object} [content]
 * @property {Object} [cues]
 * @property {Object} [pattern]
 * @property {Object} [method]
 * @property {{name: string, content: Blob}[]} [media]
 */

/**
 * @typedef {Object<string,any>} Row
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

/** @typedef {import("components/img-db.js").imgFromDb} ImgDb */

/** @typedef {Event & {access: Object}} WrappedEvent */

/**
 * @typedef {EventTarget | import("components/access/pattern/index.js").Group | null} Target
 */

/** @typedef {{target: Target, index: number}} TargetWithIndex */

/**
 * @typedef {Object} EventLike
 * @property {string} type
 * @property {Target} target
 * @property {number} timeStamp
 * @property {Object<string,any>} [access]
 * @property {Target} [originalTarget]
 * @property {number} [groupIndex]
 */

/**
 * @typedef {Object} EvalContext
 * @property {{[key: string]: string}} [states]
 * @property {{[key: string]: string} | DOMStringMap } [data]
 * @property {{[key: string]: function}} [Functions]
 */

/**
 * @typedef {Object} ExternalRep
 * @property {string} className
 * @property {Object<string, string | number | boolean>} props
 * @property {ExternalRep[]} children
 * @property {string} [id]
 */
