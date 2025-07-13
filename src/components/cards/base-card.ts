import { CardData, CardElements } from './types';
import { StyleManager } from './style-manager';

export class BaseCard {
  protected container: HTMLElement;
  protected data: CardData;
  protected isVisible: boolean = false;
  protected observer: IntersectionObserver | null = null;

  constructor(containerId: string, data: CardData) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Card container with id "${containerId}" not found`);
    }
    this.container = container;
    this.data = data;
  }

  protected createCardStructure(): void {
    this.container.innerHTML = `
      <div class="indicator-card enhanced" data-trend="${this.data.trend || 'neutral'}">
        <div class="morphing-background"></div>
        <div class="card-header">
          <div class="card-title-section">
            <h3 class="card-title">${this.data.title}</h3>
            ${this.data.timeframe ? `<span class="timeframe-badge">${this.data.timeframe}</span>` : ''}
          </div>
          <div class="gauge-container">
            <div class="mini-gauge"></div>
          </div>
        </div>
        
        <div class="card-content">
          <div class="value-section">
            <div class="primary-value" data-value="${this.data.value}">${this.data.value}</div>
            ${this.data.change ? `<div class="change-value ${StyleManager.getTrendClass(this.data.trend)}">${this.data.change}</div>` : ''}
          </div>
          
          <div class="message-section">
            <p class="indicator-message">${this.data.message}</p>
          </div>
        </div>
        
        <div class="card-footer">
          <div class="trend-indicator">
            <div class="trend-line ${StyleManager.getTrendClass(this.data.trend)}"></div>
          </div>
          <div class="pulse-indicator"></div>
        </div>
      </div>
    `;
  }

  protected getCardElements(): Partial<CardElements> {
    return {
      container: this.container,
      card: this.container.querySelector('.indicator-card') as HTMLElement,
      value: this.container.querySelector('.primary-value') as HTMLElement,
      message: this.container.querySelector(
        '.indicator-message',
      ) as HTMLElement,
      gauge: this.container.querySelector('.mini-gauge') as HTMLElement,
      trendLine: this.container.querySelector('.trend-line') as HTMLElement,
      background: this.container.querySelector(
        '.morphing-background',
      ) as HTMLElement,
    };
  }

  protected setupIntersectionObserver(callback: () => void): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.isVisible) {
              this.isVisible = true;
              callback();
            }
          });
        },
        { threshold: 0.1 },
      );

      this.observer.observe(this.container);
    } else {
      this.isVisible = true;
      callback();
    }
  }

  protected setupInteractions(
    onHover: () => void,
    onHoverOut: () => void,
    onClick: () => void,
  ): void {
    const elements = this.getCardElements();
    if (!elements.card) return;

    elements.card.addEventListener('mouseenter', onHover);
    elements.card.addEventListener('mouseleave', onHoverOut);
    elements.card.addEventListener('click', onClick);

    // Touch events for mobile
    elements.card.addEventListener('touchstart', onHover);
    elements.card.addEventListener('touchend', () => {
      onClick();
      setTimeout(onHoverOut, 1000);
    });
  }

  public getData(): CardData {
    return { ...this.data };
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
