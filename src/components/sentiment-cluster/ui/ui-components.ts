import type { TimeFrame } from '../../../types/sentiment';

export interface CanvasConfig {
  width: number;
  height: number;
  maxWidth: string;
}

export interface TimeframeSwitcherConfig {
  timeframes: { value: TimeFrame; label: string }[];
  activeTimeframe: TimeFrame;
}

export class UIComponents {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public createCanvas(config: Partial<CanvasConfig> = {}): HTMLCanvasElement {
    const finalConfig = {
      width: 300,
      height: 200,
      maxWidth: '300px',
      ...config,
    };

    const canvas = document.createElement('canvas');
    canvas.width = finalConfig.width;
    canvas.height = finalConfig.height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = finalConfig.maxWidth;

    return canvas;
  }

  public createTimeframeSwitcher(
    config: TimeframeSwitcherConfig,
    onTimeframeChange: (timeframe: TimeFrame) => void,
  ): HTMLElement {
    const switcher = document.createElement('div');
    switcher.className = 'timeframe-switcher';

    const buttons = config.timeframes
      .map((tf) => {
        const isActive = tf.value === config.activeTimeframe;
        return `<button class="timeframe-btn ${isActive ? 'active' : ''}" data-timeframe="${tf.value}">${tf.label}</button>`;
      })
      .join('');

    switcher.innerHTML = buttons;

    switcher.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      if (target.classList.contains('timeframe-btn')) {
        const timeframe = target.getAttribute('data-timeframe') as TimeFrame;
        this.updateActiveTimeframeButton(timeframe);
        onTimeframeChange(timeframe);
      }
    });

    return switcher;
  }

  public updateActiveTimeframeButton(timeframe: TimeFrame): void {
    this.container.querySelectorAll('.timeframe-btn').forEach((btn) => {
      btn.classList.toggle(
        'active',
        btn.getAttribute('data-timeframe') === timeframe,
      );
    });
  }

  public createOrUpdateSentimentScore(score: number): HTMLElement {
    let sentimentElement = this.container.querySelector(
      '.sentiment-score',
    ) as HTMLElement;

    if (!sentimentElement) {
      sentimentElement = document.createElement('div');
      sentimentElement.className = 'sentiment-score';
      this.container.appendChild(sentimentElement);
    }

    sentimentElement.textContent = `${score}`;
    return sentimentElement;
  }

  public createOrUpdateSentimentMessage(message: string): HTMLElement {
    let messageElement = this.container.querySelector(
      '.sentiment-message',
    ) as HTMLElement;

    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.className = 'sentiment-message';
      this.container.appendChild(messageElement);
    }

    messageElement.textContent = message;
    return messageElement;
  }

  public updateSentimentClass(score: number): void {
    const sentimentClass = this.getSentimentClass(score);
    this.container.className = `sentiment-cluster ${sentimentClass}`;
  }

  private getSentimentClass(score: number): string {
    if (score >= 80) return 'extreme-greed';
    if (score >= 65) return 'greed';
    if (score >= 55) return 'mild-greed';
    if (score >= 45) return 'neutral';
    if (score >= 35) return 'mild-fear';
    if (score >= 20) return 'fear';
    return 'extreme-fear';
  }

  public clearContainer(): void {
    this.container.innerHTML = '';
  }

  public appendElement(element: HTMLElement): void {
    this.container.appendChild(element);
  }

  public updateLabels(score: number, message: string): void {
    this.createOrUpdateSentimentScore(score);
    this.createOrUpdateSentimentMessage(message);
    this.updateSentimentClass(score);
  }

  public getDefaultTimeframeSwitcherConfig(
    activeTimeframe: TimeFrame,
  ): TimeframeSwitcherConfig {
    return {
      timeframes: [
        { value: '1d', label: '1D' },
        { value: '5d', label: '5D' },
        { value: '1m', label: '1M' },
      ],
      activeTimeframe,
    };
  }
}
