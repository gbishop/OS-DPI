# Thinking about sequenced data

`sequencedAlpha.py` is a hack for generating tagged input for 100 common words.
`sequencedAlpha.json` is its output.

There are several things wrong here.

1. Simply to keep the CLEAR button in place we have to repeat its entry over 100
   times with every different set of tags. I hate that.

2. We don't have a way to handle words that are prefixes of other words. Maybe
   we need a SPEAK button that is active when the thing currently displayed is a
   legal word? This isn't meant to be a useful AAC device, just a demo of how to
   do sequenced input but it should work...

## Fixed buttons

I see two solutions for the first issue. One would be to have some sort of
notation that matches anything. Then the entry for CLEAR could have tags: ['.*']
or some such.

Another possibility would be to have "rules" for selection and placement of
buttons similar to the action rules. Like action rules they'd be tested in order
and the first would succeed. So the rules might look like:

if the row is 1 and the column is 1 then select CLEAR

if item.tags match tags in sequence then select item

Not that syntax but that idea. This might work well for having one row of a grid
dynamically show the most likely choices and other rows remaining static.

## When to speak?

What to do about the 2nd? Choose another representation? Maybe some Googling for
sequenced systems that aren't patented?
