# Dropdown Menu | Basecoat

## Usage

### [HTML + JavaScript](#usage-html-js)

#### [Step 1: Include the JavaScript files](#usage-html-js-1)

You can either [include the JavaScript file for all the components](/installation/#install-cdn-all), or just the one for this component by adding this to the `<head>` of your page:

```
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/dropdown-menu.min.js" defer></script>
```

[Components with JavaScript](/installation/#install-js) [Use the CLI](/installation/#install-cli) [dropdown-menu.js](https://github.com/hunvreus/basecoat/blob/main/src/js/dropdown-menu.js)

#### [Step 2: Add your dropdown menu HTML](#usage-html-js-2)

```
<div id="demo-dropdown-menu" class="dropdown-menu">
  <button type="button" id="demo-dropdown-menu-trigger" aria-haspopup="menu" aria-controls="demo-dropdown-menu-menu" aria-expanded="false" class="btn-outline">Open</button>
  <div id="demo-dropdown-menu-popover" data-popover aria-hidden="true" class="min-w-56">
    <div role="menu" id="demo-dropdown-menu-menu" aria-labelledby="demo-dropdown-menu-trigger">
      <div role="group" aria-labelledby="account-options">
        <div role="heading" id="account-options">My Account</div>
        <div role="menuitem">
          Profile
          <span class="text-muted-foreground ml-auto text-xs tracking-widest">⇧⌘P</span>
        </div>
        <div role="menuitem">
          Billing
          <span class="text-muted-foreground ml-auto text-xs tracking-widest">⌘B</span>
        </div>
        <div role="menuitem">
          Settings
          <span class="text-muted-foreground ml-auto text-xs tracking-widest">⌘S</span>
        </div>
        <div role="menuitem">
          Keyboard shortcuts
          <span class="text-muted-foreground ml-auto text-xs tracking-widest">⌘K</span>
        </div>
      </div>
      <hr role="separator" />
      <div role="menuitem">GitHub</div>
      <div role="menuitem">Support</div>
      <div role="menuitem" aria-disabled="true">API</div>
      <hr role="separator" />
      <div role="menuitem">
        Logout
        <span class="text-muted-foreground ml-auto text-xs tracking-widest">⇧⌘P</span>
      </div>
    </div>
  </div>
</div>
```

#### [HTML structure](#usage-html-js-3)

`<div class="dropdown-menu">`

Wraps around the entire component.

`<button type="button" popovertarget="{ POPOVER_ID }">`

The trigger to open the popover, can also have the following attributes:

-   `id="{BUTTON_ID}"`: linked to by the `aria-labelledby` attribute of the listbox.
-   `aria-haspopup="menu"`: indicates that the button opens a menu.
-   `aria-controls="{ MENU_ID }"`: points to the menu's id.
-   `aria-expanded="false"`: tracks the popover's state.

`<div popover class="popover" id="{ POPOVER_ID }">`

As with the [Popover](/components/popover) component, you can set up the side and alignment of the popover using the `data-side` and `data-align` attributes.

`<div role="menu">`

The menu containing the options. Should have the following attributes:

-   `id="{ MENU_ID }"`: refered to by the `aria-controls` attribute of the trigger.
-   `aria-labelledby="{ BUTTON_ID }"`: linked to by the button's `id` attribute.

`<button role="menuitem">`

Menu item.

`<button role="menuitemcheckbox">`

Menu item with a checkbox.

`<button role="menuitemradio">`

Menu item with a radio button.

`<hr role="separator">` Optional

Separator between groups/options.

`<div role="group">` Optional

Group of options, can have a `aria-labelledby` attribute to link to a heading.

`<span role="heading">`

Group heading, must have an `id` attribute if you use the `aria-labelledby` attribute on the group.

#### [JavaScript events](#usage-html-js-4)

`basecoat:initialized`

Once the component is fully initialized, it dispatches a custom (non-bubbling) `basecoat:initialized` event on itself.

`basecoat:popover`

When the popover opens, the component dispatches a custom (non-bubbling) `basecoat:popover` event on `document`. Other popover components (Combobox, Dropdown Menu, Popover and Select) listen for this to close any open popovers.

### [Jinja and Nunjucks](#usage-macro)

You can use the `dropdown_menu()` Nunjucks or Jinja macro for this component.

[Use Nunjucks or Jinja macros](/installation/#install-macros) [Jinja macro](https://github.com/hunvreus/basecoat/blob/main/src/jinja/dropdown-menu.html.jinja) [Nunjucks macro](https://github.com/hunvreus/basecoat/blob/main/src/nunjucks/dropdown-menu.njk)

```
{% call dropdown_menu(
  id="dropdown-menu",
  trigger="Open",
  trigger_attrs={"class": "btn-outline"},
  popover_attrs={"class": "min-w-56"}
) %}
<div role="group" aria-labelledby="account-options">
  <div role="heading" id="account-options">My Account</div>
  <div role="menuitem">
    Profile
    <span class="text-muted-foreground ml-auto text-xs tracking-widest">⇧⌘P</span>
  </div>
  <div role="menuitem">
    Billing
    <span class="text-muted-foreground ml-auto text-xs tracking-widest">⌘B</span>
  </div>
  <div role="menuitem">
    Settings
    <span class="text-muted-foreground ml-auto text-xs tracking-widest">⌘S</span>
  </div>
  <div role="menuitem">
    Keyboard shortcuts
    <span class="text-muted-foreground ml-auto text-xs tracking-widest">⌘K</span>
  </div>
</div>
<hr role="separator">
<div role="menuitem">
  GitHub
</div>
<div role="menuitem">
  Support
</div>
<div role="menuitem" disabled>
  API
</div>
<hr role="separator">
<div role="menuitem">
  Logout
  <span class="text-muted-foreground ml-auto text-xs tracking-widest">⇧⌘P</span>
</div>
{% endcall %}
```

## [Examples](#examples)

### [Checkboxes](#example-checkboxes)

### [Radio Group](#example-radio-group)