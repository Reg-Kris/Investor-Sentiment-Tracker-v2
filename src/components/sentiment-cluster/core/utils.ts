import type { TimeFrame } from '../../../types/sentiment';

export class SentimentUtils {
  /**
   * Convert sentiment score (0-100) to gauge angle (-90 to +90 degrees)
   * @param score Score from 0 (extreme fear) to 100 (extreme greed)
   * @returns Angle in degrees from -90 to +90
   */
  static scoreToAngle(score: number): number {
    // Clamp score to valid range
    const clampedScore = Math.max(0, Math.min(100, score));
    
    // Convert: 0 = -90°, 50 = 0°, 100 = +90°
    return ((clampedScore - 50) / 50) * 90;
  }

  /**
   * Convert gauge angle to sentiment score
   * @param angle Angle in degrees from -90 to +90
   * @returns Score from 0 to 100
   */
  static angleToScore(angle: number): number {
    // Clamp angle to valid range
    const clampedAngle = Math.max(-90, Math.min(90, angle));
    
    // Convert: -90° = 0, 0° = 50, +90° = 100
    return ((clampedAngle / 90) * 50) + 50;
  }

  /**
   * Get sentiment category based on score
   * @param score Sentiment score from 0-100
   * @returns Sentiment category string
   */
  static getSentimentCategory(score: number): string {
    if (score >= 80) return 'extreme-greed';
    if (score >= 65) return 'greed';
    if (score >= 55) return 'mild-greed';
    if (score >= 45) return 'neutral';
    if (score >= 35) return 'mild-fear';
    if (score >= 20) return 'fear';
    return 'extreme-fear';
  }

  /**
   * Get human-readable sentiment label
   * @param score Sentiment score from 0-100
   * @returns Human-readable sentiment label
   */
  static getSentimentLabel(score: number): string {
    if (score >= 80) return 'Extreme Greed';
    if (score >= 65) return 'Greed';
    if (score >= 55) return 'Mild Greed';
    if (score >= 45) return 'Neutral';
    if (score >= 35) return 'Mild Fear';
    if (score >= 20) return 'Fear';
    return 'Extreme Fear';
  }

  /**
   * Get color for sentiment score
   * @param score Sentiment score from 0-100
   * @returns Hex color string
   */
  static getSentimentColor(score: number): string {
    if (score >= 80) return '#047857'; // Extreme Greed
    if (score >= 65) return '#059669'; // Greed
    if (score >= 55) return '#16a34a'; // Mild Greed
    if (score >= 45) return '#65a30d'; // Neutral
    if (score >= 35) return '#d97706'; // Mild Fear
    if (score >= 20) return '#ea580c'; // Fear
    return '#dc2626'; // Extreme Fear
  }

  /**
   * Validate timeframe value
   * @param timeframe Timeframe to validate
   * @returns True if valid timeframe
   */
  static isValidTimeframe(timeframe: string): timeframe is TimeFrame {
    const validTimeframes: string[] = ['1d', '5d', '1m'];
    return validTimeframes.indexOf(timeframe) !== -1;
  }

  /**
   * Get default timeframe if invalid provided
   * @param timeframe Timeframe to check
   * @returns Valid timeframe
   */
  static getValidTimeframe(timeframe: string): TimeFrame {
    return this.isValidTimeframe(timeframe) ? timeframe : '1d';
  }

  /**
   * Clamp value between min and max
   * @param value Value to clamp
   * @param min Minimum value
   * @param max Maximum value
   * @returns Clamped value
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation between two values
   * @param start Start value
   * @param end End value
   * @param progress Progress from 0 to 1
   * @returns Interpolated value
   */
  static lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * Check if two values are approximately equal within tolerance
   * @param a First value
   * @param b Second value
   * @param tolerance Tolerance for comparison (default: 0.001)
   * @returns True if values are approximately equal
   */
  static approximately(a: number, b: number, tolerance: number = 0.001): boolean {
    return Math.abs(a - b) < tolerance;
  }
}