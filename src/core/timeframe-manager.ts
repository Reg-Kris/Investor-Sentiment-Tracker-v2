import type { SentimentData, TimeFrame } from '../types/sentiment';
import { ComponentManager } from './component-manager';

export class TimeframeManager {
  private currentTimeframe: TimeFrame = '1d';
  private data: SentimentData | null = null;
  private componentManager: ComponentManager | null = null;

  initialize(data: SentimentData, componentManager: ComponentManager): void {
    this.data = data;
    this.componentManager = componentManager;
    this.setupGlobalTimeframeSwitcher();
  }

  updateComponents(): void {
    if (!this.data || !this.componentManager) return;

    this.componentManager.setTimeframe(this.currentTimeframe);
    this.componentManager.updateAll(this.data);
  }

  getCurrentTimeframe(): TimeFrame {
    return this.currentTimeframe;
  }

  setTimeframe(timeframe: TimeFrame): void {
    this.currentTimeframe = timeframe;
    this.updateActiveButton(timeframe);
    this.updateComponents();
  }

  private setupGlobalTimeframeSwitcher(): void {
    const switcher = document.querySelector('.global-timeframe-switcher');
    if (!switcher) return;

    switcher.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      if (target.classList.contains('timeframe-btn')) {
        const timeframe = target.getAttribute('data-timeframe') as TimeFrame;
        this.handleTimeframeChange(timeframe);
      }
    });
  }

  private handleTimeframeChange(timeframe: TimeFrame): void {
    this.setTimeframe(timeframe);
  }

  private updateActiveButton(timeframe: TimeFrame): void {
    const switcher = document.querySelector('.global-timeframe-switcher');
    if (!switcher) return;

    // Update active button
    switcher.querySelectorAll('.timeframe-btn').forEach((btn) => {
      btn.classList.remove('active');
    });

    const activeButton = switcher.querySelector(
      `[data-timeframe="${timeframe}"]`,
    );
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
}
