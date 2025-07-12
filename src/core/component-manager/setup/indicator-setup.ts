import { SentimentCluster } from '../../../components/sentiment-cluster';
import { MarketCard, VixCard, OptionsCard, FearGreedCard } from '../../../components/indicator-card';
import type { SentimentData, TimeFrame } from '../../../types/sentiment';

export class IndicatorSetup {
  static setupSentimentCluster(data: SentimentData, timeframe: TimeFrame): SentimentCluster | undefined {
    const container = document.getElementById('sentiment-cluster-container');
    if (!container) return undefined;

    const timeframeData = data.timeframes[timeframe];
    return new SentimentCluster(container, {
      score: timeframeData.score,
      sentiment: timeframeData.sentiment,
      message: timeframeData.message,
      timeframe,
    });
  }

  static setupIndicatorCards(data: SentimentData, timeframe: TimeFrame) {
    const indicators = data.indicators;
    const cards: { [key: string]: any } = {};

    // Fear & Greed Index Card
    const fearGreedContainer = document.getElementById('fear-greed-card-container');
    if (fearGreedContainer) {
      cards.fearGreed = new FearGreedCard(
        fearGreedContainer,
        indicators.fearGreed.value,
        indicators.fearGreed.message,
        indicators.fearGreed.color,
        timeframe
      );
    }

    // Market Cards
    cards.spy = this.setupMarketCard('spy', 'S&P 500 (SPY)', indicators.spy, timeframe);
    cards.qqq = this.setupMarketCard('qqq', 'Nasdaq 100 (QQQ)', indicators.qqq, timeframe);
    cards.iwm = this.setupMarketCard('iwm', 'Russell 2000 (IWM)', indicators.iwm, timeframe);

    // VIX Card
    const vixContainer = document.getElementById('vix-card-container');
    if (vixContainer) {
      cards.vix = new VixCard(
        vixContainer,
        indicators.vix.value,
        indicators.vix.message,
        indicators.vix.color,
        timeframe
      );
    }

    // Market Options Sentiment Card
    const marketOptionsContainer = document.getElementById('market-options-card-container');
    if (marketOptionsContainer) {
      cards.marketOptions = new OptionsCard(
        marketOptionsContainer,
        'Market',
        indicators.options.market || 'Market options sentiment is neutral',
        timeframe
      );
    }

    return cards;
  }

  private static setupMarketCard(key: string, title: string, indicator: any, timeframe: TimeFrame) {
    const container = document.getElementById(`${key}-card-container`);
    if (!container) return undefined;

    return new MarketCard(
      container,
      title,
      indicator.price,
      indicator.change,
      indicator.message,
      indicator.color,
      timeframe
    );
  }
}