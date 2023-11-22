# More thinking about keyboard access to the IDE

```html
<fieldset class="widget" tabindex=0>
  <legend>Widget 1</legend>

  <label>An simple input that doesn't need arrows
    <input type="checkbox" tabindex="-1"/>
  </label>

  <label>An input that needs arrows
    <select tabindex="-1"/>
      <option>choice 1</option>
      <option>choice 2</option>
    </select>
  </label>

</fieldset>
```
