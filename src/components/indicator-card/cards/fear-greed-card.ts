import type { TimeFrame } from '../../../types/sentiment';
import { BaseIndicatorCard } from '../core';

export class FearGreedCard extends BaseIndicatorCard {
  constructor(
    container: HTMLElement,
    score: number,
    message: string,
    color: string,
    timeframe: TimeFrame,
    onTimeframeChange?: (timeframe: TimeFrame) => void
  ) {
    let sentiment = 'Neutral';
    if (score >= 80) sentiment = 'Extreme Greed';
    else if (score >= 65) sentiment = 'Greed';
    else if (score >= 55) sentiment = 'Mild Greed';
    else if (score >= 45) sentiment = 'Neutral';
    else if (score >= 35) sentiment = 'Mild Fear';
    else if (score >= 20) sentiment = 'Fear';
    else sentiment = 'Extreme Fear';

    super(container, {
      title: 'Fear & Greed Index',
      value: score.toString(),
      message: `${sentiment} - ${message}`,
      color,
      timeframe,
      trend: score > 50 ? 'up' : score < 50 ? 'down' : 'neutral',
      score,
      onTimeframeChange
    });
  }
}