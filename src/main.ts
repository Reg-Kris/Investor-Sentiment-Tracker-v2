interface MarketData {
  spy: { current: { change: number; changePercent: number; price: number }; historical: Array<{ change: number; date: string }> };
  qqq: { current: { change: number; changePercent: number; price: number }; historical: Array<{ change: number; date: string }> };
  iwm: { current: { change: number; changePercent: number; price: number }; historical: Array<{ change: number; date: string }> };
  vix: { current: { value: number }; historical: Array<{ value: number; date: string }> };
  fearGreed: { current: { value: number; rating: string }; historical: Array<{ value: number; date: string }> };
  options: { sentiment: string; ratio: number };
}

interface SentimentData {
  overall: {
    score: number;
    sentiment: string;
    message: string;
  };
  timeframes: {
    [key: string]: {
      score: number;
      sentiment: string;
      message: string;
    };
  };
  indicators: {
    fearGreed: { value: number; label: string; message: string };
    spy: { price: number; change: number; message: string };
    qqq: { price: number; change: number; message: string };
    iwm: { price: number; change: number; message: string };
    vix: { value: number; message: string };
    options: { spy: string; qqq: string; iwm: string };
  };
  lastAnalyzed: string;
}

class SimpleSentimentTracker {
  private currentTimeframe = '1d';
  private sentimentData: SentimentData | null = null;
  private marketData: MarketData | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadData();
    this.setupEventListeners();
    this.updateDisplay();
  }

  private async loadData() {
    try {
      const [sentimentResponse, marketResponse] = await Promise.all([
        fetch('./data/sentiment-analysis.json'),
        fetch('./data/market-data.json')
      ]);
      this.sentimentData = await sentimentResponse.json();
      this.marketData = await marketResponse.json();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showError();
    }
  }

  private setupEventListeners() {
    // Timeframe buttons
    document.querySelectorAll('.timeframe-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const timeframe = target.dataset.timeframe;

        if (timeframe) {
          // Update active button
          document
            .querySelectorAll('.timeframe-btn')
            .forEach((b) => b.classList.remove('active'));
          target.classList.add('active');

          this.currentTimeframe = timeframe;
          this.updateDisplay();
        }
      });
    });
  }

  private updateDisplay() {
    if (!this.sentimentData) return;

    this.updateMainSentiment();
    this.updateIndicators();
    this.updateLastUpdate();
  }

  private updateMainSentiment() {
    if (!this.sentimentData) return;

    const timeframeData =
      this.sentimentData.timeframes[this.currentTimeframe] ||
      this.sentimentData.overall;

    const scoreEl = document.getElementById('sentiment-score');
    const labelEl = document.getElementById('sentiment-label');
    const descEl = document.getElementById('sentiment-description');

    if (scoreEl) scoreEl.textContent = timeframeData.score.toString();
    if (labelEl) {
      labelEl.textContent = timeframeData.sentiment;
      labelEl.className = `sentiment-label ${this.getSentimentClass(timeframeData.score)}`;
    }
    if (descEl)
      descEl.textContent = this.generateSentimentDescription(
        timeframeData.score,
        timeframeData.sentiment,
      );
  }

  private updateIndicators() {
    if (!this.sentimentData || !this.marketData) return;

    const indicators = this.sentimentData.indicators;

    // Fear & Greed Index
    this.updateIndicatorCard(
      'fear-greed',
      indicators.fearGreed.value.toString(),
      this.generateFearGreedMessage(this.marketData.fearGreed),
      indicators.fearGreed.value,
    );

    // SPY
    this.updateIndicatorCard(
      'spy',
      `$${indicators.spy.price.toFixed(2)}`,
      this.generateStockMessage('SPY', this.marketData.spy),
      indicators.spy.change,
    );

    // QQQ
    this.updateIndicatorCard(
      'qqq',
      `$${indicators.qqq.price.toFixed(2)}`,
      this.generateStockMessage('QQQ', this.marketData.qqq),
      indicators.qqq.change,
    );

    // IWM
    this.updateIndicatorCard(
      'iwm',
      `$${indicators.iwm.price.toFixed(2)}`,
      this.generateStockMessage('IWM', this.marketData.iwm),
      indicators.iwm.change,
    );

    // VIX
    this.updateIndicatorCard(
      'vix',
      indicators.vix.value.toString(),
      this.generateVixMessage(this.marketData.vix),
      -indicators.vix.value,
    );

    // Options
    this.updateIndicatorCard(
      'options', 
      this.marketData.options.ratio.toFixed(2),
      this.generateOptionsMessage(this.marketData.options),
      this.marketData.options.sentiment === 'bearish' ? -1 : this.marketData.options.sentiment === 'bullish' ? 1 : 0
    );
  }

  private updateIndicatorCard(
    id: string,
    value: string,
    description: string,
    changeValue: number,
  ) {
    const valueEl = document.getElementById(`${id}-value`);
    const descEl = document.getElementById(`${id}-desc`);

    if (valueEl) {
      valueEl.textContent = value;
      valueEl.className = `indicator-value ${this.getStatusClass(changeValue)}`;
    }
    if (descEl) descEl.textContent = description;
  }

  private getSentimentClass(score: number): string {
    if (score <= 35) return 'status-negative';
    if (score >= 65) return 'status-positive';
    return 'status-neutral';
  }

  private getStatusClass(value: number): string {
    if (value > 0) return 'status-positive';
    if (value < 0) return 'status-negative';
    return 'status-neutral';
  }

  private generateSentimentDescription(
    score: number,
    _sentiment: string,
  ): string {
    const timeframeName = this.getTimeframeName();

    if (score <= 25) {
      return `Extreme fear dominates ${timeframeName}. Investors are very worried, which often creates buying opportunities for patient investors.`;
    } else if (score <= 35) {
      return `Fear is present ${timeframeName}. Markets are cautious, potentially offering good entry points for quality investments.`;
    } else if (score <= 45) {
      return `Slight pessimism ${timeframeName}. Markets are below neutral, showing some concern among investors.`;
    } else if (score <= 55) {
      return `Balanced sentiment ${timeframeName}. Markets are neutral with normal trading activity and moderate optimism.`;
    } else if (score <= 65) {
      return `Optimism is building ${timeframeName}. Investors are feeling good about market prospects.`;
    } else if (score <= 75) {
      return `Greed is emerging ${timeframeName}. Strong optimism, but watch for overheating signs.`;
    } else {
      return `Extreme greed ${timeframeName}. Euphoric sentiment may indicate market tops - consider taking profits.`;
    }
  }

  private getTimeframeName(): string {
    switch (this.currentTimeframe) {
      case '1d':
        return 'today';
      case '5d':
        return 'this week';
      case '1m':
        return 'this month';
      default:
        return 'currently';
    }
  }

  private updateLastUpdate() {
    if (!this.sentimentData) return;

    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl && this.sentimentData.lastAnalyzed) {
      const date = new Date(this.sentimentData.lastAnalyzed);
      lastUpdateEl.textContent = date.toLocaleString();
    }
  }

  private generateFearGreedMessage(fearGreedData: any): string {
    const current = fearGreedData.current.value;
    const yesterday = fearGreedData.historical[1]?.value || current;
    const change = current - yesterday;
    
    if (current >= 75) {
      return change > 0 ? 'Extreme greed intensifying - markets euphoric' : 'Extreme greed cooling slightly';
    } else if (current >= 65) {
      return change > 0 ? 'Greed building as optimism grows' : 'Greed easing after recent gains';
    } else if (current >= 35) {
      return 'Neutral sentiment - balanced market emotions';
    } else if (current >= 25) {
      return change < 0 ? 'Fear deepening as uncertainty spreads' : 'Fear stabilizing - may signal bottom';
    } else {
      return 'Extreme fear - potential buying opportunity';
    }
  }

  private generateStockMessage(symbol: string, stockData: any): string {
    const current = stockData.current.changePercent;
    const recent = stockData.historical.slice(0, 5).map((d: any) => d.change);
    const positiveDays = recent.filter((c: number) => c > 0).length;
    
    let changeText = `${current >= 0 ? '+' : ''}${current.toFixed(2)}%`;
    
    if (current > 2) {
      return `${changeText} - Strong buying pressure in ${symbol}`;
    } else if (current > 0.5) {
      return positiveDays >= 3 ? `${changeText} - ${symbol} extending rally` : `${changeText} - ${symbol} gaining momentum`;
    } else if (current > -0.5) {
      return `${changeText} - ${symbol} trading sideways`;
    } else if (current > -2) {
      return positiveDays <= 1 ? `${changeText} - ${symbol} under selling pressure` : `${changeText} - ${symbol} taking profits`;
    } else {
      return `${changeText} - Heavy selling in ${symbol}`;
    }
  }

  private generateVixMessage(vixData: any): string {
    const current = vixData.current.value;
    const yesterday = vixData.historical[1]?.value || current;
    const change = current - yesterday;
    
    if (current > 30) {
      return 'High volatility - market stress elevated';
    } else if (current > 20) {
      return change > 0 ? 'Volatility rising - some market concern' : 'Volatility moderating from highs';
    } else if (current > 15) {
      return 'Normal volatility - steady market conditions';
    } else {
      return change < 0 ? 'Low volatility - complacent markets' : 'Calm markets with low fear';
    }
  }

  private generateOptionsMessage(optionsData: any): string {
    const ratio = optionsData.ratio;
    
    if (ratio > 1.2) {
      return `P/C ${ratio.toFixed(2)} - Heavy put buying suggests fear`;
    } else if (ratio > 1.0) {
      return `P/C ${ratio.toFixed(2)} - Moderate bearish sentiment in options`;
    } else if (ratio > 0.8) {
      return `P/C ${ratio.toFixed(2)} - Balanced options activity`;
    } else {
      return `P/C ${ratio.toFixed(2)} - Call heavy - bullish options sentiment`;
    }
  }

  private showError() {
    const mainCard = document.querySelector('.main-card');
    if (mainCard) {
      mainCard.innerHTML = `
        <div class="loading">
          <h2>Unable to load market data</h2>
          <p>Please try refreshing the page. If the problem persists, the data service may be temporarily unavailable.</p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SimpleSentimentTracker();
  });
} else {
  new SimpleSentimentTracker();
}