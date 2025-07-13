import type { TimeFrame } from '../../../types/sentiment';

export class MessageGenerators {
  static getSentimentColor(score: number): string {
    if (score >= 80) return '#047857';
    if (score >= 65) return '#059669';
    if (score >= 55) return '#16a34a';
    if (score >= 45) return '#65a30d';
    if (score >= 35) return '#d97706';
    if (score >= 20) return '#ea580c';
    return '#dc2626';
  }

  static getMarketMessage(
    symbol: string,
    change: number,
    timeframe: TimeFrame,
  ): string {
    const symbolName =
      {
        spy: 'S&P 500',
        qqq: 'Nasdaq 100',
        iwm: 'Russell 2000',
      }[symbol] || symbol.toUpperCase();

    const timeframeName = {
      '1d': 'today',
      '5d': 'this week',
      '1m': 'this month',
    }[timeframe];

    if (change > 2) {
      return `${symbolName} is up strongly ${timeframeName} (+${change.toFixed(1)}%) - bullish momentum`;
    } else if (change > 0.5) {
      return `${symbolName} is gaining ${timeframeName} (+${change.toFixed(1)}%) - positive trend`;
    } else if (change > -0.5) {
      return `${symbolName} is trading sideways ${timeframeName} (${change.toFixed(1)}%) - neutral`;
    } else if (change > -2) {
      return `${symbolName} is declining ${timeframeName} (${change.toFixed(1)}%) - bearish pressure`;
    } else {
      return `${symbolName} is down significantly ${timeframeName} (${change.toFixed(1)}%) - strong selling`;
    }
  }

  static getVixMessage(value: number, timeframe: TimeFrame): string {
    const timeframeName = {
      '1d': 'today',
      '5d': 'this week',
      '1m': 'this month',
    }[timeframe];

    if (value > 30) {
      return `High fear ${timeframeName} (${value.toFixed(1)}) - investors are very nervous`;
    } else if (value > 20) {
      return `Elevated concern ${timeframeName} (${value.toFixed(1)}) - some market anxiety`;
    } else if (value > 15) {
      return `Normal levels ${timeframeName} (${value.toFixed(1)}) - markets are comfortable`;
    } else {
      return `Very calm ${timeframeName} (${value.toFixed(1)}) - investors feel confident`;
    }
  }

  static getFearGreedMessage(score: number, timeframe: TimeFrame): string {
    const timeframeName = {
      '1d': 'Today',
      '5d': 'This week',
      '1m': 'This month',
    }[timeframe];

    if (score >= 80) {
      return `${timeframeName} investors are extremely greedy - high risk of market top`;
    } else if (score >= 65) {
      return `${timeframeName} shows greed - markets may be getting overheated`;
    } else if (score >= 55) {
      return `${timeframeName} sentiment is mildly greedy - cautiously optimistic`;
    } else if (score >= 45) {
      return `${timeframeName} markets are neutral - balanced investor sentiment`;
    } else if (score >= 35) {
      return `${timeframeName} shows mild fear - some investor concern`;
    } else if (score >= 20) {
      return `${timeframeName} investors are fearful - good buying opportunities may emerge`;
    } else {
      return `${timeframeName} shows extreme fear - potentially great buying opportunity`;
    }
  }
}
