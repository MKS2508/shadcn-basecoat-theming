# Breadcrumb | Basecoat

## There is no dedicated breadcrumb component in Basecoat.

1.  [Home](#)

5.  [Components](#)

7.  Breadcrumb

## [Usage](#usage)

This example uses some simple Tailwind CSS styles along with the [Dropdown Menu](/components/dropdown-menu) component (which may require JavaScript).

```
<ol class="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5">
  <li class="inline-flex items-center gap-1.5">
    <a href="#" class="hover:text-foreground transition-colors">Home</a>
  </li>
  <li>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="m9 18 6-6-6-6" /></svg>
  </li>
  <li class="inline-flex items-center gap-1.5">
    <div id="demo-breadcrumb-menu" class="dropdown-menu">
      <button type="button" id="demo-breadcrumb-menu-trigger" aria-haspopup="menu" aria-controls="demo-breadcrumb-menu-menu" aria-expanded="false" class="flex size-9 items-center justify-center h-4 w-4 hover:text-foreground cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      <div id="demo-breadcrumb-menu-popover" data-popover aria-hidden="true">
        <div role="menu" id="demo-breadcrumb-menu-menu" aria-labelledby="demo-breadcrumb-menu-trigger">
          <nav role="menu">
            <button type="button" role="menuitem">Documentation</button>
            <button type="button" role="menuitem">Themes</button>
            <button type="button" role="menuitem">GitHub</button>
          </nav>
        </div>
      </div>
    </div>
  </li>
  <li>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="m9 18 6-6-6-6" /></svg>
  </li>
  <li class="inline-flex items-center gap-1.5">
    <a href="#" class="hover:text-foreground transition-colors">Components</a>
  </li>
  <li>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="m9 18 6-6-6-6" /></svg>
  </li>
  <li class="inline-flex items-center gap-1.5">
    <span class="text-foreground font-normal">Breadcrumb</span>
  </li>
</ol>
```