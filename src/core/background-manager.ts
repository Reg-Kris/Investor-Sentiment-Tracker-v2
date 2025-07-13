import type { SentimentData, TimeFrame } from '../types/sentiment';

export class BackgroundManager {
  private currentTimeframe: TimeFrame = '1d';

  initialize(data: SentimentData): void {
    const score = data.timeframes[this.currentTimeframe].score;
    this.updateBackgroundGradient(score);
  }

  updateForTimeframe(data: SentimentData, timeframe: TimeFrame): void {
    this.currentTimeframe = timeframe;
    const score = data.timeframes[timeframe].score;
    this.updateBackgroundGradient(score);
  }

  updateWithScore(score: number): void {
    this.updateBackgroundGradient(score);
  }

  private updateBackgroundGradient(score: number): void {
    const backgroundElement = document.querySelector('.background-gradient');
    if (!backgroundElement) return;

    // Remove existing sentiment classes
    backgroundElement.className = 'background-gradient';

    // Add new sentiment class based on score
    if (score >= 80) {
      backgroundElement.classList.add('extreme-greed');
    } else if (score >= 65) {
      backgroundElement.classList.add('greed');
    } else if (score <= 20) {
      backgroundElement.classList.add('extreme-fear');
    } else if (score <= 35) {
      backgroundElement.classList.add('fear');
    }
  }
}
