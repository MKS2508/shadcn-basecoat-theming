import { BaseComponent } from '../utils/base-component';
import emptyStateTemplate from '../templates/widgets/empty-state.html?raw';

interface EmptyStateData {
  iconPath: string;
  title: string;
  subtitle: string;
}

export class EmptyState extends BaseComponent {
  constructor(containerId: string) {
    super(emptyStateTemplate);
    this.element = document.getElementById(containerId);
  }

  protected bindEvents(): void {
    // Empty states typically don't need event handling
  }

  async showEmptyState(config: EmptyStateData): Promise<void> {
    this.setData(config);
    await this.render();
    super.show();
  }

  static createNoThemesState(): EmptyStateData {
    return {
      iconPath: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z',
      title: 'No themes found',
      subtitle: 'Install a theme to get started'
    };
  }

  static createNoFontsState(): EmptyStateData {
    return {
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      title: 'No custom fonts',
      subtitle: 'Enable font override to customize fonts'
    };
  }

  static createSearchEmptyState(): EmptyStateData {
    return {
      iconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      title: 'No results found',
      subtitle: 'Try adjusting your search terms'
    };
  }
}