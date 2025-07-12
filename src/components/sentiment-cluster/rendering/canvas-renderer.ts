export interface GaugeSegment {
  start: number;
  end: number;
  color: string;
}

export interface CanvasRendererConfig {
  width: number;
  height: number;
  radius: number;
  needleLength: number;
  segmentWidth: number;
  centerOffsetY: number;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private config: CanvasRendererConfig;

  constructor(
    ctx: CanvasRenderingContext2D,
    config: Partial<CanvasRendererConfig> = {}
  ) {
    this.ctx = ctx;
    this.config = {
      width: 300,
      height: 200,
      radius: 80,
      needleLength: 70,
      segmentWidth: 8,
      centerOffsetY: 20,
      ...config
    };
  }

  public updateConfig(newConfig: Partial<CanvasRendererConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getCenterPosition(): { x: number; y: number } {
    return {
      x: this.config.width / 2,
      y: this.config.height - this.config.centerOffsetY
    };
  }

  public clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
  }

  public drawGaugeBackground(): void {
    const { x: centerX, y: centerY } = this.getCenterPosition();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, this.config.radius, Math.PI, 0);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = this.config.segmentWidth;
    this.ctx.stroke();
  }

  public drawGaugeSegments(): void {
    const { x: centerX, y: centerY } = this.getCenterPosition();
    const segments: GaugeSegment[] = [
      { start: 180, end: 150, color: '#dc2626' }, // Extreme Fear
      { start: 150, end: 120, color: '#ea580c' }, // Fear
      { start: 120, end: 90, color: '#d97706' },  // Mild Fear
      { start: 90, end: 70, color: '#65a30d' },   // Neutral
      { start: 70, end: 45, color: '#16a34a' },   // Mild Greed
      { start: 45, end: 15, color: '#059669' },   // Greed
      { start: 15, end: 0, color: '#047857' }     // Extreme Greed
    ];

    segments.forEach(segment => {
      this.ctx.beginPath();
      this.ctx.arc(
        centerX, 
        centerY, 
        this.config.radius, 
        (segment.start * Math.PI) / 180, 
        (segment.end * Math.PI) / 180
      );
      this.ctx.strokeStyle = segment.color;
      this.ctx.lineWidth = this.config.segmentWidth;
      this.ctx.stroke();
    });
  }

  public drawNeedle(angle: number): void {
    const { x: centerX, y: centerY } = this.getCenterPosition();
    const angleRad = (angle * Math.PI) / 180;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angleRad - Math.PI / 2);

    // Needle body
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, -this.config.needleLength);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Needle tip
    this.ctx.beginPath();
    this.ctx.arc(0, -this.config.needleLength, 2, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    this.ctx.restore();
  }

  public drawCenterCircle(): void {
    const { x: centerX, y: centerY } = this.getCenterPosition();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
  }

  public drawLabels(): void {
    const { x: centerX, y: centerY } = this.getCenterPosition();
    
    this.ctx.font = '12px JetBrains Sans, sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.textAlign = 'center';

    // Left label (Fear)
    this.ctx.fillText('FEAR', centerX - this.config.radius + 20, centerY + 15);
    
    // Right label (Greed)
    this.ctx.fillText('GREED', centerX + this.config.radius - 20, centerY + 15);
    
    // Center label (Neutral)
    this.ctx.fillText('NEUTRAL', centerX, centerY + 30);
  }

  public renderComplete(angle: number): void {
    this.clearCanvas();
    this.drawGaugeBackground();
    this.drawGaugeSegments();
    this.drawNeedle(angle);
    this.drawCenterCircle();
    this.drawLabels();
  }
}