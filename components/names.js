/**
 * Provide user friendly names for the components
 */

/**
 * Map the classname into the Menu name and the Help Wiki page name
 */
const namesMap = {
  Action: ["Action", "Actions"],
  ActionCondition: ["Condition", "Actions#Condition"],
  Actions: ["Actions", "Actions"],
  ActionUpdate: ["Update", "Actions#Update"],
  Audio: ["Audio", "Audio"],
  Button: ["Button", "Button"],
  Content: ["Content", "Content"],
  CueCircle: ["Circle", "Cues"],
  CueCss: ["CSS", "Cues#CSS"],
  CueFill: ["Fill", "Cues#Fill"],
  CueList: ["Cues", "Cues"],
  CueOverlay: ["Overlay", "Cues#Overlay"],
  Customize: ["Customize", "Customize"],
  Designer: ["Designer", "Designer"],
  Display: ["Display", "Display"],
  Filter: ["Filter", "Patterns#Filter"],
  Gap: ["Gap", "Gap"],
  Grid: ["Grid", "Grid"],
  GridFilter: ["Filter", "Grid#Filter"],
  GroupBy: ["Group By", "Patterns#Group By"],
  HandlerCondition: ["Condition", "Methods#Condition"],
  HandlerKeyCondition: ["Key Condition", "Methods#Key Condition"],
  HandlerResponse: ["Response", "Methods#Response"],
  HeadMouse: ["Head Mouse", "Head Mouse"],
  KeyHandler: ["Key Handler", "Methods#Key Handler"],
  Layout: ["Layout", "Layout"],
  Logger: ["Logger", "Logger"],
  Method: ["Method", "Methods"],
  MethodChooser: ["Methods", "Methods"],
  ModalDialog: ["Modal Dialog", "Modal Dialog"],
  Option: ["Option", "Radio#Option"],
  OrderBy: ["Order By", "Patterns#Order By"],
  Page: ["Page", "Page"],
  PatternGroup: ["Group", "Patterns"],
  PatternList: ["Patterns", "Patterns"],
  PatternManager: ["Pattern", "Patterns"],
  PatternSelector: ["Selector", "Patterns"],
  PointerHandler: ["Pointer Handler", "Methods#Pointer Handler"],
  Radio: ["Radio", "Radio"],
  ResponderActivate: ["Activate", "Methods#Activate"],
  ResponderCue: ["Cue", "Methods#Cue"],
  ResponderClearCue: ["Clear Cue", "Methods#Clear Cue"],
  ResponderEmit: ["Emit", "Methods#Emit"],
  ResponderNext: ["Next", "Methods#Next"],
  ResponderStartTimer: ["Start Timer", "Methods"],
  SocketHandler: ["Socket Handler", "Methods#Socket Handler"],
  Speech: ["Speech", "Speech"],
  Stack: ["Stack", "Stack"],
  TabControl: ["Tab Control", "Tab Control"],
  TabPanel: ["Tab", "Tab"],
  Timer: ["Timer", "Methods#Timer"],
  TimerHandler: ["Timer Handler", "Methods#Timer Handler"],
  VSD: ["VSD", "VSD"],
};

/**
 * Get the name for a menu item from the class name
 * @param {string} className
 */
export function friendlyName(className) {
  return className in namesMap ? namesMap[className][0] : className;
}

/**
 * Get the Wiki name from the class name
 * @param {string} className
 */
export function wikiName(className) {
  return namesMap[className][1].replace(" ", "-");
}
