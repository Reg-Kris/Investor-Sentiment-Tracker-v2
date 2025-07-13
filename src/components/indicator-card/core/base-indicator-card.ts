import type { IndicatorCardProps } from '../types';
import { GaugeRenderer } from '../gauge';

export class BaseIndicatorCard {
  protected container: HTMLElement;
  protected props: IndicatorCardProps;
  protected gaugeRenderer?: GaugeRenderer;

  constructor(container: HTMLElement, props: IndicatorCardProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  public updateProps(newProps: Partial<IndicatorCardProps>): void {
    this.props = { ...this.props, ...newProps };
    if (this.gaugeRenderer && typeof newProps.score === 'number') {
      this.gaugeRenderer.updateScore(newProps.score);
    }
    this.render();
  }

  protected render(): void {
    const hasGauge = typeof this.props.score === 'number';

    this.container.innerHTML = this.generateHTML(hasGauge);
    this.setupGauge(hasGauge);
    this.addInteractionEffects();
  }

  protected generateHTML(hasGauge: boolean): string {
    return `
      <div class="indicator-card enhanced" data-trend="${this.props.trend || 'neutral'}">
        <div class="card-header">
          <h3 class="card-title">${this.props.title}</h3>
          <div class="gauge-container" ${hasGauge ? '' : 'style="display: none;"'}>
            <canvas class="mini-gauge"></canvas>
          </div>
        </div>
        
        <div class="card-content">
          <div class="value-section">
            <div class="primary-value" style="color: ${this.props.color}">
              ${this.props.value}
            </div>
            ${
              this.props.change
                ? `
              <div class="change-value" style="color: ${this.props.color}">
                ${this.props.change}
              </div>
            `
                : ''
            }
          </div>
          
          <div class="message-section">
            <p class="indicator-message">${this.props.message}</p>
          </div>
          
          <div class="card-footer">
            <div class="trend-indicator">
              <div class="trend-line" style="background: ${this.props.color}"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  protected setupGauge(hasGauge: boolean): void {
    if (!hasGauge) return;

    const canvas = this.container.querySelector(
      '.mini-gauge',
    ) as HTMLCanvasElement;
    if (canvas) {
      this.gaugeRenderer = new GaugeRenderer(canvas);
      if (typeof this.props.score === 'number') {
        this.gaugeRenderer.updateScore(this.props.score);
      }
    }
  }

  protected addInteractionEffects(): void {
    const card = this.container.querySelector('.indicator-card') as HTMLElement;
    if (!card) return;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = `0 12px 40px ${this.props.color}25`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '';
    });
  }

  public destroy(): void {
    if (this.gaugeRenderer) {
      this.gaugeRenderer.destroy();
    }
  }
}
