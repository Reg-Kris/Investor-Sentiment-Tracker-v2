#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import vader from 'vader-sentiment';
import axios from 'axios';
import cheerio from 'cheerio';
import Parser from 'rss-parser';
import NodeCache from 'node-cache';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize cache for RSS feeds and scraped content
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 300 }); // 30 minutes cache

// RSS and News Sources Configuration
const NEWS_SOURCES = {
  general: [
    { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
    { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664' },
    { name: 'MarketWatch', url: 'http://feeds.marketwatch.com/marketwatch/topstories/' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/' }
  ],
  crypto: [
    { name: 'CoinDesk', url: 'https://feeds.feedburner.com/CoinDesk' },
    { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' }
  ],
  economic: [
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
    { name: 'BLS Economic News', url: 'https://www.bls.gov/feed/news_release/rss.xml' }
  ]
};

// Keywords for categorizing news
const KEYWORDS = {
  bullish: [
    'growth', 'gains', 'surge', 'rally', 'optimistic', 'positive', 'bullish', 'upward',
    'increase', 'rise', 'boom', 'strong', 'robust', 'recovery', 'expansion', 'momentum',
    'breakthrough', 'profit', 'success', 'advancement', 'improvement', 'upgrade'
  ],
  bearish: [
    'decline', 'fall', 'crash', 'bearish', 'negative', 'pessimistic', 'downward', 'drop',
    'recession', 'crisis', 'concern', 'worry', 'risk', 'threat', 'weakness', 'slowdown',
    'contraction', 'loss', 'failure', 'downgrade', 'uncertainty', 'volatility', 'correction'
  ],
  neutral: [
    'stable', 'unchanged', 'steady', 'neutral', 'flat', 'sideways', 'consolidation',
    'balanced', 'mixed', 'moderate', 'cautious', 'wait', 'observe', 'analysis'
  ]
};

class SentimentAnalyzer {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        item: ['description', 'content', 'summary']
      }
    });
  }

  // Utility function to clean text for sentiment analysis
  cleanText(text) {
    if (!text) return '';
    
    // Remove HTML tags
    const cleanHtml = text.replace(/<[^>]*>/g, ' ');
    
    // Remove extra whitespace
    const cleanWhitespace = cleanHtml.replace(/\s+/g, ' ').trim();
    
    // Remove special characters except punctuation
    const cleanSpecial = cleanWhitespace.replace(/[^\w\s.,!?;:()-]/g, ' ');
    
    return cleanSpecial;
  }

  // Analyze sentiment using VADER
  analyzeSentiment(text) {
    const cleanedText = this.cleanText(text);
    if (!cleanedText) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        compound: 0
      };
    }

    const analysis = vader.SentimentIntensityAnalyzer.polarity_scores(cleanedText);
    
    // Determine sentiment based on compound score
    let sentiment = 'neutral';
    if (analysis.compound >= 0.05) {
      sentiment = 'positive';
    } else if (analysis.compound <= -0.05) {
      sentiment = 'negative';
    }

    return {
      sentiment: sentiment,
      score: analysis.compound,
      confidence: Math.abs(analysis.compound),
      compound: analysis.compound,
      positive: analysis.pos,
      negative: analysis.neg,
      neutral: analysis.neu
    };
  }

  // Categorize news based on keywords
  categorizeNews(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    // Count keyword matches
    KEYWORDS.bullish.forEach(keyword => {
      if (text.includes(keyword)) bullishCount++;
    });

    KEYWORDS.bearish.forEach(keyword => {
      if (text.includes(keyword)) bearishCount++;
    });

    KEYWORDS.neutral.forEach(keyword => {
      if (text.includes(keyword)) neutralCount++;
    });

    // Determine category based on highest count
    if (bullishCount > bearishCount && bullishCount > neutralCount) {
      return 'bullish';
    } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
      return 'bearish';
    } else {
      return 'neutral';
    }
  }

  // Fetch and parse RSS feed
  async fetchRSSFeed(source) {
    const cacheKey = `rss_${source.name}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching RSS feed: ${source.name}`);
      const feed = await this.parser.parseURL(source.url);
      
      const articles = feed.items.slice(0, 20).map(item => ({
        title: item.title || '',
        description: item.description || item.content || item.summary || '',
        link: item.link || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        source: source.name,
        category: 'general'
      }));

      cache.set(cacheKey, articles);
      return articles;
    } catch (error) {
      console.error(`Failed to fetch RSS feed ${source.name}:`, error.message);
      return [];
    }
  }

  // Analyze sentiment for a batch of articles
  analyzeArticles(articles) {
    const results = articles.map(article => {
      const titleSentiment = this.analyzeSentiment(article.title);
      const descriptionSentiment = this.analyzeSentiment(article.description);
      
      // Combined sentiment (weighted average)
      const combinedScore = (titleSentiment.compound * 0.6) + (descriptionSentiment.compound * 0.4);
      const combinedSentiment = combinedScore >= 0.05 ? 'positive' : 
                              combinedScore <= -0.05 ? 'negative' : 'neutral';

      const category = this.categorizeNews(article.title, article.description);

      return {
        ...article,
        sentiment: {
          overall: combinedSentiment,
          score: combinedScore,
          confidence: Math.abs(combinedScore),
          title_sentiment: titleSentiment,
          description_sentiment: descriptionSentiment
        },
        category: category,
        analyzed_at: new Date().toISOString()
      };
    });

    return results;
  }

  // Calculate aggregate sentiment metrics
  calculateAggregateSentiment(analyzedArticles) {
    if (analyzedArticles.length === 0) {
      return {
        overall_sentiment: 'neutral',
        sentiment_score: 0,
        confidence: 0,
        article_count: 0,
        sentiment_distribution: { positive: 0, negative: 0, neutral: 0 },
        category_distribution: { bullish: 0, bearish: 0, neutral: 0 }
      };
    }

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const categoryCounts = { bullish: 0, bearish: 0, neutral: 0 };
    let totalScore = 0;
    let totalConfidence = 0;

    analyzedArticles.forEach(article => {
      sentimentCounts[article.sentiment.overall]++;
      categoryCounts[article.category]++;
      totalScore += article.sentiment.score;
      totalConfidence += article.sentiment.confidence;
    });

    const avgScore = totalScore / analyzedArticles.length;
    const avgConfidence = totalConfidence / analyzedArticles.length;

    let overallSentiment = 'neutral';
    if (avgScore >= 0.05) {
      overallSentiment = 'positive';
    } else if (avgScore <= -0.05) {
      overallSentiment = 'negative';
    }

    return {
      overall_sentiment: overallSentiment,
      sentiment_score: avgScore,
      confidence: avgConfidence,
      article_count: analyzedArticles.length,
      sentiment_distribution: {
        positive: (sentimentCounts.positive / analyzedArticles.length) * 100,
        negative: (sentimentCounts.negative / analyzedArticles.length) * 100,
        neutral: (sentimentCounts.neutral / analyzedArticles.length) * 100
      },
      category_distribution: {
        bullish: (categoryCounts.bullish / analyzedArticles.length) * 100,
        bearish: (categoryCounts.bearish / analyzedArticles.length) * 100,
        neutral: (categoryCounts.neutral / analyzedArticles.length) * 100
      }
    };
  }

  // Main analysis function
  async performSentimentAnalysis() {
    console.log('Starting sentiment analysis...');
    const results = {
      timestamp: new Date().toISOString(),
      sources: {},
      aggregates: {},
      articles: []
    };

    try {
      // Fetch articles from all sources
      const allArticles = [];
      
      for (const [category, sources] of Object.entries(NEWS_SOURCES)) {
        console.log(`Processing ${category} news sources...`);
        const categoryArticles = [];
        
        for (const source of sources) {
          try {
            const articles = await this.fetchRSSFeed(source);
            const analyzedArticles = this.analyzeArticles(articles);
            categoryArticles.push(...analyzedArticles);
            allArticles.push(...analyzedArticles);
            
            // Store per-source results
            results.sources[source.name] = {
              category: category,
              article_count: analyzedArticles.length,
              sentiment: this.calculateAggregateSentiment(analyzedArticles),
              last_updated: new Date().toISOString()
            };
            
            console.log(`✓ Analyzed ${analyzedArticles.length} articles from ${source.name}`);
          } catch (error) {
            console.error(`✗ Failed to process ${source.name}:`, error.message);
            results.sources[source.name] = {
              category: category,
              error: error.message,
              last_updated: new Date().toISOString()
            };
          }
        }

        // Calculate category aggregates
        results.aggregates[category] = this.calculateAggregateSentiment(categoryArticles);
      }

      // Calculate overall aggregate
      results.aggregates.overall = this.calculateAggregateSentiment(allArticles);
      
      // Store most recent articles (top 50 by date)
      results.articles = allArticles
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 50);

      // Add metadata
      results.metadata = {
        total_articles: allArticles.length,
        sources_processed: Object.keys(results.sources).length,
        cache_hits: cache.getStats().hits,
        cache_misses: cache.getStats().misses,
        processing_time: Date.now() - process.startTime
      };

      console.log(`✓ Sentiment analysis completed`);
      console.log(`✓ Processed ${allArticles.length} total articles`);
      console.log(`✓ Overall sentiment: ${results.aggregates.overall.overall_sentiment} (${results.aggregates.overall.sentiment_score.toFixed(3)})`);

      return results;

    } catch (error) {
      console.error('✗ Sentiment analysis failed:', error);
      throw error;
    }
  }

  // Load existing market data and enhance with sentiment
  async enhanceMarketDataWithSentiment() {
    try {
      const marketDataPath = path.resolve(__dirname, '../public/data/market-data.json');
      const sentimentDataPath = path.resolve(__dirname, '../public/data/sentiment-analysis.json');
      
      // Perform sentiment analysis
      const sentimentResults = await this.performSentimentAnalysis();
      
      // Save standalone sentiment analysis
      await fs.ensureDir(path.dirname(sentimentDataPath));
      await fs.writeJSON(sentimentDataPath, sentimentResults, { spaces: 2 });
      console.log(`✓ Sentiment analysis saved to: ${sentimentDataPath}`);

      // Try to enhance existing market data
      if (await fs.pathExists(marketDataPath)) {
        const marketData = await fs.readJSON(marketDataPath);
        
        // Add sentiment insights to market data
        marketData.sentiment_analysis = {
          overall: sentimentResults.aggregates.overall,
          by_category: sentimentResults.aggregates,
          top_articles: sentimentResults.articles.slice(0, 10),
          last_updated: new Date().toISOString()
        };

        // Calculate market sentiment score based on multiple factors
        const marketSentimentScore = this.calculateMarketSentimentScore(marketData, sentimentResults);
        marketData.market_sentiment_score = marketSentimentScore;

        await fs.writeJSON(marketDataPath, marketData, { spaces: 2 });
        console.log(`✓ Enhanced market data with sentiment analysis`);
      }

      return sentimentResults;

    } catch (error) {
      console.error('✗ Failed to enhance market data with sentiment:', error);
      throw error;
    }
  }

  // Calculate comprehensive market sentiment score
  calculateMarketSentimentScore(marketData, sentimentData) {
    let score = 50; // Start with neutral

    try {
      // News sentiment contribution (30% weight)
      const newsSentiment = sentimentData.aggregates.overall.sentiment_score;
      score += newsSentiment * 15; // Scale to ±15 points

      // Fear & Greed Index contribution (25% weight)
      if (marketData.fear_greed && marketData.fear_greed.value) {
        score += (marketData.fear_greed.value - 50) * 0.25;
      }

      // VIX contribution (20% weight) - inverse relationship
      if (marketData.vix && marketData.vix.value) {
        const vixImpact = Math.max(-10, Math.min(10, (25 - marketData.vix.value) * 0.5));
        score += vixImpact;
      }

      // Stock performance contribution (25% weight)
      if (marketData.stocks) {
        const stockChanges = Object.values(marketData.stocks)
          .filter(stock => stock.change !== undefined)
          .map(stock => stock.change);
        
        if (stockChanges.length > 0) {
          const avgChange = stockChanges.reduce((sum, change) => sum + change, 0) / stockChanges.length;
          score += Math.max(-12.5, Math.min(12.5, avgChange * 5));
        }
      }

      // Ensure score is within bounds
      score = Math.max(0, Math.min(100, score));

      return {
        score: Math.round(score * 100) / 100,
        classification: score >= 75 ? 'Extreme Greed' :
                       score >= 60 ? 'Greed' :
                       score >= 40 ? 'Neutral' :
                       score >= 25 ? 'Fear' : 'Extreme Fear',
        components: {
          news_sentiment: newsSentiment,
          fear_greed_contribution: marketData.fear_greed?.value || 50,
          vix_contribution: marketData.vix?.value || 20,
          stock_performance: marketData.stocks ? 'included' : 'not available'
        },
        last_calculated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error calculating market sentiment score:', error);
      return {
        score: 50,
        classification: 'Neutral',
        error: error.message,
        last_calculated: new Date().toISOString()
      };
    }
  }
}

// Main execution
async function runSentimentAnalysis() {
  console.log('Initializing sentiment analysis process...');
  const analyzer = new SentimentAnalyzer();
  
  try {
    const results = await analyzer.enhanceMarketDataWithSentiment();
    console.log('✓ Sentiment analysis process completed successfully');
    return results;
  } catch (error) {
    console.error('✗ Sentiment analysis process failed:', error);
    throw error;
  }
}

// Error handling
process.startTime = Date.now();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSentimentAnalysis()
    .then(() => {
      console.log('Sentiment analysis completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sentiment analysis failed:', error);
      process.exit(1);
    });
}

export default runSentimentAnalysis;