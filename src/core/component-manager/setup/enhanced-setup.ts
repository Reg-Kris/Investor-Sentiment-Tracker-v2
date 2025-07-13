import { EnhancedHero } from '../../../components/enhanced-hero';
import { EnhancedCard, CardData } from '../../../components/enhanced-card';
import { EnhancedFooter } from '../../../components/enhanced-footer';
import { DataService } from '../../../services/data-service';
import { MessageGenerators } from '../utils';
import type { SentimentData, TimeFrame } from '../../../types/sentiment';

export class EnhancedSetup {
  static setupEnhancedComponents(data: SentimentData, timeframe: TimeFrame) {
    const components = {
      enhancedHero: undefined as EnhancedHero | undefined,
      enhancedFooter: undefined as EnhancedFooter | undefined,
      enhancedCards: {} as { [key: string]: EnhancedCard },
    };

    try {
      // Initialize Enhanced Hero
      components.enhancedHero = new EnhancedHero('sentiment-cluster-container');

      // Initialize Enhanced Footer
      components.enhancedFooter = new EnhancedFooter();

      // Initialize Enhanced Cards
      components.enhancedCards = this.setupEnhancedCards(data, timeframe);

      console.log('✨ Enhanced components initialized');
    } catch (error) {
      console.warn('⚠️ Enhanced components failed to initialize:', error);
    }

    return components;
  }

  private static setupEnhancedCards(
    data: SentimentData,
    timeframe: TimeFrame,
  ): { [key: string]: EnhancedCard } {
    const indicators = data.indicators;
    const timeframeData = data.timeframes[timeframe];
    const enhancedCards: { [key: string]: EnhancedCard } = {};

    // Enhanced Fear & Greed Card
    try {
      enhancedCards.fearGreed = this.setupEnhancedCard('fearGreed', {
        title: 'Fear & Greed Index',
        value: timeframeData.score,
        message: MessageGenerators.getFearGreedMessage(
          timeframeData.score,
          timeframe,
        ),
        trend: timeframeData.score > 50 ? 'up' : 'down',
        color: MessageGenerators.getSentimentColor(timeframeData.score),
        timeframe,
      });
    } catch (error) {
      console.warn('Failed to setup enhanced Fear & Greed card:', error);
    }

    // Enhanced Market Cards
    try {
      enhancedCards.spy = this.setupEnhancedMarketCard(
        'spy',
        'S&P 500 (SPY)',
        indicators.spy,
        data,
        timeframe,
      );
    } catch (error) {
      console.warn('Failed to setup enhanced SPY card:', error);
    }

    try {
      enhancedCards.qqq = this.setupEnhancedMarketCard(
        'qqq',
        'Nasdaq 100 (QQQ)',
        indicators.qqq,
        data,
        timeframe,
      );
    } catch (error) {
      console.warn('Failed to setup enhanced QQQ card:', error);
    }

    try {
      enhancedCards.iwm = this.setupEnhancedMarketCard(
        'iwm',
        'Russell 2000 (IWM)',
        indicators.iwm,
        data,
        timeframe,
      );
    } catch (error) {
      console.warn('Failed to setup enhanced IWM card:', error);
    }

    // Enhanced VIX Card
    try {
      enhancedCards.vix = this.setupEnhancedCard('vix', {
        title: 'Volatility Index (VIX)',
        value: indicators.vix.value.toFixed(1),
        message: MessageGenerators.getVixMessage(
          indicators.vix.value,
          timeframe,
        ),
        trend: indicators.vix.value > 20 ? 'up' : 'down',
        color: indicators.vix.value > 20 ? '#ef4444' : '#10b981',
        timeframe,
      });
    } catch (error) {
      console.warn('Failed to setup enhanced VIX card:', error);
    }

    return enhancedCards;
  }

  private static setupEnhancedCard(key: string, data: CardData): EnhancedCard {
    const containerId =
      key === 'fearGreed'
        ? 'fear-greed-card-container'
        : `${key}-card-container`;
    return new EnhancedCard(containerId, data);
  }

  private static setupEnhancedMarketCard(
    key: string,
    title: string,
    indicator: any,
    data: SentimentData,
    timeframe: TimeFrame,
  ): EnhancedCard {
    const timeframeIndicator = DataService.getIndicatorForTimeframe(
      data,
      timeframe,
      key,
    );

    return this.setupEnhancedCard(key, {
      title,
      value: `$${indicator.price.toFixed(2)}`,
      change: `${timeframeIndicator.change >= 0 ? '+' : ''}${timeframeIndicator.change.toFixed(2)}%`,
      message: indicator.message,
      trend: timeframeIndicator.change >= 0 ? 'up' : 'down',
      color: timeframeIndicator.change >= 0 ? '#10b981' : '#ef4444',
      timeframe,
    });
  }
}
