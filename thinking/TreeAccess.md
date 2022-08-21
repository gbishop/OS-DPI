# Thinking about TreeBase access

Can we come up with an approach to keyboard access that meets the ARIA guidelines
and works for all our controls?

Here is an abbreviated example of a typical tree from the Method tab. This is part
of a list of methods.

```html
<fieldset class="Method">
  <legend>Method: My method</legend>
  <label>
    <span>Name</span>
    <input type="text" value="My method" />
  </label>
  <label>
    <span>Active</span>
    <input type="checkbox" checked="" />
  </label>

  <fieldset>
    <legend>
      Timers
      <button class="addChildButton" title="Add a timer">+</button>
    </legend>

    <ul>
      <li>
        <label hiddenlabel="">
          <span>Name</span>
          <input type="text" />
        </label>
        <label hiddenlabel="">
          <span>Interval</span>
          <input type="number" step="any" />
        </label>
      </li>
    </ul>
  </fieldset>
  <fieldset>
    <legend>
      Handlers
      <button class="addChildButton" title="Add a key handler">+Key</button>
      <button class="addChildButton" title="Add a pointer handler">
        +Pointer
      </button>
      <button class="addChildButton" title="Add a timer handler">+Timer</button>
    </legend>
    <ol>
      <li>
        <fieldset class="Handler">
          <legend>Key Handler</legend>

          <label>
            <span>Signal</span>
            <select required="">
              <option value="" disabled="">Choose one...</option>
            </select></label
          >
          <label>
            <span>Debounce</span>
            <input type="number" step="any" />
          </label>

          <fieldset class="Keys">
            <legend>
              Keys
              <button class="addChildButton" title="Add a key">+</button>
            </legend>
            <ul>
              <li>
                <div class="Key">
                  <label hiddenlabel="">
                    <span>Key</span>
                    <select required="">
                      <option value="" disabled="">Choose one...</option>
                    </select>
                  </label>
                </div>
              </li>
            </ul>
          </fieldset>
          <fieldset class="Conditions">
            <legend>
              Conditions
              <button class="addChildButton" title="Add a condition">+</button>
            </legend>
            <ul></ul>
          </fieldset>
          <fieldset class="Responses">
            <legend>
              Responses
              <button class="addChildButton" title="Add a response">+</button>
            </legend>
            <ul>
              <li>
                <div class="Response">
                  <label hiddenlabel="">
                    <span>Response</span>
                    <select required="">
                      <option value="" disabled="">Choose one...</option>
                      <option value="Responder">none</option>
                    </select></label
                  >
                </div>
              </li>
            </ul>
          </fieldset>
        </fieldset>
      </li>
    </ol>
  </fieldset>
</fieldset>
```

A Method has Name and Active properties and children that define Timers and Handlers.
Shown here is a Key Handler includes properties to describe the Event it handlers,
any Conditions that limit when it applies, and its Response to the Event.

From the Designer's view, Timers and Handlers are just complex Properties.

- In this example you'd focus on the first fieldset and hopefully hear
  something like "Method: the method name".
- Enter would take you inside the fieldset.
- Right arrow would take you to the labels on the Inputs and enter would let you edit them.
- More right arrows take you to the Timers, and Handlers fieldsets.
- Hit Enter to go into the Handlers, you are presented with a list of Handlers.
- Stepping through them you hear the (say) Signal each is handling. Enter lets you edit one.
- Inside the Handler you visit its Properties and Keys (if present), Conditions, and Responses sets.

I think this could be described as a State Machine where the State is your location in
the DOM (with any information you need about type, parents, etc) and the input is the KeyboardEvent.
