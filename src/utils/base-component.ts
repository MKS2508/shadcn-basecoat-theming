import { TemplateEngine, templateEngine } from './template-engine';

/**
 * Base Component class for creating reusable UI components
 * Solid architecture for Vanilla JS + Web Components migration readiness
 * Zero dependencies - pure DOM APIs
 */
export abstract class BaseComponent {
  protected element: HTMLElement | null = null;
  protected templateEngine: TemplateEngine;
  protected templateString: string;
  protected data: Record<string, any> = {};
  protected isRendered: boolean = false;
  
  // Event management for cleanup
  private eventListeners: Array<{
    element: Element;
    event: string; 
    handler: EventListener;
  }> = [];

  constructor(templateString: string) {
    this.templateEngine = templateEngine;
    this.templateString = templateString;
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
      // Render template string with data (no async loading needed)
      const html = this.templateEngine.render(this.templateString, this.data);
      
      if (this.element) {
        this.element.innerHTML = html;
      } else {
        // Create a wrapper element
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        this.element = wrapper.firstElementChild as HTMLElement;
      }
      
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
    if (!this.element || !selector) {
      return document.querySelectorAll('body'); // Safe fallback that won't throw
    }
    return this.element.querySelectorAll(selector);
  }

  /**
   * Add event listener with automatic cleanup tracking
   */
  protected bindEvent(element: Element, event: string, handler: EventListener): void {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  /**
   * Add event listener to child element(s) with cleanup tracking
   */
  protected on(selector: string, event: string, handler: EventListener): void {
    const elements = this.queryAll(selector);
    elements.forEach(element => {
      this.bindEvent(element, event, handler);
    });
  }

  /**
   * Clean up all tracked event listeners
   */
  private cleanupEvents(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
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
    this.cleanupEvents();
    // Override in subclasses for additional cleanup
  }
}

/**
 * Component with modal functionality
 * Enhanced with z-index management and modal stacking
 */
export abstract class ModalComponent extends BaseComponent {
  protected modal: HTMLElement | null = null;
  protected backdrop: HTMLElement | null = null;
  private static activeModals: Set<ModalComponent> = new Set();
  private static baseZIndex = 1000;
  private zIndex: number = 0;

  constructor(templateString: string) {
    super(templateString);
  }

  /**
   * Open modal with proper z-index stacking
   */
  open(): void {
    if (this.modal) {
      // Calculate z-index based on active modal count
      this.zIndex = ModalComponent.baseZIndex + (ModalComponent.activeModals.size * 10);
      this.modal.style.zIndex = this.zIndex.toString();
      
      // Add to active modals tracking
      ModalComponent.activeModals.add(this);
      
      this.modal.classList.remove('hidden');
      
      // Only set body overflow hidden for the first modal
      if (ModalComponent.activeModals.size === 1) {
        document.body.style.overflow = 'hidden';
      }
      
      this.emit('modal:open');
    }
  }

  /**
   * Close modal with proper cleanup
   */
  close(): void {
    if (this.modal) {
      this.modal.classList.add('hidden');
      
      // Remove from active modals tracking
      ModalComponent.activeModals.delete(this);
      
      // Only restore body overflow when no modals are active
      if (ModalComponent.activeModals.size === 0) {
        document.body.style.overflow = '';
      }
      
      this.emit('modal:close');
    }
  }

  /**
   * Setup modal event listeners with proper cleanup tracking
   */
  protected setupModalEvents(): void {
    // Close on backdrop click
    if (this.backdrop) {
      this.bindEvent(this.backdrop, 'click', () => this.close());
    }

    // Close on escape key - use bound method for proper cleanup
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  protected override destroy(): void {
    // Clean up modal-specific event listeners
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    // Remove from active modals if present
    ModalComponent.activeModals.delete(this);
    
    super.destroy();
    
    // Only restore body scroll if no modals are active
    if (ModalComponent.activeModals.size === 0) {
      document.body.style.overflow = '';
    }
  }

  private handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isVisible() && this.isTopModal()) {
      this.close();
    }
  };

  /**
   * Check if this modal is the top-most active modal
   */
  private isTopModal(): boolean {
    if (ModalComponent.activeModals.size === 0) return false;
    
    let topModal: ModalComponent | null = null;
    let highestZIndex = 0;
    
    for (const modal of ModalComponent.activeModals) {
      if (modal.zIndex > highestZIndex) {
        highestZIndex = modal.zIndex;
        topModal = modal;
      }
    }
    
    return topModal === this;
  }

  /**
   * Get current modal z-index
   */
  protected getZIndex(): number {
    return this.zIndex;
  }

  /**
   * Get count of currently active modals
   */
  static getActiveModalCount(): number {
    return ModalComponent.activeModals.size;
  }
}