# Alert Dialog | Basecoat

## [Usage](#usage)

### [HTML + JavaScript](#usage-html-js)

#### [Step 1: Include the JavaScript file](#usage-html-js-1)

You can either [include the JavaScript file for all the components](/installation/#install-cdn-all), or just the one for this component by adding this to the `<head>` of your page:

```
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/alert-dialog.min.js" defer></script>
```

#### [Step 2: Add your alert dialog HTML](#usage-html-js-2)

```html
<button type="button" onclick="document.getElementById('alert-dialog').showModal()" class="btn-outline">
    Open alert dialog
</button>

<dialog 
    id="alert-dialog" 
    class="dialog" 
    aria-labelledby="alert-dialog-title" 
    aria-describedby="alert-dialog-description"
>
    <article>
        <header>
            <h2 id="alert-dialog-title">Are you absolutely sure?</h2>
            <p id="alert-dialog-description">
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </p>
        </header>

        <footer>
            <button class="btn-outline" onclick="document.getElementById('alert-dialog').close()">
                Cancel
            </button>
            <button class="btn-primary" onclick="document.getElementById('alert-dialog').close()">
                Continue
            </button>
        </footer>
    </article>
</dialog>
```

#### [HTML structure](#usage-html-js-3)

`<dialog id="{ DIALOG_ID }" class="dialog">`

The main dialog element that uses native HTML dialog functionality:

- `id="{DIALOG_ID}"`: unique identifier for the dialog element
- `class="dialog"`: Basecoat styling class for dialog appearance
- `aria-labelledby="{TITLE_ID}"`: points to the dialog title element
- `aria-describedby="{DESCRIPTION_ID}"`: points to the dialog description element

`<button onclick="document.getElementById('{DIALOG_ID}').showModal()">`

The trigger button to open the alert dialog:

- Uses native `showModal()` method to open the dialog modally
- Can have any styling classes (`btn-outline`, `btn-primary`, etc.)

`<button onclick="document.getElementById('{DIALOG_ID}').close()">`

Action buttons inside the dialog:

- Use native `close()` method to dismiss the dialog
- No close button or backdrop dismissal in alert dialogs (by design)

#### [JavaScript events](#usage-html-js-4)

`basecoat:initialized`

Once the component is fully initialized, it dispatches a custom (non-bubbling) `basecoat:initialized` event on itself.

Alert dialogs use native browser dialog functionality with minimal JavaScript enhancements.