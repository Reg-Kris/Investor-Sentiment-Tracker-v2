import type { TimeFrame } from '../../../types/sentiment';
import { BaseIndicatorCard } from '../core';

export class VixCard extends BaseIndicatorCard {
  constructor(
    container: HTMLElement,
    value: number,
    message: string,
    color: string,
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void,
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
      onTimeframeChange,
    });
  }
}
