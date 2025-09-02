import { TemplateEngine, templateEngine } from './template-engine';

/**
 * Base Component class for creating reusable UI components
 * Prepares for future Web Components migration
 */
export abstract class BaseComponent {
  protected element: HTMLElement | null = null;
  protected templateEngine: TemplateEngine;
  protected templatePath: string;
  protected data: any = {};
  protected isRendered: boolean = false;

  constructor(templatePath: string) {
    this.templateEngine = templateEngine;
    this.templatePath = templatePath;
  }

  /**
   * Initialize the component
   */
  async init(): Promise<void> {
    await this.render();
    this.bindEvents();
    this.isRendered = true;
  }

  /**
   * Render the component
   */
  async render(): Promise<void> {
    try {
      const html = await this.templateEngine.renderTemplate(this.templatePath, this.data);
      
      if (this.element) {
        this.element.innerHTML = html;
      } else {
        // Create a wrapper element
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        this.element = wrapper.firstElementChild as HTMLElement;
      }
      
      console.log(`🎨 BaseComponent: Rendered ${this.constructor.name}`);
    } catch (error) {
      console.error(`❌ BaseComponent: Failed to render ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Update component data and re-render
   */
  async update(newData: any): Promise<void> {
    this.data = { ...this.data, ...newData };
    await this.render();
    this.bindEvents(); // Re-bind events after re-render
  }

  /**
   * Set component data
   */
  setData(data: any): this {
    this.data = data;
    return this;
  }

  /**
   * Get component element
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Mount component to a parent element
   */
  mount(parent: HTMLElement | string): void {
    if (typeof parent === 'string') {
      const parentElement = document.getElementById(parent) || document.querySelector(parent);
      if (!parentElement) {
        throw new Error(`Parent element not found: ${parent}`);
      }
      parent = parentElement as HTMLElement;
    }

    if (this.element) {
      parent.appendChild(this.element);
    }
  }

  /**
   * Unmount component from DOM
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.destroy();
  }

  /**
   * Show component
   */
  show(): void {
    if (this.element) {
      this.element.style.display = '';
      this.element.classList.remove('hidden');
    }
  }

  /**
   * Hide component
   */
  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
      this.element.classList.add('hidden');
    }
  }

  /**
   * Check if component is visible
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return this.element.style.display !== 'none' && !this.element.classList.contains('hidden');
  }

  /**
   * Get child element by selector
   */
  protected query(selector: string): HTMLElement | null {
    return this.element?.querySelector(selector) || null;
  }

  /**
   * Get all child elements by selector
   */
  protected queryAll(selector: string): NodeListOf<Element> {
    return this.element?.querySelectorAll(selector) || document.querySelectorAll('');
  }

  /**
   * Add event listener to child element
   */
  protected on(selector: string, event: string, handler: EventListener): void {
    const elements = this.queryAll(selector);
    elements.forEach(element => {
      element.addEventListener(event, handler);
    });
  }

  /**
   * Emit custom event
   */
  protected emit(eventName: string, detail?: any): void {
    if (this.element) {
      const event = new CustomEvent(eventName, { 
        detail, 
        bubbles: true, 
        cancelable: true 
      });
      this.element.dispatchEvent(event);
    }
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract bindEvents(): void;
  
  /**
   * Cleanup method - override in subclasses if needed
   */
  protected destroy(): void {
    // Override in subclasses for cleanup
    console.log(`🗑️ BaseComponent: Destroying ${this.constructor.name}`);
  }
}

/**
 * Component with modal functionality
 */
export abstract class ModalComponent extends BaseComponent {
  protected modal: HTMLElement | null = null;
  protected backdrop: HTMLElement | null = null;

  constructor(templatePath: string, modalSelector: string = '') {
    super(templatePath);
  }

  /**
   * Open modal
   */
  open(): void {
    if (this.modal) {
      this.modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      this.emit('modal:open');
    }
  }

  /**
   * Close modal
   */
  close(): void {
    if (this.modal) {
      this.modal.classList.add('hidden');
      document.body.style.overflow = '';
      this.emit('modal:close');
    }
  }

  /**
   * Setup modal event listeners
   */
  protected setupModalEvents(): void {
    // Close on backdrop click
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.close();
      }
    });
  }

  protected destroy(): void {
    super.destroy();
    // Restore body scroll when component is destroyed
    document.body.style.overflow = '';
  }
}