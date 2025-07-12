import { SentimentCluster } from '../components/sentiment-cluster';
import { EnhancedHero } from '../components/enhanced-hero';
import { EnhancedCard } from '../components/enhanced-card';
import { EnhancedFooter } from '../components/enhanced-footer';
import { IndicatorSetup, EnhancedSetup } from './component-manager/setup';
import { ComponentUpdater } from './component-manager/update';
import type { SentimentData, TimeFrame } from '../types/sentiment';

export class ComponentManager {
  private components: {
    cluster?: SentimentCluster;
    enhancedHero?: EnhancedHero;
    enhancedFooter?: EnhancedFooter;
    cards: { [key: string]: any };
    enhancedCards: { [key: string]: EnhancedCard };
  } = { cards: {}, enhancedCards: {} };

  private currentTimeframe: TimeFrame = '1d';

  initialize(data: SentimentData): void {
    this.components.cluster = IndicatorSetup.setupSentimentCluster(data, this.currentTimeframe);
    this.components.cards = IndicatorSetup.setupIndicatorCards(data, this.currentTimeframe);
    
    const enhancedComponents = EnhancedSetup.setupEnhancedComponents(data, this.currentTimeframe);
    this.components.enhancedHero = enhancedComponents.enhancedHero;
    this.components.enhancedFooter = enhancedComponents.enhancedFooter;
    this.components.enhancedCards = enhancedComponents.enhancedCards;
  }

  updateAll(data: SentimentData): void {
    ComponentUpdater.updateComponents(
      { cluster: this.components.cluster, cards: this.components.cards },
      data,
      this.currentTimeframe
    );
    
    ComponentUpdater.updateEnhancedComponents(
      { enhancedHero: this.components.enhancedHero, enhancedCards: this.components.enhancedCards },
      data,
      this.currentTimeframe
    );
  }

  setTimeframe(timeframe: TimeFrame): void {
    this.currentTimeframe = timeframe;
  }

  getComponents() {
    return this.components;
  }

}