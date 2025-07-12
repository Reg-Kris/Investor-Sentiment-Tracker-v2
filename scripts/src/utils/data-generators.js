import { subDays, format } from 'date-fns';

export class DataGenerators {
  static generateHistoricalFromCurrent(currentValue, type) {
    return Array.from({ length: 30 }, (_, i) => {
      const variance = type === 'fear-greed' ? 15 : 5;
      const value = currentValue + (Math.random() - 0.5) * variance;
      return {
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        value: Math.round(Math.max(0, Math.min(100, value)) * 100) / 100,
        rating: type === 'fear-greed' ? this.getValueText(value) : undefined
      };
    });
  }

  static interpolateHistoricalData(timePoints, totalDays) {
    const historical = [];
    timePoints.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (let i = 0; i < totalDays; i++) {
      const targetDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      
      let value = timePoints[0].value;
      let rating = timePoints[0].rating;
      
      const exactMatch = timePoints.find(tp => tp.date === targetDate);
      if (exactMatch) {
        value = exactMatch.value;
        rating = exactMatch.rating;
      } else {
        const baseValue = timePoints[0].value;
        const variance = Math.random() * 10 - 5;
        value = Math.max(0, Math.min(100, baseValue + variance));
        rating = this.getValueText(value);
      }
      
      historical.push({
        date: targetDate,
        value: Math.round(value * 100) / 100,
        rating
      });
    }
    
    return historical;
  }

  static getValueText(value) {
    if (value >= 75) return 'Extreme Greed';
    if (value >= 55) return 'Greed';
    if (value >= 45) return 'Neutral';
    if (value >= 25) return 'Fear';
    return 'Extreme Fear';
  }
}