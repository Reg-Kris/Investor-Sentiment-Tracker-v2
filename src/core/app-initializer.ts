import { DataService } from '../services/data-service';
import { ComponentManager } from './component-manager';
import { TimeframeManager } from './timeframe-manager';
import { BackgroundManager } from './background-manager';
import type { SentimentData } from '../types/sentiment';

export class AppInitializer {
  private componentManager: ComponentManager;
  private timeframeManager: TimeframeManager;
  private backgroundManager: BackgroundManager;
  private data: SentimentData | null = null;

  constructor() {
    this.componentManager = new ComponentManager();
    this.timeframeManager = new TimeframeManager();
    this.backgroundManager = new BackgroundManager();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Modern Sentiment Tracker...');
      
      // Load data first
      await this.loadData();
      
      // Initialize all components
      await this.setupComponents();
      
      // Setup refresh interval
      this.setupRefreshInterval();
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showErrorState();
    }
  }

  private async loadData(): Promise<void> {
    try {
      this.data = await DataService.getSentimentData();
      this.updateLastUpdateTime();
    } catch (error) {
      console.error('Failed to load sentiment data:', error);
      throw error;
    }
  }

  private async setupComponents(): Promise<void> {
    if (!this.data) return;

    // Initialize component manager with data
    this.componentManager.initialize(this.data);
    
    // Setup timeframe management
    this.timeframeManager.initialize(this.data, this.componentManager);
    
    // Setup background gradient
    this.backgroundManager.initialize(this.data);
  }

  private updateLastUpdateTime(): void {
    if (!this.data) return;
    
    const updateText = DataService.getLastUpdateText(this.data.lastAnalyzed);
    
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
      lastUpdateElement.textContent = updateText;
    }
  }

  private setupRefreshInterval(): void {
    setInterval(async () => {
      try {
        await this.loadData();
        
        if (this.data) {
          this.componentManager.updateAll(this.data);
          this.timeframeManager.updateComponents();
        }
        
        console.log('📊 Data refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    }, 5 * 60 * 1000);
  }

  private showErrorState(): void {
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
      dashboard.innerHTML = `
        <div class="error-state">
          <h2>⚠️ Unable to Load Market Data</h2>
          <p>Please check your connection and try refreshing the page.</p>
          <button onclick="window.location.reload()" class="retry-button">
            Retry
          </button>
        </div>
      `;
    }
  }

  // Getter for other managers to access data
  public getData(): SentimentData | null {
    return this.data;
  }

  public getComponentManager(): ComponentManager {
    return this.componentManager;
  }

  public getTimeframeManager(): TimeframeManager {
    return this.timeframeManager;
  }
}