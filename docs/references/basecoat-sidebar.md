# Sidebar | Basecoat

## [Usage](#usage)

### [HTML + JavaScript](#usage-html-js)

#### [Step 1: Include the JavaScript files](#usage-html-js-1)

You can either [include the JavaScript file for all the components](/installation/#install-cdn-all), or just the one for this component by adding this to the `<head>` of your page:

```
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/sidebar.min.js" defer></script>
```

[Components with JavaScript](/installation/#install-js) [Use the CLI](/installation/#install-cli) [sidebar.js](https://github.com/hunvreus/basecoat/blob/main/src/js/sidebar.js)

#### [Step 2: Add your sidebar HTML](#usage-html-js-2)

```
<aside class="sidebar" data-side="left" aria-hidden="false">
  <nav aria-label="Sidebar navigation">
    <section class="scrollbar">
      <div role="group" aria-labelledby="group-label-content-1">
        <h3 id="group-label-content-1">Getting started</h3>

        <ul>
          <li>
            <a href="#">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m7 11 2-2-2-2" />
                <path d="M11 13h4" />
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              </svg>
              <span>Playground</span>
            </a>
          </li>

          <li>
            <a href="#">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
              <span>Models</span>
            </a>
          </li>

          <li>
            <details id="submenu-content-1-3">
              <summary aria-controls="submenu-content-1-3-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Settings
              </summary>
              <ul id="submenu-content-1-3-content">
                <li>
                  <a href="#">
                    <span>General</span>
                  </a>
                </li>

                <li>
                  <a href="#">
                    <span>Team</span>
                  </a>
                </li>

                <li>
                  <a href="#">
                    <span>Billing</span>
                  </a>
                </li>

                <li>
                  <a href="#">
                    <span>Limits</span>
                  </a>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </section>
  </nav>
</aside>

<main>
  <button type="button" onclick="document.dispatchEvent(new CustomEvent('basecoat:sidebar'))">Toggle sidebar</button>
  <h1>Content</h1>
</main>
```

#### [HTML structure](#usage-html-js-3)

`<aside class="sidebar" aria-hidden="false">`

Wraps around the entire component. It can have the following attributes:

-   `aria-hidden="true"`: controls the default state of the sidebar (hidden or visible).
-   `data-side="left"`: specifies the side of the sidebar (`left` or `right`, defaults to `left`).

`<nav>`

The navigation element that contains the sidebar's content. It can have the following attributes:

-   `id="{BUTTON_ID}"`: linked to by the `aria-labelledby` attribute of the listbox.
-   `aria-haspopup="menu"`: indicates that the button opens a menu.
-   `aria-controls="{ MENU_ID }"`: points to the menu's id.
-   `aria-expanded="false"`: tracks the popover's state.

`<header>` Optional

The header of the sidebar.

`<section>`

The main navigation list.

`<div role="group">`

Group of options, can have a `aria-labelledby` attribute to link to a heading.

`<span role="heading">`

Group heading, must have an `id` attribute if you use the `aria-labelledby` attribute on the group.

`<ul>`

List of links or buttons.

`<li>`

Individual item.

`<a>`

A link. By default, clicking on a link will close the sidebar on mobile unless the `data-keep-mobile-sidebar-open` attribute is present.

`<button>`

A button. By default, clicking on a button will close the sidebar on mobile unless the `data-keep-mobile-sidebar-open` attribute is present.

`<details>`

Collapsible section.

`<summary>`

Summary of the collapsible section.

`<ul>`

List of links or buttons.

`<footer>` Optional

The footer of the sidebar.

`<main>`

A wrapper for the content of the page.

`<button type="button" onclick="document.dispatchEvent(new CustomEvent('basecoat:sidebar'))">`

A button to toggle the sidebar. If you want to use multiple sidebars you will need to add unique ids to the sidebars (i.e. `<aside class="sidebar" id="{SIDEBAR_ID}">`) and refer to them in the event `detail` (i.e. `document.dispatchEvent(new CustomEvent('basecoat:sidebar', { detail: { id: '{SIDEBAR_ID}' } }));`).

#### [JavaScript events](#usage-html-js-4)

`basecoat:initialized`

Once the component is fully initialized, it dispatches a custom (non-bubbling) `basecoat:initialized` event on itself.

`basecoat:sidebar`

Sidebars listen for this event on `document` to open, close or toggle themselves. By default, the event will toggle the sidebar, but can be used to open or close if you add an `action` to the detail. Additionally, if you have multiple sidebars on the page, you can target a specific sidebar by adding its `id` to the detail:

```
<!-- Toggles the sidebar -->
<button type="button" onclick="document.dispatchEvent(new CustomEvent('basecoat:sidebar'));">Toggle sidebar</button>
<!-- Opens the `#main-navigation` sidebar -->
<button type="button" onclick="document.dispatchEvent(new CustomEvent('basecoat:sidebar', { detail: { id: 'main-navigation', action: 'open' } }));">Open sidebar</button>
<!-- Closes the sidebar -->
<button type="button" onclick="document.dispatchEvent(new CustomEvent('basecoat:sidebar', { detail: { action: 'close' } }));">Close sidebar</button>
```

### [Jinja and Nunjucks](#usage-macro)

You can use the `sidebar()` Nunjucks or Jinja macro for this component.

[Use Nunjucks or Jinja macros](/installation/#install-macros) [Jinja macro](https://github.com/hunvreus/basecoat/blob/main/src/jinja/sidebar.html.jinja) [Nunjucks macro](https://github.com/hunvreus/basecoat/blob/main/src/nunjucks/sidebar.njk)

```
{% set menu = [
  { type: "group", label: "Getting started", items: [
    { label: "Playground", url: "#" },
    { label: "Models", url: "#" },
    { label: "Settings", type: "submenu", items: [
      { label: "General", url: "#" },
      { label: "Team", url: "#" },
      { label: "Billing", url: "#" },
      { label: "Limits", url: "#" }
    ] }
  ]}
] %}

{{ sidebar(
  label="Sidebar navigation",
  menu=menu
) }}
<main>
  <h1>Content</h1>
</main>
```