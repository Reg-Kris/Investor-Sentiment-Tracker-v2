import { SentimentCluster } from '../../../components/sentiment-cluster';
import { EnhancedHero } from '../../../components/enhanced-hero';
import { EnhancedCard, CardData } from '../../../components/enhanced-card';
import { DataService } from '../../../services/data-service';
import { MessageGenerators } from '../utils';
import type { SentimentData, TimeFrame } from '../../../types/sentiment';

export class ComponentUpdater {
  static updateComponents(
    components: { cluster?: SentimentCluster; cards: { [key: string]: any } },
    data: SentimentData,
    timeframe: TimeFrame,
  ): void {
    const timeframeData = data.timeframes[timeframe];

    // Update sentiment cluster
    if (components.cluster) {
      components.cluster.updateProps({
        score: timeframeData.score,
        sentiment: timeframeData.sentiment,
        message: timeframeData.message,
        timeframe,
      });
    }

    // Update all cards
    Object.entries(components.cards).forEach(([key, card]) => {
      if (card && typeof card.updateProps === 'function') {
        const updateData = this.getCardUpdateData(key, data, timeframe);
        card.updateProps(updateData);
      }
    });
  }

  static updateEnhancedComponents(
    components: {
      enhancedHero?: EnhancedHero;
      enhancedCards: { [key: string]: EnhancedCard };
    },
    data: SentimentData,
    timeframe: TimeFrame,
  ): void {
    const timeframeData = data.timeframes[timeframe];

    // Update enhanced hero
    if (components.enhancedHero) {
      components.enhancedHero.updateSentiment(timeframeData.score);
    }

    // Update enhanced cards
    Object.entries(components.enhancedCards).forEach(([key, card]) => {
      if (!card) return;

      try {
        const updateData = this.getEnhancedCardUpdateData(key, data, timeframe);
        card.updateData(updateData);
      } catch (error) {
        console.warn(`Failed to update enhanced ${key} card:`, error);
      }
    });
  }

  private static getCardUpdateData(
    key: string,
    data: SentimentData,
    timeframe: TimeFrame,
  ): any {
    const updateData: any = { timeframe };
    const indicators = data.indicators;
    const timeframeData = data.timeframes[timeframe];

    if (key === 'spy' || key === 'qqq' || key === 'iwm') {
      const baseIndicator = indicators[key as keyof typeof indicators] as any;
      const timeframeIndicator = DataService.getIndicatorForTimeframe(
        data,
        timeframe,
        key,
      );

      if (baseIndicator && timeframeIndicator) {
        updateData.value = `$${baseIndicator.price.toFixed(2)}`;
        updateData.change = `${timeframeIndicator.change >= 0 ? '+' : ''}${timeframeIndicator.change.toFixed(2)}%`;
        updateData.message = MessageGenerators.getMarketMessage(
          key,
          timeframeIndicator.change,
          timeframe,
        );
        updateData.color =
          timeframeIndicator.change >= 0 ? '#10b981' : '#ef4444';
        updateData.score = Math.min(
          Math.max(((timeframeIndicator.change + 10) / 20) * 100, 0),
          100,
        );
      }
    } else if (key === 'vix') {
      const timeframeVix = DataService.getIndicatorForTimeframe(
        data,
        timeframe,
        'vix',
      );
      updateData.value = timeframeVix.value.toFixed(1);
      updateData.color = timeframeVix.value > 20 ? '#ef4444' : '#10b981';
      updateData.message = MessageGenerators.getVixMessage(
        timeframeVix.value,
        timeframe,
      );
      updateData.score = Math.min(
        Math.max((timeframeVix.value / 40) * 100, 0),
        100,
      );
    } else if (key === 'fearGreed') {
      updateData.score = timeframeData.score;
      updateData.value = timeframeData.score.toString();
      updateData.message = MessageGenerators.getFearGreedMessage(
        timeframeData.score,
        timeframe,
      );
      updateData.color = MessageGenerators.getSentimentColor(
        timeframeData.score,
      );
    }

    return updateData;
  }

  private static getEnhancedCardUpdateData(
    key: string,
    data: SentimentData,
    timeframe: TimeFrame,
  ): Partial<CardData> {
    const timeframeData = data.timeframes[timeframe];
    const indicators = data.indicators;
    let updateData: Partial<CardData> = { timeframe };

    if (key === 'fearGreed') {
      updateData = {
        value: timeframeData.score,
        message: MessageGenerators.getFearGreedMessage(
          timeframeData.score,
          timeframe,
        ),
        trend: timeframeData.score > 50 ? 'up' : 'down',
        color: MessageGenerators.getSentimentColor(timeframeData.score),
        timeframe,
      };
    } else if (key === 'spy' || key === 'qqq' || key === 'iwm') {
      const baseIndicator = indicators[key as keyof typeof indicators] as any;
      const timeframeIndicator = DataService.getIndicatorForTimeframe(
        data,
        timeframe,
        key,
      );

      if (baseIndicator && timeframeIndicator) {
        updateData = {
          value: `$${baseIndicator.price.toFixed(2)}`,
          change: `${timeframeIndicator.change >= 0 ? '+' : ''}${timeframeIndicator.change.toFixed(2)}%`,
          message: MessageGenerators.getMarketMessage(
            key,
            timeframeIndicator.change,
            timeframe,
          ),
          trend: timeframeIndicator.change >= 0 ? 'up' : 'down',
          color: timeframeIndicator.change >= 0 ? '#10b981' : '#ef4444',
          timeframe,
        };
      }
    } else if (key === 'vix') {
      const timeframeVix = DataService.getIndicatorForTimeframe(
        data,
        timeframe,
        'vix',
      );

      updateData = {
        value: timeframeVix.value.toFixed(1),
        message: MessageGenerators.getVixMessage(timeframeVix.value, timeframe),
        trend: timeframeVix.value > 20 ? 'up' : 'down',
        color: timeframeVix.value > 20 ? '#ef4444' : '#10b981',
        timeframe,
      };
    }

    return updateData;
  }
}
