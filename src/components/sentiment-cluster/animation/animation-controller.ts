export interface AnimationConfig {
  interpolationSpeed: number;
  stopThreshold: number;
}

export type AnimationCallback = (angle: number) => void;

export class AnimationController {
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private animationId: number | null = null;
  private config: AnimationConfig;
  private renderCallback: AnimationCallback | null = null;

  constructor(config: Partial<AnimationConfig> = {}) {
    this.config = {
      interpolationSpeed: 0.1,
      stopThreshold: 0.1,
      ...config,
    };
  }

  public setRenderCallback(callback: AnimationCallback): void {
    this.renderCallback = callback;
  }

  public updateConfig(newConfig: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public setTargetAngle(angle: number): void {
    this.targetAngle = angle;
    this.startAnimation();
  }

  public getCurrentAngle(): number {
    return this.currentAngle;
  }

  public getTargetAngle(): number {
    return this.targetAngle;
  }

  public calculateAngleFromScore(score: number): number {
    // Convert score (0-100) to angle (-90 to +90 degrees)
    // 0 = -90° (extreme fear), 50 = 0° (neutral), 100 = +90° (extreme greed)
    return ((score - 50) / 50) * 90;
  }

  public updateFromScore(score: number): void {
    const newAngle = this.calculateAngleFromScore(score);
    this.setTargetAngle(newAngle);
  }

  private startAnimation(): void {
    if (this.animationId !== null) {
      return; // Animation already running
    }
    this.animate();
  }

  private animate = (): void => {
    // Smooth angle interpolation
    const diff = this.targetAngle - this.currentAngle;
    this.currentAngle += diff * this.config.interpolationSpeed;

    // Stop animation if close enough
    if (Math.abs(diff) < this.config.stopThreshold) {
      this.currentAngle = this.targetAngle;
      this.stopAnimation();
    }

    // Call render callback
    if (this.renderCallback) {
      this.renderCallback(this.currentAngle);
    }

    // Continue animation if needed
    if (Math.abs(diff) > this.config.stopThreshold) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  private stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public destroy(): void {
    this.stopAnimation();
    this.renderCallback = null;
  }

  public isAnimating(): boolean {
    return this.animationId !== null;
  }

  public jumpToTarget(): void {
    this.currentAngle = this.targetAngle;
    this.stopAnimation();

    if (this.renderCallback) {
      this.renderCallback(this.currentAngle);
    }
  }

  public reset(): void {
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.stopAnimation();

    if (this.renderCallback) {
      this.renderCallback(this.currentAngle);
    }
  }
}
