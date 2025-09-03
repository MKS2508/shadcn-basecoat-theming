# Popover Component Example | Basecoat

## Complete HTML Structure

```html
<div id="demo-popover" class="popover">
  <button id="demo-popover-trigger" type="button" aria-expanded="false" aria-controls="demo-popover-popover" class="btn-outline">Open popover</button>
  <div id="demo-popover-popover" data-popover aria-hidden="true" class="w-80">
    <div class="grid gap-4">
      <header class="grid gap-1.5">
        <h4 class="leading-none font-medium">Dimensions</h4>
        <p class="text-muted-foreground text-sm">Set the dimensions for the layer.</p>
      </header>
      <form class="form grid gap-2">
        <div class="grid grid-cols-3 items-center gap-4">
          <label for="demo-popover-width">Width</label>
          <input type="text" id="demo-popover-width" value="100%" class="col-span-2 h-8" autofocus />
        </div>
        <div class="grid grid-cols-3 items-center gap-4">
          <label for="demo-popover-max-width">Max. width</label>
          <input type="text" id="demo-popover-max-width" value="300px" class="col-span-2 h-8" />
        </div>
        <div class="grid grid-cols-3 items-center gap-4">
          <label for="demo-popover-height">Height</label>
          <input type="text" id="demo-popover-height" value="25px" class="col-span-2 h-8" />
        </div>
        <div class="grid grid-cols-3 items-center gap-4">
          <label for="demo-popover-max-height">Max. height</label>
          <input type="text" id="demo-popover-max-height" value="none" class="col-span-2 h-8" />
        </div>
      </form>
    </div>
  </div>
</div>
```

## JavaScript Requirements

### Step 1: Include JavaScript files in HTML head

```html
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/popover.min.js" defer></script>
```

### Alternative: Include all components

```html
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/all.min.js" defer></script>
```

## Key HTML Structure Elements

### Button trigger
```html
<button type="button" popovertarget="{ POPOVER_ID }" aria-expanded="false" aria-controls="{ POPOVER_ID }">
```

### Popover container
```html
<div data-popover class="popover" id="{ POPOVER_ID }">
```

You can set positioning using `data-side` and `data-align` attributes.

## JavaScript Events

- `basecoat:initialized` - Fired when component is fully initialized (non-bubbling)
- `basecoat:popover` - Fired when popover opens, closes other popovers (non-bubbling, dispatched on document)

## ARIA Accessibility Features

- `aria-expanded="false"` - Tracks popover state on trigger button
- `aria-controls="{ POPOVER_ID }"` - Links trigger to popover
- `aria-hidden="true"` - Initially hidden popover
- `id` attributes for proper linking between elements