// Core exports
export { SentimentCluster } from './sentiment-cluster';

// Module exports
export { CanvasRenderer } from './rendering/canvas-renderer';
export { AnimationController } from './animation/animation-controller';
export { UIComponents } from './ui/ui-components';
export { SentimentUtils } from './core/utils';

// Type exports
export type {
  GaugeSegment,
  CanvasRendererConfig,
} from './rendering/canvas-renderer';
export type {
  AnimationConfig,
  AnimationCallback,
} from './animation/animation-controller';
export type { CanvasConfig, TimeframeSwitcherConfig } from './ui/ui-components';
