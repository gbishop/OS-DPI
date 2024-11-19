# Thinking about how the IDE should work

What do you see when the IDE is started?

We could have an opening screen with some guidance. It could have links to open
our demo designs, a **+New** button to create a new blank design and an Import
button for reading previously saved designs from the local machine. We should
have a **Save As** capability so you can have versions of the same design.

We don't have to stay in the same browser tab. We could have the IDE open in a
new tab once the selection is made.

I think we should be able to share a URL that opens the app in User mode without
further interaction.

Maybe we need a pull-down menu at the top of the IDE pane. It could have Open,
New, Import, Export, etc.

Images for symbols and visual-scene displays will either have a full URL in the
spreadsheet or they could be _uploaded_ and stored in your browser. How to name
the images? They could be in virtual _folders_ per design but that is going to
introduce duplication that might be problematic. I guess we could de-dup with
hashes; all the machinery is available in the browser. We've also got to worry
about people uploading huge high-resolution images, maybe we force resizing?

When we export a design do we localize the images that are URLs? Maybe that is
an option?
