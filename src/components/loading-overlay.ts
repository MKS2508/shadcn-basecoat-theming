import { BaseComponent } from '../utils/base-component';
import loadingOverlayTemplate from '../templates/widgets/loading-overlay.html?raw';

interface LoadingState {
  isError: boolean;
  message: string;
}

export class LoadingOverlay extends BaseComponent {
  private currentState: LoadingState = {
    isError: false,
    message: 'Loading...'
  };

  constructor(containerId: string) {
    super(loadingOverlayTemplate);
    this.element = document.getElementById(containerId);
  }

  protected bindEvents(): void {
    // Handle reload button in error state
    this.on('button[onclick="location.reload()"]', 'click', (e) => {
      e.preventDefault();
      location.reload();
    });
  }

  showLoading(message: string = 'Loading...'): void {
    this.currentState = {
      isError: false,
      message: message
    };
    this.updateDisplay();
  }

  showError(message: string = 'An error occurred'): void {
    this.currentState = {
      isError: true,
      message: message
    };
    this.updateDisplay();
  }

  override hide(): void {
    this.element?.classList.add('hidden');
  }

  private async updateDisplay(): Promise<void> {
    this.setData(this.currentState);
    await this.render();
    this.show();
  }
}