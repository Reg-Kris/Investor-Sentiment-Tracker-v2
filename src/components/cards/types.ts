export interface CardData {
  title: string;
  value: string | number;
  change?: string | number;
  message: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  timeframe?: string;
}

export interface CardElements {
  container: HTMLElement;
  card: HTMLElement;
  value: HTMLElement;
  message: HTMLElement;
  gauge: HTMLElement;
  trendLine: HTMLElement;
  background: HTMLElement;
}

export interface AnimationConfig {
  duration: number;
  ease: string;
  delay?: number;
}

export interface MorphingShape extends HTMLElement {
  index: number;
}
