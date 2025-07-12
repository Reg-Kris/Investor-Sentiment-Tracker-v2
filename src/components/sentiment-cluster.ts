import type { SentimentClusterProps, TimeFrame } from '../types/sentiment';

export class SentimentCluster {
  private container: HTMLElement;
  private props: SentimentClusterProps;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private currentAngle: number = 0;
  private targetAngle: number = 0;

  constructor(container: HTMLElement, props: SentimentClusterProps) {
    this.container = container;
    this.props = props;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    this.setupCanvas();
    this.setupTimeframeSwitcher();
    this.render();
    this.startAnimation();
  }

  private setupCanvas(): void {
    this.canvas.width = 300;
    this.canvas.height = 200;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.maxWidth = '300px';
  }

  private setupTimeframeSwitcher(): void {
    const switcher = document.createElement('div');
    switcher.className = 'timeframe-switcher';
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

    this.container.appendChild(switcher);
  }

  private updateTimeframe(timeframe: TimeFrame): void {
    // Update active button
    this.container.querySelectorAll('.timeframe-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-timeframe') === timeframe);
    });

    this.props.timeframe = timeframe;
    if (this.props.onTimeframeChange) {
      this.props.onTimeframeChange(timeframe);
    }
  }

  public updateProps(newProps: Partial<SentimentClusterProps>): void {
    this.props = { ...this.props, ...newProps };
    this.updateTargetAngle();
    this.updateLabels();
  }

  private updateTargetAngle(): void {
    // Convert score (0-100) to angle (-90 to +90 degrees)
    // 0 = -90° (extreme fear), 50 = 0° (neutral), 100 = +90° (extreme greed)
    this.targetAngle = ((this.props.score - 50) / 50) * 90;
  }

  private updateLabels(): void {
    let sentimentElement = this.container.querySelector('.sentiment-score');
    if (!sentimentElement) {
      sentimentElement = document.createElement('div');
      sentimentElement.className = 'sentiment-score';
      this.container.appendChild(sentimentElement);
    }

    let messageElement = this.container.querySelector('.sentiment-message');
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.className = 'sentiment-message';
      this.container.appendChild(messageElement);
    }

    sentimentElement.textContent = `${this.props.score}`;
    messageElement.textContent = this.props.message;

    // Add sentiment class for styling
    this.container.className = `sentiment-cluster ${this.getSentimentClass()}`;
  }

  private getSentimentClass(): string {
    if (this.props.score >= 80) return 'extreme-greed';
    if (this.props.score >= 65) return 'greed';
    if (this.props.score >= 55) return 'mild-greed';
    if (this.props.score >= 45) return 'neutral';
    if (this.props.score >= 35) return 'mild-fear';
    if (this.props.score >= 20) return 'fear';
    return 'extreme-fear';
  }

  private startAnimation(): void {
    this.updateTargetAngle();
    this.animate();
  }

  private animate = (): void => {
    // Smooth angle interpolation
    const diff = this.targetAngle - this.currentAngle;
    this.currentAngle += diff * 0.1;

    // Stop animation if close enough
    if (Math.abs(diff) < 0.1) {
      this.currentAngle = this.targetAngle;
    }

    this.drawCluster();

    if (Math.abs(diff) > 0.1) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  private drawCluster(): void {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height - 20;
    const radius = 80;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw gauge background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw colored segments
    this.drawGaugeSegments(centerX, centerY, radius);

    // Draw needle
    this.drawNeedle(centerX, centerY, radius - 10);

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Draw labels
    this.drawLabels(centerX, centerY, radius);
  }

  private drawGaugeSegments(centerX: number, centerY: number, radius: number): void {
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
      ctx.lineWidth = 8;
      ctx.stroke();
    });
  }

  private drawNeedle(centerX: number, centerY: number, length: number): void {
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
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle tip
    ctx.beginPath();
    ctx.arc(0, -length, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  private drawLabels(centerX: number, centerY: number, radius: number): void {
    const ctx = this.ctx;
    ctx.font = '12px JetBrains Sans, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';

    // Left label (Fear)
    ctx.fillText('FEAR', centerX - radius + 20, centerY + 15);
    
    // Right label (Greed)
    ctx.fillText('GREED', centerX + radius - 20, centerY + 15);
    
    // Center label (Neutral)
    ctx.fillText('NEUTRAL', centerX, centerY + 30);
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    this.setupTimeframeSwitcher();
    this.updateLabels();
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}