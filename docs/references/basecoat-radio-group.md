# Radio Group | Basecoat

## Usage

Simply add the `input` class to your `<input type="radio">` elements or have a parent with the `form` class ([read more about form](/components/form)). You can also set the `aria-invalid` attribute to `true` to make the input invalid.

```
<fieldset class="grid gap-3">
  <label class="label"><input type="radio" name="radio-group" value="default" class="input">Default</label>
  <label class="label"><input type="radio" name="radio-group" value="comfortable" class="input" checked>Comfortable</label>
  <label class="label"><input type="radio" name="radio-group" value="compact" class="input">Compact</label>
</fieldset>
```

## [Examples](#examples)

### [Form](#example-form)