import type { SentimentClusterProps, TimeFrame } from '../../types/sentiment';
import { CanvasRenderer } from './rendering/canvas-renderer';
import { AnimationController } from './animation/animation-controller';
import { UIComponents } from './ui/ui-components';

export class SentimentCluster {
  private props: SentimentClusterProps;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Module instances
  private renderer: CanvasRenderer;
  private animator: AnimationController;
  private ui: UIComponents;

  constructor(container: HTMLElement, props: SentimentClusterProps) {
    this.props = props;
    
    // Initialize UI components
    this.ui = new UIComponents(container);
    
    // Create and setup canvas
    this.canvas = this.ui.createCanvas();
    this.ctx = this.canvas.getContext('2d')!;
    
    // Initialize renderer and animator
    this.renderer = new CanvasRenderer(this.ctx);
    this.animator = new AnimationController();
    
    // Setup animation callback
    this.animator.setRenderCallback((angle: number) => {
      this.renderer.renderComplete(angle);
    });
    
    this.initialize();
  }

  private initialize(): void {
    this.render();
    this.updateFromProps();
    this.startAnimation();
  }

  private setupTimeframeSwitcher(): void {
    const config = this.ui.getDefaultTimeframeSwitcherConfig(this.props.timeframe);
    const switcher = this.ui.createTimeframeSwitcher(config, (timeframe) => {
      this.updateTimeframe(timeframe);
    });
    
    this.ui.appendElement(switcher);
  }

  private updateTimeframe(timeframe: TimeFrame): void {
    this.props.timeframe = timeframe;
    
    if (this.props.onTimeframeChange) {
      this.props.onTimeframeChange(timeframe);
    }
  }

  private updateFromProps(): void {
    // Update animator with new score
    this.animator.updateFromScore(this.props.score);
    
    // Update UI labels and styling
    this.ui.updateLabels(this.props.score, this.props.message);
  }

  private startAnimation(): void {
    this.animator.updateFromScore(this.props.score);
  }

  private render(): void {
    this.ui.clearContainer();
    this.ui.appendElement(this.canvas);
    this.setupTimeframeSwitcher();
    this.ui.updateLabels(this.props.score, this.props.message);
  }

  public updateProps(newProps: Partial<SentimentClusterProps>): void {
    const oldTimeframe = this.props.timeframe;
    this.props = { ...this.props, ...newProps };
    
    // Update timeframe button if changed
    if (oldTimeframe !== this.props.timeframe) {
      this.ui.updateActiveTimeframeButton(this.props.timeframe);
    }
    
    this.updateFromProps();
  }

  public getScore(): number {
    return this.props.score;
  }

  public getSentiment(): string {
    return this.props.sentiment;
  }

  public getMessage(): string {
    return this.props.message;
  }

  public getTimeframe(): TimeFrame {
    return this.props.timeframe;
  }

  public getCurrentAngle(): number {
    return this.animator.getCurrentAngle();
  }

  public isAnimating(): boolean {
    return this.animator.isAnimating();
  }

  public jumpToTarget(): void {
    this.animator.jumpToTarget();
  }

  public reset(): void {
    this.animator.reset();
    this.ui.updateLabels(0, 'Neutral');
  }

  public destroy(): void {
    this.animator.destroy();
  }
}