# Tabs | Basecoat

## Account

Make changes to your account here. Click save when you're done.

## [Usage](#usage)

#### [Step 1: Include the JavaScript files](#usage-html-js-1)

You can either [include the JavaScript file for all the components](/installation/#install-cdn-all), or just the one for this component by adding this to the `<head>` of your page:

```
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/tabs.min.js" defer></script>
```

[Components with JavaScript](/installation/#install-js) [Use the CLI](/installation/#install-cli) [tabs.js](https://github.com/hunvreus/basecoat/blob/main/src/js/tabs.js)

#### [Step 2: Add your select HTML](#usage-html-js-2)

```
<div class="tabs w-full" id="demo-tabs-with-panels">
  <nav role="tablist" aria-orientation="horizontal" class="w-full">
    <button type="button" role="tab" id="demo-tabs-with-panels-tab-1" aria-controls="demo-tabs-with-panels-panel-1" aria-selected="true" tabindex="0">Account</button>

    <button type="button" role="tab" id="demo-tabs-with-panels-tab-2" aria-controls="demo-tabs-with-panels-panel-2" aria-selected="false" tabindex="0">Password</button>
  </nav>

  <div role="tabpanel" id="demo-tabs-with-panels-panel-1" aria-labelledby="demo-tabs-with-panels-tab-1" tabindex="-1" aria-selected="true">
    <div class="card">
      <header>
        <h2>Account</h2>
        <p>Make changes to your account here. Click save when you're done.</p>
      </header>
      <section>
        <form class="form grid gap-6">
          <div class="grid gap-3">
            <label for="demo-tabs-account-name">Name</label>
            <input type="text" id="demo-tabs-account-name" value="Pedro Duarte" />
          </div>
          <div class="grid gap-3">
            <label for="demo-tabs-account-username">Username</label>
            <input type="text" id="demo-tabs-account-username" value="@peduarte" />
          </div>
        </form>
      </section>
      <footer>
        <button type="button" class="btn">Save changes</button>
      </footer>
    </div>
  </div>

  <div role="tabpanel" id="demo-tabs-with-panels-panel-2" aria-labelledby="demo-tabs-with-panels-tab-2" tabindex="-1" aria-selected="false" hidden>
    <div class="card">
      <header>
        <h2>Password</h2>
        <p>Change your password here. After saving, you'll be logged out.</p>
      </header>
      <section>
        <form class="form grid gap-6">
          <div class="grid gap-3">
            <label for="demo-tabs-password-current">Current password</label>
            <input type="password" id="demo-tabs-password-current" />
          </div>
          <div class="grid gap-3">
            <label for="demo-tabs-password-new">New password</label>
            <input type="password" id="demo-tabs-password-new" />
          </div>
        </form>
      </section>
      <footer>
        <button type="button" class="btn">Save Password</button>
      </footer>
    </div>
  </div>
</div>
```

#### [HTML structure](#usage-html-js-3)

`<div class="tabs">`

Wraps around the entire component.

`<nav role="tablist" aria-orientation="horizontal">`

The tablist containing the tab buttons

`<button role="tab" id="{ TAB_ID }" aria-controls="{ PANEL_ID }" aria-selected="false" tabindex="0">`

The tab button. When active, the `aria-selected` attribute is set to `true`. `tabindex="0"` is required for keyboard navigation.

`<div role="tabpanel" id="{ PANEL_ID }" aria-labelledby="{ TAB_ID }" tabindex="-1" aria-selected="false">`

The tab panel. When active, the `aria-selected` attribute is set to `true`.

#### [JavaScript events](#usage-html-js-4)

`basecoat:initialized`

Once the component is fully initialized, it dispatches a custom (non-bubbling) `basecoat:initialized` event on itself.

### [Jinja and Nunjucks](#usage-macro)

You can use the `tabs()` Nunjucks or Jinja macro for this component.

[Use Nunjucks or Jinja macros](/installation/#install-macros) [Jinja macro](https://github.com/hunvreus/basecoat/blob/main/src/jinja/tabs.html.jinja) [Nunjucks macro](https://github.com/hunvreus/basecoat/blob/main/src/nunjucks/tabs.njk)

```
{% set account_panel %}
<div class="card">
  <header>
    <h2>Account</h2>
    <p>Make changes to your account here. Click save when you're done.</p>
  </header>
  <section>
    <form class="form grid gap-6">
      <div class="grid gap-3">
        <label for="demo-tabs-account-name">Name</label>
        <input type="text" id="demo-tabs-account-name" value="Pedro Duarte" />
      </div>
      <div class="grid gap-3">
        <label for="demo-tabs-account-username">Username</label>
        <input type="text" id="demo-tabs-account-username" value="@peduarte" />
      </div>
    </form>
  </section>
  <footer>
    <button type="button" class="btn">Save changes</button>
  </footer>
</div>
{% endset %}

{% set password_panel %}
<div class="card">
  <header>
    <h2>Password</h2>
    <p>Change your password here. After saving, you'll be logged out.</p>
  </header>
  <section>
    <form class="form grid gap-6">
      <div class="grid gap-3">
        <label for="demo-tabs-password-current">Current password</label>
        <input type="password" id="demo-tabs-password-current" />
      </div>
      <div class="grid gap-3">
        <label for="demo-tabs-password-new">New password</label>
        <input type="password" id="demo-tabs-password-new"/>
      </div>
    </form>
  </section>
  <footer>
    <button type="button" class="btn">Save Password</button>
  </footer>
</div>
{% endset %}

{% set tabsets_demo = [
{ tab: "Account", panel: account_panel },
{ tab: "Password", panel: password_panel }
] %}

{{ tabs(
  id='demo-tabs-with-panels',
  tabsets=tabsets_demo,
  main_attrs={ "class": "w-full" },
  tablist_attrs={ "class": "w-full" }
) }}
```