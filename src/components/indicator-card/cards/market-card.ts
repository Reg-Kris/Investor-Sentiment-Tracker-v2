import type { TimeFrame } from '../../../types/sentiment';
import { BaseIndicatorCard } from '../core';

export class MarketCard extends BaseIndicatorCard {
  constructor(
    container: HTMLElement,
    title: string,
    price: number,
    change: number,
    message: string,
    color: string,
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void,
  ) {
    const changePrefix = change >= 0 ? '+' : '';
    // Convert percentage change to a 0-100 score for gauge visualization
    // Assume -10% to +10% is our typical range, normalize to 0-100
    const normalizedScore = Math.min(
      Math.max(((change + 10) / 20) * 100, 0),
      100,
    );

    super(container, {
      title,
      value: `$${price.toFixed(2)}`,
      change: `${changePrefix}${change.toFixed(2)}%`,
      message,
      color,
      timeframe,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      score: normalizedScore,
      onTimeframeChange,
    });
  }
}
