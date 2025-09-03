# Toast | Basecoat

## [Usage](#usage)

### [HTML + JavaScript](#usage-html-js)

#### [Step 1: Include the JavaScript file](#usage-html-js-1)

You can either [include the JavaScript file for all the components](/installation/#install-cdn-all), or just the one for this component by adding this to the `<head>` of your page:

```
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/toast.min.js" defer></script>
```

[Components with JavaScript](/installation/#install-js) [Use the CLI](/installation/#install-cli) [toast.js](https://github.com/hunvreus/basecoat/blob/main/src/js/toast.js)

#### [Step 2: Add the toaster HTML](#usage-html-js-2)

Toasts are displayed in a parent element, the "toaster". Add this to this to at the end of your `<body>`:

```
<div id="toaster" class="toaster"></div>
```

You can set up the alignment of the toaster using the `data-align` attribute: `data-align="start"`, `data-align="center"`, or `data-align="end"` (default to `data-align="end"`).

#### [Step 3: Add your toasts](#usage-html-js-3)

If you decide to server-render your toasts, or load them using asynchronoulsy with something like HTMX, you can just add the toast's markup to the toaster:

```
<div id="toaster" class="toaster">
  <div class="toast" role="status" aria-atomic="true" aria-hidden="false" data-category="success">
    <div class="toast-content">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>

      <section>
        <h2>Success</h2>
        <p>A success toast called from the front-end.</p>
      </section>

      <footer>
        <button type="button" class="btn" data-toast-action>Dismiss</button>
      </footer>
    </div>
  </div>
</div>
```

[HTML structure](#usage-html-js-5)

If you need to create a toast from the front-end, you can dispatch a custom `basecoat:toast` event as such:

```
<button
  class="btn-outline"
  onclick="document.dispatchEvent(new CustomEvent('basecoat:toast', {
    detail: {
      config: {
        category: 'success',
        title: 'Success',
        description: 'A success toast called from the front-end.',
        cancel: {
          label: 'Dismiss'
        }
      }
    }
  }))">
  Toast from front-end
</button>
```

[Toast config object](#usage-html-js-6)

#### [HTML structure](#usage-html-js-4)

`<div class="toast">`

Wraps around the toast component. You can add a `data-duration` attribute to set the duration of the toast in milliseconds (e.g. `data-duration="5000"` for 5 seconds). If not provided, the default duration is 3000ms (3 seconds) or 5000ms (5 seconds) for `error` toasts.

`<div class="toast-content">`

The content of the toast.

`<svg aria-hidden="true">` Optional

The toast's icon.

`<section>`

The toast's message.

`<h2>`

The toast's title.

`<p>` Optional

The toast's description.

`<footer>` Optional

The toast's buttons. When clicked, the toast will be closed (unless the button's `onclick` is set to `e.preventDefault()`).

`<button type="button" class="btn" onclick="{ ONCLICK }">` or `<a href="{ URL }" class="btn" >` Optional

The toast's action button. This can either be a link (with a `href` attribute) or a button (with an `onclick` attribute).

`<button type="button" class="btn-outline" onclick="{ ONCLICK }">` Optional

The toast's cancel button (with an optional `onclick` attribute).

#### [JavaScript events](#usage-html-js-5)

`basecoat:initialized`

Once the component is fully initialized, it dispatches a custom (non-bubbling) `basecoat:initialized` event on the `toaster` element.

`basecoat:toast`

The `toaster` listens for `basecoat:toast` events on `document` to create toasts. The event's `detail` object must contain a `config` object (see [JavaScript config object](#usage-html-js-6) below).

#### [Toast config object](#usage-html-js-6)

`duration` Optional

The duration of the toast in milliseconds. If not provided, the default duration is 3000ms (3 seconds) or 5000ms (5 seconds) for `error` toasts.

`category` Optional

Category of the toast, either `success`, `info`, `warning`, or `error`.

`title`

The title of the toast.

`description` Optional

The description of the toast.

`action` Optional

Action button.

`label` Optional

The label of the cancel button. If not provided, the default label is "Dismiss".

`onclick` Optional

The onclick of the cancel button.

`cancel` Optional

Cancel button.

`label` Optional

The label of the cancel button. If not provided, the default label is "Dismiss".

`onclick` Optional

The onclick of the cancel button.

### [Jinja and Nunjucks](#usage-macro)

You can use the `toaster()` and `toast()` Nunjucks or Jinja macros for this component.

[Use Nunjucks or Jinja macros](/installation/#install-macros) [Jinja macro](https://github.com/hunvreus/basecoat/blob/main/src/jinja/toast.html.jinja) [Nunjucks macro](https://github.com/hunvreus/basecoat/blob/main/src/nunjucks/toast.njk)

```
{% from "toast.njk" import toaster %}
{{ toaster(
  toasts=[
    {
      type: "success",
      title: "Success",
      description: "A success toast called from the front-end.",
      action: { label: "Dismiss", click: "close()" }
    },
    {
      type: "info",
      title: "Info",
      description: "An info toast called from the front-end.",
      action: { label: "Dismiss", click: "close()" }
    }
  ]
) }}
```