# Thinking about access

## Raw signals available

The signals available from the browser include:

- keyboard
  - keydown
  - keyup (we'll need to disable autorepeat)
- mouse and touch
  - click
  - dblclick
  - pointerdown
  - pointermove
  - pointerout
  - pointerover
  - pointerup
- timers
- acceleration and orientation
- location
- sound
- video

## Conditioning

We need to _condition_ the raw inputs to prevent accidental triggers.

Conditioners could include:

- Minimum on time: time the signal must be on before it is considered active.
- Minimum off time: time the signal must be off before it is considered inactive.
- Minimum idle time: time between successive activations.
- Hover padding: area outside of a button that activates hover state. Something like hysteresis or stickiness for eye-gaze users.

## Scanned access

The most interesting part of scanned access is the access pattern.

I'd like for researchers to be able to define their own new and general patterns but I don't want those who only want something _standard_ to be confronted with too much complexity.

We could use _scan groups_ that define the order of visitation. A _scan group_ might be defined as a nested list of buttons or other scan groups. Each group has a single parent and one or more children. You start at the top of the hierarchy choosing among elements at the top level. If you select a nested group, you then scan it.

A designer should be free to explicitly list every item if they wish but shouldn't be required to. Perhaps we could have common patterns represented as functions with a few parameters.

On complicated user interfaces with tab controls, radio buttons and such, I think we should adapt the [strategies](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets) recommended by the Web Accessibility Initiative. They assume multiple user inputs (tab, enter, arrow keys) but I think we can adapt their guidance. They suggest scanning components first in an order specified by the designer, then elements in the component. In the _Contact_ simulation you might visit the tab control as a group, followed by the Quick grid _tone_ buttons as a group, then the Quick grid.

I'm thinking when a group includes only one component, that component is immediately selected. Another example would be a grid that contains only 1 row or a row that contains only 1 active column. Maybe you start with the individual items instead of selecting the single row first. If a group has only one member, an optimization would be to go directly to that member.

```
No:
  Cycle through current scan group
    up to (number) times or
  then
    [offer to] go back to parent
```

```
Yes on a scan group:
  make it current
```

```
Yes on a button:
  activate it
  then

```

You might specify the scanning of a grid like this with increasing indentation indicating the user choosing YES.

```
grid
  scan through rows 1 time then ask if they want to continue
    scan columns up to 3 times then ask if they want to continue
      issue "press" event and start over with rows
```

You change the order of components by naming them.

```
Quick
  Quick grid
  Quick tone
Chat Menu
Chat
Task Menu
Task
```

If you don't specify the children, you get the default order so you only have to name the parts you want to change.

Perhaps you can specify a default for all components of a given type. Or maybe you can name patterns and then apply them to components.

### 1-switch parameters

- input: which conditioned input is used to control
- step interval: time between automatic steps
- restart scan: time interval or restart on button hit

### 2-switch parameters

- inputs: which conditioned inputs are used to control

### more switches

You should be able to bind events to conditioned inputs to do things like

- move up in the hierarchy
- go backward
- jump to somewhere else

### Highlighting groups

Designers should be able to specify how groups are to be highlighted to make it clear what is currently being chosen. This could be done with explicit CSS with a few examples already defined. Highlights might include:

- border color
- background color
- drop shadow
- size

## Eye tracker access

I'm assuming that the eye tracker looks to us like a mouse with no buttons. That is, you can move the pointer but you can't click. If they are using an Eye-Gaze device they likely should use its ability to click on dwell.

I think we can easily support adjustable gaps between buttons.

Buttons might grow to fill the gap when the pointer is hovered over them. This could provide some hysteresis for selections making it easy to avoid rapidly cycling between choices.

It should be possible to support effects like filling the button from the outside-in to draw the eye to the middle during the hover interval.

### Eye tracker parameters

- dwell interval for click
- dwell effects

## Touch access

We should be able to highlight (or announce?) choices when the user touches a button but only activate it when they release without touching another.

We should also be able to emulate iOS VoiceOver; you find the choice you want, release, and then tap again to activate.
