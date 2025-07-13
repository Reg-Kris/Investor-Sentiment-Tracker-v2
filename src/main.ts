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
      const response = await fetch('/public/data/sentiment-analysis.json');
      this.sentimentData = await response.json();
    } catch (error) {
      console.error('Failed to load sentiment data:', error);
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
    if (!this.sentimentData) return;

    const indicators = this.sentimentData.indicators;

    // Fear & Greed Index
    this.updateIndicatorCard(
      'fear-greed',
      indicators.fearGreed.value.toString(),
      indicators.fearGreed.message,
      indicators.fearGreed.value,
    );

    // SPY
    this.updateIndicatorCard(
      'spy',
      `$${indicators.spy.price.toFixed(2)}`,
      `${indicators.spy.change >= 0 ? '+' : ''}${indicators.spy.change.toFixed(2)} - ${indicators.spy.message}`,
      indicators.spy.change,
    );

    // QQQ
    this.updateIndicatorCard(
      'qqq',
      `$${indicators.qqq.price.toFixed(2)}`,
      `${indicators.qqq.change >= 0 ? '+' : ''}${indicators.qqq.change.toFixed(2)} - ${indicators.qqq.message}`,
      indicators.qqq.change,
    );

    // IWM
    this.updateIndicatorCard(
      'iwm',
      `$${indicators.iwm.price.toFixed(2)}`,
      `${indicators.iwm.change >= 0 ? '+' : ''}${indicators.iwm.change.toFixed(2)} - ${indicators.iwm.message}`,
      indicators.iwm.change,
    );

    // VIX
    this.updateIndicatorCard(
      'vix',
      indicators.vix.value.toString(),
      indicators.vix.message,
      -indicators.vix.value,
    );

    // Options
    const optionsMessage =
      indicators.options.spy !== 'SPY options data unavailable'
        ? indicators.options.spy
        : 'Options data currently unavailable';
    this.updateIndicatorCard('options', 'Mixed', optionsMessage, 0);
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
