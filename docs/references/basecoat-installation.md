# Installation | Basecoat

## Install using the CDN

### Install all components

Add the following to the `<head>` of your HTML file:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/basecoat.cdn.min.css">
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/all.min.js" defer></script>
```

### Install specific components

While the JavaScript file for all components is small (around 3kB gzipped), you can cherry-pick the components you need.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/basecoat.cdn.min.css">
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/basecoat.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.2/dist/js/dropdown-menu.min.js" defer></script>
```

## Install using NPM

1. Add Tailwind CSS
2. Add Basecoat to your Tailwind CSS file
3. Import basecoat in your CSS

```css
@import "tailwindcss";
@import "basecoat-css";
```

4. (Optional) Add JavaScript files

Using a build tool:
```javascript
import 'basecoat-css/all';
// Or cherry-pick
import 'basecoat-css/popover';
import 'basecoat-css/tags';
```

Without a build tool: Copy files and reference in HTML

5. Use Basecoat classes in your project

## Components with JavaScript

Components requiring JavaScript:
- Dropdown Menu
- Popover  
- Select
- Sidebar
- Taps
- Toast

## Use the CLI

```bash
npx basecoat-cli add dialog
```

## Use Nunjucks or Jinja macros

You can use Nunjucks or Jinja macros to generate the HTML for components.

## Theming

Basecoat UI is compatible with shadcn/ui themes. You can copy and paste themes from [ui.shadcn.com/themes](https://ui.shadcn.com/themes) or use tools like [TweakCN](https://tweakcn.com).

## Customization

You can override styles using Tailwind, extend styles in a custom CSS file, use theme variables, or manually modify `basecoat.css` for extensive customization.