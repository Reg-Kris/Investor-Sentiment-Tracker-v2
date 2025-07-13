import { MessageGenerator } from '../generators/message-generator.js';
import { ColorGenerator } from '../generators/color-generator.js';

/**
 * Generate indicator data for display
 */
export class IndicatorGenerator {
  constructor() {
    this.messageGenerator = new MessageGenerator();
    this.colorGenerator = new ColorGenerator();
  }

  /**
   * Generate comprehensive indicator data
   */
  generateIndicatorData(data) {
    return {
      fearGreed: this.generateFearGreedIndicator(data.fearGreed),
      spy: this.generateMarketIndicator('S&P 500', data.spy),
      qqq: this.generateMarketIndicator('Nasdaq 100', data.qqq),
      iwm: this.generateMarketIndicator('Russell 2000', data.iwm),
      vix: this.generateVixIndicator(data.vix),
      options: this.generateOptionsIndicators(data.options),
    };
  }

  /**
   * Generate Fear & Greed indicator
   */
  generateFearGreedIndicator(fearGreedData) {
    const value = Math.round(fearGreedData.current.value);
    return {
      value,
      label: fearGreedData.current.rating,
      message: this.messageGenerator.getFearGreedMessage(value),
      color: this.colorGenerator.getFearGreedColor(value),
    };
  }

  /**
   * Generate market indicator
   */
  generateMarketIndicator(indexName, marketData) {
    const changePercent = marketData.current.changePercent;
    return {
      price: marketData.current.price,
      change: changePercent,
      message: this.messageGenerator.getMarketMessage(indexName, changePercent),
      color: this.colorGenerator.getChangeColor(changePercent),
    };
  }

  /**
   * Generate VIX indicator
   */
  generateVixIndicator(vixData) {
    const value = Math.round(vixData.current.value * 10) / 10;
    return {
      value,
      message: this.messageGenerator.getVixMessage(value),
      color: this.colorGenerator.getVixColor(value),
    };
  }

  /**
   * Generate options indicators
   */
  generateOptionsIndicators(optionsData) {
    if (!optionsData) {
      return {
        spy: this.messageGenerator.getOptionsMessage('SPY', null),
        qqq: this.messageGenerator.getOptionsMessage('QQQ', null),
        iwm: this.messageGenerator.getOptionsMessage('IWM', null),
      };
    }

    return {
      spy: this.messageGenerator.getOptionsMessage(
        'SPY',
        optionsData.spy?.putCallRatio,
      ),
      qqq: this.messageGenerator.getOptionsMessage(
        'QQQ',
        optionsData.qqq?.putCallRatio,
      ),
      iwm: this.messageGenerator.getOptionsMessage(
        'IWM',
        optionsData.iwm?.putCallRatio,
      ),
    };
  }
}
