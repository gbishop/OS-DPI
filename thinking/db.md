# Thinking about how to organize the indexed db

The key functions of the DB are:

- allow launching a design offline from a link
- undo during design
- crash recovery and reload during development
- storing log data

A design needs:

- layout
- actions
- access
- content
  - table from spreadsheet
  - text from google doc?
- images
- log data

## Model

The model I'm considering is of a small internal file system. Each design is
like a file. There are no folders, only files. Designs are identified solely by
their name. My assumption is you only have a few designs loaded at a time.

For a unified store the record structure might be like:

- name: The name of the design.
- type: One of layout, actions, access, content, image or log
- time: When this record was created for undo and crash recovery.
- saved: True if the design has been exported to a zip file.
- value: Data for the record.

## Startup

If you start the app with the bare URL you get a welcome screen with:

- a list of links to designs you have loaded,
- a _file_ input allowing you to load a previously exported design,
- a _text_ input allowing you to start a new named design.

Maybe all these open in a new tab.

If you start the app with a _hash_ on the URL and that design has been
previously loaded it will start with the UI full screen. If it doesn't recognize
the hash it will show the welcome screen with a message.

When opening a design, you query the DB using the name and get the most recently
written records. Whenever you modify the design you write a new record to the db
with the current time.

When you load a design, we can cleanup the older (undo) entries for that design
in the DB. Maybe there is a delete button on the welcome screen allowing you to
delete designs that have been loaded. Maybe we delete undo records that are
older than some threshold like 1 day.

Undo is implemented by stepping backward through records and reloading. Should
undo be linked across the various data types? I think not.

## What happens if you open the same design in 2 tabs?

I think we can use the
[Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
to force reload if a design is modified in another tab. The channel name is the
name of the design. You subscribe to the channel when using a design. If you
modify the design you `postMessage` on the channel. If you get a message you
reload everything from the DB. This supports the model that there is only one
instance of the design.

## UI and IDE State

I think UI state (the $ variables) should be persisted in
[sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
so that it is independent across tabs.

## Controls

There should be buttons on the IDE to Export the current design and to Open the
welcome page in a new tab. Any more?
