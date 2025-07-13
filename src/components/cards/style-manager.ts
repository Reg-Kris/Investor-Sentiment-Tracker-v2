export class StyleManager {
  static getTrendClass(trend?: string): string {
    if (!trend) return 'neutral';

    switch (trend) {
      case 'up':
        return 'positive';
      case 'down':
        return 'negative';
      default:
        return 'neutral';
    }
  }

  static getTrendColor(trend?: string): string {
    const trendClass = this.getTrendClass(trend);

    if (trendClass.includes('positive')) return 'rgba(34, 197, 94, 0.8)';
    else if (trendClass.includes('negative')) return 'rgba(239, 68, 68, 0.8)';
    return 'rgba(59, 130, 246, 0.8)';
  }

  static createMorphingShapeStyle(index: number, color?: string): string {
    const defaultColor = 'rgba(59, 130, 246, 0.3)';
    const shapeColor = color || defaultColor;

    return `
      position: absolute;
      width: ${60 + index * 20}px;
      height: ${60 + index * 20}px;
      background: linear-gradient(135deg, 
        ${shapeColor}, 
        ${color || 'rgba(139, 92, 246, 0.3)'}
      );
      border-radius: 50%;
      filter: blur(${10 + index * 5}px);
      opacity: 0;
    `;
  }

  static createBackgroundStyle(): string {
    return `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.1;
      z-index: 1;
      overflow: hidden;
      border-radius: 16px;
    `;
  }

  static createRippleStyle(): string {
    return `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;
    `;
  }

  static getDefaultCardColor(): string {
    return 'rgba(59, 130, 246, 0.3)';
  }
}
