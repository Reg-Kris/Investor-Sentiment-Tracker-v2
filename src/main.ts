import { DataService } from './services/data-service';
import { SentimentCluster } from './components/sentiment-cluster';
import { MarketCard, VixCard, OptionsCard, FearGreedCard } from './components/indicator-card';
import type { SentimentData, TimeFrame } from './types/sentiment';

class ModernSentimentTracker {
  private data: SentimentData | null = null;
  private currentTimeframe: TimeFrame = '1d';
  private components: {
    cluster?: SentimentCluster;
    cards: { [key: string]: any };
  } = { cards: {} };

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      console.log('🚀 Initializing Modern Sentiment Tracker...');
      
      // Load data first
      await this.loadData();
      
      // Initialize components
      this.setupSentimentCluster();
      this.setupIndicatorCards();
      this.setupGlobalTimeframeSwitcher();
      this.setupBackgroundGradient();
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

  private setupSentimentCluster(): void {
    const container = document.getElementById('sentiment-cluster-container');
    if (!container || !this.data) return;

    const timeframeData = this.data.timeframes[this.currentTimeframe];
    this.components.cluster = new SentimentCluster(container, {
      score: timeframeData.score,
      sentiment: timeframeData.sentiment,
      message: timeframeData.message,
      timeframe: this.currentTimeframe,
      // No onTimeframeChange callback - controlled globally now
    });
  }

  private setupGlobalTimeframeSwitcher(): void {
    const switcher = document.querySelector('.global-timeframe-switcher');
    if (!switcher) return;

    switcher.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      if (target.classList.contains('timeframe-btn')) {
        const timeframe = target.getAttribute('data-timeframe') as TimeFrame;
        
        // Update active button
        switcher.querySelectorAll('.timeframe-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        target.classList.add('active');
        
        // Update global timeframe
        this.handleTimeframeChange(timeframe);
      }
    });
  }

  private setupIndicatorCards(): void {
    if (!this.data) return;

    const indicators = this.data.indicators;
    // const timeframeData = this.data.timeframes[this.currentTimeframe];

    // Fear & Greed Index Card
    const fearGreedContainer = document.getElementById('fear-greed-card-container');
    if (fearGreedContainer) {
      this.components.cards.fearGreed = new FearGreedCard(
        fearGreedContainer,
        indicators.fearGreed.value,
        indicators.fearGreed.message,
        indicators.fearGreed.color,
        this.currentTimeframe
        // No callback - controlled by global switcher
      );
    }

    // S&P 500 Card
    const spyContainer = document.getElementById('spy-card-container');
    if (spyContainer) {
      this.components.cards.spy = new MarketCard(
        spyContainer,
        'S&P 500 (SPY)',
        indicators.spy.price,
        indicators.spy.change,
        indicators.spy.message,
        indicators.spy.color,
        this.currentTimeframe
        // No callback - controlled by global switcher
      );
    }

    // Nasdaq 100 Card
    const qqqContainer = document.getElementById('qqq-card-container');
    if (qqqContainer) {
      this.components.cards.qqq = new MarketCard(
        qqqContainer,
        'Nasdaq 100 (QQQ)',
        indicators.qqq.price,
        indicators.qqq.change,
        indicators.qqq.message,
        indicators.qqq.color,
        this.currentTimeframe
        // No callback - controlled by global switcher
      );
    }

    // Russell 2000 Card
    const iwmContainer = document.getElementById('iwm-card-container');
    if (iwmContainer) {
      this.components.cards.iwm = new MarketCard(
        iwmContainer,
        'Russell 2000 (IWM)',
        indicators.iwm.price,
        indicators.iwm.change,
        indicators.iwm.message,
        indicators.iwm.color,
        this.currentTimeframe
        // No callback - controlled by global switcher
      );
    }

    // VIX Card
    const vixContainer = document.getElementById('vix-card-container');
    if (vixContainer) {
      this.components.cards.vix = new VixCard(
        vixContainer,
        indicators.vix.value,
        indicators.vix.message,
        indicators.vix.color,
        this.currentTimeframe
        // No callback - controlled by global switcher
      );
    }

    // Market Options Sentiment Card (Consolidated)
    const marketOptionsContainer = document.getElementById('market-options-card-container');
    if (marketOptionsContainer) {
      this.components.cards.marketOptions = new OptionsCard(
        marketOptionsContainer,
        'Market',
        indicators.options.market || 'Market options sentiment is neutral',
        this.currentTimeframe
        // No callback - controlled by global switcher
      );
    }
  }

  private handleTimeframeChange(timeframe: TimeFrame): void {
    this.currentTimeframe = timeframe;
    this.updateComponents();
  }

  private updateComponents(): void {
    if (!this.data) return;

    const currentData: SentimentData = this.data;
    const timeframeData = currentData.timeframes[this.currentTimeframe];
    const indicators = currentData.indicators;

    // Update sentiment cluster
    if (this.components.cluster) {
      this.components.cluster.updateProps({
        score: timeframeData.score,
        sentiment: timeframeData.sentiment,
        message: timeframeData.message,
        timeframe: this.currentTimeframe
      });
    }

    // Update all cards with new timeframe and enhanced data
    Object.entries(this.components.cards).forEach(([key, card]) => {
      if (card && typeof card.updateProps === 'function') {
        const updateData: any = { timeframe: this.currentTimeframe };
        
        // Add specific updates for each card type based on timeframe
        if (key === 'spy' || key === 'qqq' || key === 'iwm') {
          // Get timeframe-specific data
          const baseIndicator = indicators[key as keyof typeof indicators] as any;
          const timeframeIndicator = DataService.getIndicatorForTimeframe(this.data!, this.currentTimeframe, key);
          
          if (baseIndicator && timeframeIndicator) {
            updateData.value = `$${baseIndicator.price.toFixed(2)}`;
            updateData.change = `${timeframeIndicator.change >= 0 ? '+' : ''}${timeframeIndicator.change.toFixed(2)}%`;
            
            // Create user-friendly messages based on timeframe performance
            let message = this.getMarketMessage(key, timeframeIndicator.change, this.currentTimeframe);
            updateData.message = message;
            
            // Update color based on timeframe change
            updateData.color = timeframeIndicator.change >= 0 ? '#10b981' : '#ef4444';
            
            // Update score for gauge
            const normalizedScore = Math.min(Math.max(((timeframeIndicator.change + 10) / 20) * 100, 0), 100);
            updateData.score = normalizedScore;
          }
        } else if (key === 'vix') {
          // const baseVix = indicators.vix;
          const timeframeVix = DataService.getIndicatorForTimeframe(this.data!, this.currentTimeframe, 'vix');
          
          updateData.value = timeframeVix.value.toFixed(1);
          updateData.color = timeframeVix.value > 20 ? '#ef4444' : '#10b981';
          
          // Create user-friendly VIX messages
          updateData.message = this.getVixMessage(timeframeVix.value, this.currentTimeframe);
          
          // Update VIX score for gauge
          const normalizedScore = Math.min(Math.max((timeframeVix.value / 40) * 100, 0), 100);
          updateData.score = normalizedScore;
        } else if (key === 'fearGreed') {
          // Update Fear & Greed with timeframe-specific score and user-friendly message
          updateData.score = timeframeData.score;
          updateData.value = timeframeData.score.toString();
          updateData.message = this.getFearGreedMessage(timeframeData.score, this.currentTimeframe);
          updateData.color = this.getSentimentColor(timeframeData.score);
        }
        
        card.updateProps(updateData);
      }
    });

    // Update background gradient
    this.updateBackgroundGradient(timeframeData.score);
  }

  private getSentimentColor(score: number): string {
    if (score >= 80) return '#047857'; // Extreme Greed
    if (score >= 65) return '#059669'; // Greed
    if (score >= 55) return '#16a34a'; // Mild Greed
    if (score >= 45) return '#65a30d'; // Neutral
    if (score >= 35) return '#d97706'; // Mild Fear
    if (score >= 20) return '#ea580c'; // Fear
    return '#dc2626'; // Extreme Fear
  }

  private getMarketMessage(symbol: string, change: number, timeframe: TimeFrame): string {
    const symbolName = {
      spy: 'S&P 500',
      qqq: 'Nasdaq 100', 
      iwm: 'Russell 2000'
    }[symbol] || symbol.toUpperCase();
    
    const timeframeName = {
      '1d': 'today',
      '5d': 'this week',
      '1m': 'this month'
    }[timeframe];
    
    
    
    if (change > 2) {
      return `${symbolName} is up strongly ${timeframeName} (+${change.toFixed(1)}%) - bullish momentum`;
    } else if (change > 0.5) {
      return `${symbolName} is gaining ${timeframeName} (+${change.toFixed(1)}%) - positive trend`;
    } else if (change > -0.5) {
      return `${symbolName} is trading sideways ${timeframeName} (${change.toFixed(1)}%) - neutral`;
    } else if (change > -2) {
      return `${symbolName} is declining ${timeframeName} (${change.toFixed(1)}%) - bearish pressure`;
    } else {
      return `${symbolName} is down significantly ${timeframeName} (${change.toFixed(1)}%) - strong selling`;
    }
  }
  
  private getVixMessage(value: number, timeframe: TimeFrame): string {
    const timeframeName = {
      '1d': 'today',
      '5d': 'this week',
      '1m': 'this month'
    }[timeframe];
    
    if (value > 30) {
      return `High fear ${timeframeName} (${value.toFixed(1)}) - investors are very nervous`;
    } else if (value > 20) {
      return `Elevated concern ${timeframeName} (${value.toFixed(1)}) - some market anxiety`;
    } else if (value > 15) {
      return `Normal levels ${timeframeName} (${value.toFixed(1)}) - markets are comfortable`;
    } else {
      return `Very calm ${timeframeName} (${value.toFixed(1)}) - investors feel confident`;
    }
  }
  
  private getFearGreedMessage(score: number, timeframe: TimeFrame): string {
    const timeframeName = {
      '1d': 'Today',
      '5d': 'This week',
      '1m': 'This month'
    }[timeframe];
    
    if (score >= 80) {
      return `${timeframeName} investors are extremely greedy - high risk of market top`;
    } else if (score >= 65) {
      return `${timeframeName} shows greed - markets may be getting overheated`;
    } else if (score >= 55) {
      return `${timeframeName} sentiment is mildly greedy - cautiously optimistic`;
    } else if (score >= 45) {
      return `${timeframeName} markets are neutral - balanced investor sentiment`;
    } else if (score >= 35) {
      return `${timeframeName} shows mild fear - some investor concern`;
    } else if (score >= 20) {
      return `${timeframeName} investors are fearful - good buying opportunities may emerge`;
    } else {
      return `${timeframeName} shows extreme fear - potentially great buying opportunity`;
    }
  }

  private setupBackgroundGradient(): void {
    if (!this.data) return;
    
    const score = this.data.timeframes[this.currentTimeframe].score;
    this.updateBackgroundGradient(score);
  }

  private updateBackgroundGradient(score: number): void {
    const backgroundElement = document.querySelector('.background-gradient');
    if (!backgroundElement) return;

    // Remove existing sentiment classes
    backgroundElement.className = 'background-gradient';

    // Add new sentiment class based on score
    if (score >= 80) {
      backgroundElement.classList.add('extreme-greed');
    } else if (score >= 65) {
      backgroundElement.classList.add('greed');
    } else if (score <= 20) {
      backgroundElement.classList.add('extreme-fear');
    } else if (score <= 35) {
      backgroundElement.classList.add('fear');
    }
  }

  private updateLastUpdateTime(): void {
    if (!this.data) return;
    
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
      const updateText = DataService.getLastUpdateText(this.data.lastAnalyzed);
      lastUpdateElement.textContent = updateText;
    }
  }

  private setupRefreshInterval(): void {
    // Refresh data every 5 minutes
    setInterval(async () => {
      try {
        await this.loadData();
        this.updateComponents();
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
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ModernSentimentTracker();
  });
} else {
  new ModernSentimentTracker();
}
