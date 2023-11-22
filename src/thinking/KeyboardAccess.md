# Thinking about keyboard access in the designer

In the split display. Maybe the UI is only a single tab location at its top
level. Activating it with space or enter, allows moving around within it using
the arrows just like the tree. Maybe you're just moving in the tree effectively.

In the DI (right half of the screen). The Tree is only a single tab location.
You use space/enter to activate it then you move with the arrow keys. This is
WAI standard behavior. Activating a tree entry with space/enter jumps focus to
the editing controls for that node. Where is focus? On the menu? On the first
input?

How do you get back to the tree? Maybe tabbing out of the controls takes you
back to the tree?

Maybe there is a button in the tab order to go the UI? It could be after the
tree.

So the tab order could be:

1.  Tree (space to activate)

    - Arrows to move
    - Space/enter to edit

      - Tab to move between editor controls
      - Tab out of last control to return to Tree

    - Tab to go to UI

2.  UI (space to activate)

    - Arrows to move
    - Tab to return to Tree
