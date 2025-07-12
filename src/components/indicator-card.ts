import type { TimeFrame } from '../types/sentiment';

interface IndicatorCardProps {
  title: string;
  value: string;
  change?: string;
  message: string;
  color: string;
  timeframe: TimeFrame;
  trend?: 'up' | 'down' | 'neutral';
  score?: number; // Score for gauge visualization (0-100)
  onTimeframeChange?: (timeframe: TimeFrame) => void;
}

export class IndicatorCard {
  private container: HTMLElement;
  private props: IndicatorCardProps;
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private currentAngle: number = 0;
  private targetAngle: number = 0;

  constructor(container: HTMLElement, props: IndicatorCardProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  public updateProps(newProps: Partial<IndicatorCardProps>): void {
    this.props = { ...this.props, ...newProps };
    this.updateTargetAngle();
    this.render();
  }

  private setupCanvas(): void {
    if (!this.canvas) return;
    this.canvas.width = 120;
    this.canvas.height = 80;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.maxWidth = '120px';
  }

  private updateTargetAngle(): void {
    if (!this.props.score) return;
    // Convert score (0-100) to angle (-90 to +90 degrees)
    this.targetAngle = ((this.props.score - 50) / 50) * 90;
  }

  private startGaugeAnimation(): void {
    if (!this.props.score) return;
    this.updateTargetAngle();
    this.animate();
  }

  private animate = (): void => {
    if (!this.ctx || !this.canvas) return;
    
    // Smooth angle interpolation
    const diff = this.targetAngle - this.currentAngle;
    this.currentAngle += diff * 0.1;

    // Stop animation if close enough
    if (Math.abs(diff) < 0.1) {
      this.currentAngle = this.targetAngle;
    }

    this.drawMiniGauge();

    if (Math.abs(diff) > 0.1) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  private drawMiniGauge(): void {
    if (!this.ctx || !this.canvas) return;
    
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height - 10;
    const radius = 30;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw gauge background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw colored segments
    this.drawMiniGaugeSegments(centerX, centerY, radius);

    // Draw needle
    this.drawMiniNeedle(centerX, centerY, radius - 5);

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  private drawMiniGaugeSegments(centerX: number, centerY: number, radius: number): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const segments = [
      { start: 180, end: 150, color: '#dc2626' }, // Extreme Fear
      { start: 150, end: 120, color: '#ea580c' }, // Fear
      { start: 120, end: 90, color: '#d97706' },  // Mild Fear
      { start: 90, end: 70, color: '#65a30d' },   // Neutral
      { start: 70, end: 45, color: '#16a34a' },   // Mild Greed
      { start: 45, end: 15, color: '#059669' },   // Greed
      { start: 15, end: 0, color: '#047857' }     // Extreme Greed
    ];

    segments.forEach(segment => {
      ctx.beginPath();
      ctx.arc(
        centerX, 
        centerY, 
        radius, 
        (segment.start * Math.PI) / 180, 
        (segment.end * Math.PI) / 180
      );
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = 4;
      ctx.stroke();
    });
  }

  private drawMiniNeedle(centerX: number, centerY: number, length: number): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const angle = (this.currentAngle * Math.PI) / 180;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle - Math.PI / 2);

    // Needle body
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle tip
    ctx.beginPath();
    ctx.arc(0, -length, 1, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  private setupTimeframeSwitcher(): HTMLElement | null {
    if (!this.props.onTimeframeChange) return null;
    
    const switcher = document.createElement('div');
    switcher.className = 'timeframe-switcher mini';
    switcher.innerHTML = `
      <button class="timeframe-btn ${this.props.timeframe === '1d' ? 'active' : ''}" data-timeframe="1d">1D</button>
      <button class="timeframe-btn ${this.props.timeframe === '5d' ? 'active' : ''}" data-timeframe="5d">5D</button>
      <button class="timeframe-btn ${this.props.timeframe === '1m' ? 'active' : ''}" data-timeframe="1m">1M</button>
    `;

    switcher.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      if (target.classList.contains('timeframe-btn')) {
        const timeframe = target.getAttribute('data-timeframe') as TimeFrame;
        this.updateTimeframe(timeframe);
      }
    });

    return switcher;
  }

  private updateTimeframe(timeframe: TimeFrame): void {
    if (!this.props.onTimeframeChange) return;
    
    // Update active button
    this.container.querySelectorAll('.timeframe-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-timeframe') === timeframe);
    });

    this.props.timeframe = timeframe;
    this.props.onTimeframeChange(timeframe);
  }

  private render(): void {
    const hasGauge = typeof this.props.score === 'number';
    
    this.container.innerHTML = `
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
            ${this.props.change ? `
              <div class="change-value" style="color: ${this.props.color}">
                ${this.props.change}
              </div>
            ` : ''}
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

    // Setup canvas for gauge if score is provided
    if (hasGauge) {
      this.canvas = this.container.querySelector('.mini-gauge') as HTMLCanvasElement;
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d')!;
        this.setupCanvas();
        this.startGaugeAnimation();
      }
    }

    // Setup timeframe switcher if callback provided
    const timeframeSwitcher = this.setupTimeframeSwitcher();
    if (timeframeSwitcher) {
      const cardFooter = this.container.querySelector('.card-footer');
      if (cardFooter) {
        cardFooter.appendChild(timeframeSwitcher);
      }
    }

    this.addInteractionEffects();
  }

  private addInteractionEffects(): void {
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

export class VixCard extends IndicatorCard {
  constructor(
    container: HTMLElement, 
    value: number, 
    message: string, 
    color: string, 
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void
  ) {
    // Convert VIX value to a 0-100 score for gauge visualization
    // VIX typically ranges from 10-80, normalize to 0-100
    const normalizedScore = Math.min(Math.max((value / 40) * 100, 0), 100);
    
    super(container, {
      title: 'Market Volatility (VIX)',
      value: value.toFixed(1),
      message,
      color,
      timeframe,
      trend: value > 25 ? 'up' : value < 15 ? 'down' : 'neutral',
      score: normalizedScore,
      onTimeframeChange
    });
  }
}

export class MarketCard extends IndicatorCard {
  constructor(
    container: HTMLElement, 
    title: string, 
    price: number, 
    change: number, 
    message: string, 
    color: string, 
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void
  ) {
    const changePrefix = change >= 0 ? '+' : '';
    // Convert percentage change to a 0-100 score for gauge visualization
    // Assume -10% to +10% is our typical range, normalize to 0-100
    const normalizedScore = Math.min(Math.max(((change + 10) / 20) * 100, 0), 100);
    
    super(container, {
      title,
      value: `$${price.toFixed(2)}`,
      change: `${changePrefix}${change.toFixed(2)}%`,
      message,
      color,
      timeframe,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      score: normalizedScore,
      onTimeframeChange
    });
  }
}

export class OptionsCard extends IndicatorCard {
  constructor(
    container: HTMLElement, 
    symbol: string, 
    message: string, 
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void
  ) {
    const sentiment = message.toLowerCase();
    let color = '#6b7280';
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let score = 50; // Default neutral score

    if (sentiment.includes('very bullish')) {
      color = '#10b981';
      trend = 'up';
      score = 80;
    } else if (sentiment.includes('bullish')) {
      color = '#16a34a';
      trend = 'up';
      score = 70;
    } else if (sentiment.includes('very bearish')) {
      color = '#ef4444';
      trend = 'down';
      score = 20;
    } else if (sentiment.includes('bearish')) {
      color = '#ea580c';
      trend = 'down';
      score = 30;
    }

    super(container, {
      title: `${symbol} Options`,
      value: sentiment.includes('very') ? 'Strong' : 'Moderate',
      message,
      color,
      timeframe,
      trend,
      score,
      onTimeframeChange
    });
  }
}

// Enhanced Fear & Greed Card
export class FearGreedCard extends IndicatorCard {
  constructor(
    container: HTMLElement,
    score: number,
    message: string,
    color: string,
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void
  ) {
    let sentiment = 'Neutral';
    if (score >= 80) sentiment = 'Extreme Greed';
    else if (score >= 65) sentiment = 'Greed';
    else if (score >= 55) sentiment = 'Mild Greed';
    else if (score >= 45) sentiment = 'Neutral';
    else if (score >= 35) sentiment = 'Mild Fear';
    else if (score >= 20) sentiment = 'Fear';
    else sentiment = 'Extreme Fear';

    super(container, {
      title: 'Fear & Greed Index',
      value: score.toString(),
      message: `${sentiment} - ${message}`,
      color,
      timeframe,
      trend: score > 50 ? 'up' : score < 50 ? 'down' : 'neutral',
      score,
      onTimeframeChange
    });
  }
}