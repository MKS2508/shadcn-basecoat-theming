# Select | Basecoat

## [Usage](#usage)

### [HTML](#usage-html)

If you use a `<select>` element, just add the `select` class to it or have a parent with the `form` class ([read more about form](/components/form)).

```
<select class="select w-[180px]">
  <optgroup label="Fruits">
    <option>Apple</option>
    <option>Banana</option>
    <option>Blueberry</option>
    <option>Grapes</option>
    <option>Pineapple</option>
  </optgroup>
</select>
```

### [HTML + JavaScript](#usage-html-js)

#### [Step 1: Include the JavaScript files](#usage-html-js-1)

You can either [include the JavaScript file for all the components](/installation/#install-cdn-all), or just the one for this component by adding this to the `<head>` of your page:

```
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/select.min.js" defer></script>
```

[Components with JavaScript](/installation/#install-js) [Use the CLI](/installation/#install-cli) [select.js](https://github.com/hunvreus/basecoat/blob/main/src/js/select.js)

#### [Step 2: Add your select HTML](#usage-html-js-2)

```
<div id="select-445592" class="select">
  <button type="button" class="btn-outline justify-between font-normal w-[180px]" id="select-445592-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="select-445592-listbox">
    <span class="truncate">Apple</span>

    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-down-icon lucide-chevrons-up-down text-muted-foreground opacity-50 shrink-0">
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  </button>
  <div id="select-445592-popover" data-popover aria-hidden="true">
    <header>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-icon lucide-search">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input type="text" value="" placeholder="Search entries..." autocomplete="off" autocorrect="off" spellcheck="false" aria-autocomplete="list" role="combobox" aria-expanded="false" aria-controls="select-445592-listbox" aria-labelledby="select-445592-trigger" />
    </header>

    <div role="listbox" id="select-445592-listbox" aria-orientation="vertical" aria-labelledby="select-445592-trigger">
      <div role="group" aria-labelledby="group-label-select-445592-items-1">
        <div role="heading" id="group-label-select-445592-items-1">Fruits</div>

        <div id="select-445592-items-1-1" role="option" data-value="apple" aria-selected="true">Apple</div>

        <div id="select-445592-items-1-2" role="option" data-value="banana">Banana</div>

        <div id="select-445592-items-1-3" role="option" data-value="blueberry">Blueberry</div>

        <div id="select-445592-items-1-4" role="option" data-value="pineapple">Grapes</div>

        <div id="select-445592-items-1-5" role="option" data-value="pineapple">Pineapple</div>
      </div>
    </div>
  </div>
  <input type="hidden" name="select-445592-value" value="apple" />
</div>
```

#### [HTML structure](#usage-html-js-3)

`<div class="select">`

Wraps around the entire component.

`<button type="button" popovertarget="{ POPOVER_ID }">`

The trigger to open the popover, can also have the following attributes:

-   `id="{BUTTON_ID}"`: linked to by the `aria-labelledby` attribute of the listbox.
-   `aria-haspopup="listbox"`: indicates that the button opens a listbox.
-   `aria-controls="{ LISTBOX_ID }"`: points to the listbox's id.
-   `aria-expanded="false"`: tracks the popover's state.
-   `aria-activedescendant="{ OPTION_ID }"`: points to the active option's id.

`<div popover class="popover" id="{ POPOVER_ID }">`

As with the [Popover](/components/popover) component, you can set up the side and alignment of the popover using the `data-side` and `data-align` attributes.

`<div role="listbox">`

The listbox containing the options. Should have the following attributes:

-   `id="{ LISTBOX_ID }"`: refered to by the `aria-controls` attribute of the trigger.
-   `aria-labelledby="{ BUTTON_ID }"`: linked to by the button's `id` attribute.

`<div role="option" data-value="{ VALUE }">`

Option that can be selected.Should have a unique id if you use the `aria-activedescendant` attribute on the trigger.

`<hr role="separator">` Optional

Separator between groups/options.

`<div role="group">` Optional

Group of options, can have a `aria-labelledby` attribute to link to a heading.

`<span role="heading">`

Group heading, must have an `id` attribute if you use the `aria-labelledby` attribute on the group.

`<input type="hidden" name="{ NAME }" value="{ VALUE }">` Optional

The hidden input that holds the value of the field (if needed).

#### [JavaScript events](#usage-html-js-4)

`basecoat:initialized`

Once the component is fully initialized, it dispatches a custom (non-bubbling) `basecoat:initialized` event on itself.

`basecoat:popover`

When the popover opens, the component dispatches a custom (non-bubbling) `basecoat:popover` event on `document`. Other popover components (Combobox, Dropdown Menu, Popover and Select) listen for this to close any open popovers.

`change`

When the selected value changes, the component dispatches a custom (bubbling) `change` event on itself, with the selected value in `event.detail` (e.g. `{ detail: { value: "something" }}`).

#### [JavaScript methods](#usage-html-js-5)

`selectByValue`

You can call this method on the component after it is initialized to select an option by value (i.e. the option with the matching `data-value` attribute):

```
<script>
  const selectComponent = document.querySelector("#my-select");
  selectComponent.addEventListener("basecoat:initialized", () => {
    selectComponent.selectByValue("apple");
  });
</script>
```

### [Jinja and Nunjucks](#usage-macro)

You can use the `select()` Nunjucks or Jinja macro for this component.

[Use Nunjucks or Jinja macros](/installation/#install-macros) [Jinja macro](https://github.com/hunvreus/basecoat/blob/main/src/jinja/dialog.html.jinja) [Nunjucks macro](https://github.com/hunvreus/basecoat/blob/main/src/nunjucks/dialog.njk)

```
{{ select(
  items=[
    {
      type: "group",
      label: "Fruits",
      items: [
        { type: "item", value: "apple", label: "Apple" },
        { type: "item", value: "banana", label: "Banana" },
        { type: "item", value: "blueberry", label: "Blueberry" },
        { type: "item", value: "grapes", label: "Grapes" },
        { type: "item", value: "pineapple", label: "Pineapple" }
      ]
    }
  ]
) }}
```

## [Examples](#examples)

### [Scrollable](#example-scrollable)

### [Disabled](#example-disabled)

### [With icon](#example-with-icon)