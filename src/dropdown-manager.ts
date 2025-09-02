/**
 * Manages dropdown component interactions using Basecoat patterns
 */
export class DropdownManager {
  private dropdowns: NodeListOf<Element> | null = null;

  /**
   * Initialize dropdown functionality
   */
  init(): void {
    this.dropdowns = document.querySelectorAll('[data-dropdown]');
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for dropdown interactions
   */
  private setupEventListeners(): void {
    if (!this.dropdowns) return;

    this.dropdowns.forEach(dropdown => {
      const button = dropdown.querySelector('[aria-haspopup="true"]') as HTMLElement;
      const menu = dropdown.querySelector('[role="menu"]') as HTMLElement;

      if (!button || !menu) return;

      // Toggle dropdown on button click
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleDropdown(dropdown, button, menu);
      });

      // Handle keyboard navigation
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.toggleDropdown(dropdown, button, menu);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.openDropdown(dropdown, button, menu);
          this.focusFirstMenuItem(menu);
        }
      });

      // Handle menu item keyboard navigation
      menu.addEventListener('keydown', (event) => {
        this.handleMenuKeydown(event, menu);
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target as Node)) {
          this.closeDropdown(dropdown, button, menu);
        }
      });
    });
  }

  /**
   * Toggle dropdown open/closed state
   */
  private toggleDropdown(dropdown: Element, button: HTMLElement, menu: HTMLElement): void {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    
    if (isOpen) {
      this.closeDropdown(dropdown, button, menu, true); // Focus button when toggling
    } else {
      this.openDropdown(dropdown, button, menu);
    }
  }

  /**
   * Open dropdown
   */
  private openDropdown(dropdown: Element, button: HTMLElement, menu: HTMLElement): void {
    // Close any other open dropdowns
    this.closeAllDropdowns();
    
    button.setAttribute('aria-expanded', 'true');
    menu.classList.remove('hidden');
    menu.classList.add('animate-fade-in');
    
    // Focus management
    setTimeout(() => {
      this.focusFirstMenuItem(menu);
    }, 100);
  }

  /**
   * Close specific dropdown
   */
  private closeDropdown(dropdown: Element, button: HTMLElement, menu: HTMLElement, shouldFocus: boolean = false): void {
    button.setAttribute('aria-expanded', 'false');
    menu.classList.add('hidden');
    menu.classList.remove('animate-fade-in');
    
    // Only return focus to button if explicitly requested (keyboard navigation)
    if (shouldFocus) {
      button.focus();
    }
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns(): void {
    if (!this.dropdowns) return;
    
    this.dropdowns.forEach(dropdown => {
      const button = dropdown.querySelector('[aria-haspopup="true"]') as HTMLElement;
      const menu = dropdown.querySelector('[role="menu"]') as HTMLElement;
      
      if (button && menu && button.getAttribute('aria-expanded') === 'true') {
        this.closeDropdown(dropdown, button, menu, false); // Don't focus when closing all
      }
    });
  }

  /**
   * Focus first menu item
   */
  private focusFirstMenuItem(menu: HTMLElement): void {
    const firstItem = menu.querySelector('[role="menuitem"]') as HTMLElement;
    if (firstItem) {
      firstItem.focus();
    }
  }

  /**
   * Handle keyboard navigation within menu
   */
  private handleMenuKeydown(event: KeyboardEvent, menu: HTMLElement): void {
    const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const currentIndex = menuItems.findIndex(item => item === event.target);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % menuItems.length;
        menuItems[nextIndex]?.focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
        menuItems[prevIndex]?.focus();
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        (event.target as HTMLElement)?.click();
        break;
        
      case 'Escape':
        event.preventDefault();
        // Focus button when closing with Escape
        const button = menu.closest('[data-dropdown]')?.querySelector('[aria-haspopup="true"]') as HTMLElement;
        this.closeAllDropdowns();
        if (button) button.focus();
        break;
        
      case 'Tab':
        // Allow normal tab behavior but close dropdown
        this.closeAllDropdowns();
        break;
    }
  }
}