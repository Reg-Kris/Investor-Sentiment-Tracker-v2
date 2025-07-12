import { AppInitializer } from './core/app-initializer';

class ModernSentimentTracker {
  private appInitializer: AppInitializer;

  constructor() {
    this.appInitializer = new AppInitializer();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    await this.appInitializer.initialize();
  }
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ModernSentimentTracker();
  });
} else {
  new ModernSentimentTracker();
}
