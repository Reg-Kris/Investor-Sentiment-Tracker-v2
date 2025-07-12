import type { GaugeConfig, GaugeSegment } from '../types';

export class GaugeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = context;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = 120;
    this.canvas.height = 80;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.maxWidth = '120px';
  }

  public updateScore(score: number): void {
    // Convert score (0-100) to angle (-90 to +90 degrees)
    this.targetAngle = ((score - 50) / 50) * 90;
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

    this.draw();

    if (Math.abs(diff) > 0.1) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  private draw(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height - 10;
    const radius = 30;

    const config: GaugeConfig = {
      centerX,
      centerY,
      radius,
      segments: this.getDefaultSegments()
    };

    this.drawGauge(config);
  }

  private drawGauge(config: GaugeConfig): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw gauge background arc
    this.drawBackgroundArc(config);

    // Draw colored segments
    this.drawSegments(config);

    // Draw needle
    this.drawNeedle(config);

    // Draw center circle
    this.drawCenterCircle(config);
  }

  private drawBackgroundArc(config: GaugeConfig): void {
    this.ctx.beginPath();
    this.ctx.arc(config.centerX, config.centerY, config.radius, Math.PI, 0);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
  }

  private drawSegments(config: GaugeConfig): void {
    config.segments.forEach(segment => {
      this.ctx.beginPath();
      this.ctx.arc(
        config.centerX, 
        config.centerY, 
        config.radius, 
        (segment.start * Math.PI) / 180, 
        (segment.end * Math.PI) / 180
      );
      this.ctx.strokeStyle = segment.color;
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
    });
  }

  private drawNeedle(config: GaugeConfig): void {
    const angle = (this.currentAngle * Math.PI) / 180;
    const length = config.radius - 5;

    this.ctx.save();
    this.ctx.translate(config.centerX, config.centerY);
    this.ctx.rotate(angle - Math.PI / 2);

    // Needle body
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, -length);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Needle tip
    this.ctx.beginPath();
    this.ctx.arc(0, -length, 1, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawCenterCircle(config: GaugeConfig): void {
    this.ctx.beginPath();
    this.ctx.arc(config.centerX, config.centerY, 3, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
  }

  private getDefaultSegments(): GaugeSegment[] {
    return [
      { start: 180, end: 150, color: '#dc2626' }, // Extreme Fear
      { start: 150, end: 120, color: '#ea580c' }, // Fear
      { start: 120, end: 90, color: '#d97706' },  // Mild Fear
      { start: 90, end: 70, color: '#65a30d' },   // Neutral
      { start: 70, end: 45, color: '#16a34a' },   // Mild Greed
      { start: 45, end: 15, color: '#059669' },   // Greed
      { start: 15, end: 0, color: '#047857' }     // Extreme Greed
    ];
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}