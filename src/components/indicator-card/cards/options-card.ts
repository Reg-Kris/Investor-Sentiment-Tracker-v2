import type { TimeFrame } from '../../../types/sentiment';
import { BaseIndicatorCard } from '../core';

export class OptionsCard extends BaseIndicatorCard {
  constructor(
    container: HTMLElement,
    symbol: string,
    message: string,
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void,
  ) {
    const sentiment = message.toLowerCase();
    let color = '#6b7280';
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let score = 50; // Default neutral score

    if (sentiment.includes('very bullish')) {
      color = '#10b981';
      trend = 'up';
      score = 80;
    } else if (sentiment.includes('bullish')) {
      color = '#16a34a';
      trend = 'up';
      score = 70;
    } else if (sentiment.includes('very bearish')) {
      color = '#ef4444';
      trend = 'down';
      score = 20;
    } else if (sentiment.includes('bearish')) {
      color = '#ea580c';
      trend = 'down';
      score = 30;
    }

    super(container, {
      title: `${symbol} Options`,
      value: sentiment.includes('very') ? 'Strong' : 'Moderate',
      message,
      color,
      timeframe,
      trend,
      score,
      onTimeframeChange,
    });
  }
}
