# Code for OS-DPI components

## UI Components

audio.js: play sounds (no visual component).
button.js: A single button that generates events.
display.js: A text display for the UI.
errors.js: Display messages about internal errors.
gap.js: Create a visual gap between components.
grid.js: A flexible grid.
logger.js: Enable the designer to log events.
modal-dialog.js: A modal dialog for the UI.
page.js: Top level of the layout, derived from Stack.
radio.js: Radio buttons.
speech.js: Spoken output (no visual component).
stack.js: Allow components to be stacked horizontally or vertically.
tabcontrol.js: A tab control with or without tab buttons.
vsd.js: Visual Scene Display.

## Designer Components

access/cues: The Cues tab implements visual (and eventually) audio cues.
access/methods: The Methods tab bridges from raw browser events to Actions and Cues.
access/patterns: The Patterns tab implements scanning and groups.
actions.js: The Actions tab in the designer.
content.js: The Content tab.
customize.js: Enable tweaking the CSS.
designer.js: The top-level of the designer interface.
help.js: Implement calling out to the Wiki for help.
hotkeys.js: Keyboard hot keys.
monitor.js: Show internal state in the designer.
toolbar.js: The designer toolbar.
treebase.js: Nearly every component is derived from TreeBase.
wait.js: Display "Please Wait" during asynchronous operations that take too long.
welcome.js: Display the welcome screen.

## Helpers

color-names.js: The too-long list of color names.
helpers.js: Assorted helper functions.
img-db.js: Implement a custom component that fetches images from the DB.
index.js: Import all the components.
menu.js: Implement accessible menus.
props.js: Designer inputs for components.
style.js: Helpers for dealing with CSS.
suggest.js: An input that suggests values, not currently used.
