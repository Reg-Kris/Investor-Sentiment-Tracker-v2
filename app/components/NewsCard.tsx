'use client';

import { Card, Text, Flex, Badge } from '@tremor/react';
import { clsx } from 'clsx';
import Image from 'next/image';
import { ExternalLink, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  impact?: 'high' | 'medium' | 'low';
  category?: string;
  imageUrl?: string;
  keywords?: string[];
}

interface NewsCardProps {
  news: NewsItem[];
  title?: string;
  maxItems?: number;
  showImages?: boolean;
  showSentiment?: boolean;
  showCategory?: boolean;
  className?: string;
  layout?: 'list' | 'grid' | 'compact';
}

export default function NewsCard({
  news,
  title = "Market News",
  maxItems = 5,
  showImages = false,
  showSentiment = true,
  showCategory = true,
  className,
  layout = 'list'
}: NewsCardProps) {
  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'emerald';
      case 'negative':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const formatPublishTime = (publishedAt: string) => {
    try {
      return formatDistanceToNow(parseISO(publishedAt), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const displayedNews = news.slice(0, maxItems);
  const layoutClasses = {
    list: 'space-y-4',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    compact: 'space-y-2'
  };

  return (
    <Card className={clsx('p-6', className)}>
      <div className="mb-6">
        <Flex justifyContent="between" alignItems="center">
          <Text className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {title}
          </Text>
          <Badge color="blue" size="xs">
            {displayedNews.length} articles
          </Badge>
        </Flex>
        <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle mt-1">
          Latest market news and analysis
        </Text>
      </div>

      {displayedNews.length === 0 ? (
        <div className="text-center py-8">
          <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
            No news articles available
          </Text>
        </div>
      ) : (
        <div className={layoutClasses[layout]}>
          {displayedNews.map((item) => (
            <article
              key={item.id}
              className={clsx(
                'border border-tremor-border dark:border-dark-tremor-border rounded-lg p-4',
                'hover:shadow-tremor-card dark:hover:shadow-dark-tremor-card transition-all duration-200',
                'hover:border-tremor-brand dark:hover:border-dark-tremor-brand cursor-pointer',
                'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50'
              )}
              role="article"
              aria-label={`News article: ${item.title}`}
            >
              {showImages && item.imageUrl && (
                <div className="mb-3">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded-md"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="space-y-2">
                {/* Title and External Link */}
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex-1"
                    aria-label={`Read full article: ${item.title}`}
                  >
                    <Text className={clsx(
                      'font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong',
                      'group-hover:text-tremor-brand dark:group-hover:text-dark-tremor-brand',
                      'transition-colors duration-200',
                      layout === 'compact' ? 'text-sm' : 'text-base'
                    )}>
                      {item.title}
                    </Text>
                  </a>
                  <ExternalLink className="h-4 w-4 text-tremor-content-subtle dark:text-dark-tremor-content-subtle flex-shrink-0" />
                </div>

                {/* Summary */}
                {item.summary && layout !== 'compact' && (
                  <Text className="text-tremor-content dark:text-dark-tremor-content text-sm line-clamp-2">
                    {item.summary}
                  </Text>
                )}

                {/* Metadata */}
                <Flex justifyContent="between" alignItems="center" className="flex-wrap gap-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {/* Source and Time */}
                    <Flex alignItems="center" className="space-x-1">
                      <Clock className="h-3 w-3 text-tremor-content-subtle dark:text-dark-tremor-content-subtle" />
                      <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                        {item.source} • {formatPublishTime(item.publishedAt)}
                      </Text>
                    </Flex>

                    {/* Category */}
                    {showCategory && item.category && (
                      <Badge color="gray" size="xs">
                        {item.category}
                      </Badge>
                    )}

                    {/* Impact */}
                    {item.impact && (
                      <Badge color={getImpactColor(item.impact)} size="xs">
                        {item.impact} impact
                      </Badge>
                    )}
                  </div>

                  {/* Sentiment */}
                  {showSentiment && item.sentiment && (
                    <Flex alignItems="center" className="space-x-1">
                      {getSentimentIcon(item.sentiment)}
                      <Badge color={getSentimentColor(item.sentiment)} size="xs">
                        {item.sentiment}
                      </Badge>
                    </Flex>
                  )}
                </Flex>

                {/* Keywords */}
                {item.keywords && item.keywords.length > 0 && layout !== 'compact' && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.keywords.slice(0, 3).map((keyword) => (
                      <Badge
                        key={keyword}
                        color="blue"
                        size="xs"
                        className="text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                    {item.keywords.length > 3 && (
                      <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle self-center">
                        +{item.keywords.length - 3} more
                      </Text>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* View All Link */}
      {news.length > maxItems && (
        <div className="mt-6 pt-4 border-t border-tremor-border dark:border-dark-tremor-border">
          <Flex justifyContent="center">
            <button
              className="text-tremor-brand dark:text-dark-tremor-brand hover:underline text-sm font-medium"
              onClick={() => {
                // Handle view all news
                console.log('View all news clicked');
              }}
            >
              View all {news.length} articles
            </button>
          </Flex>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4">
        <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-center">
          Last updated: {new Date().toLocaleString()}
        </Text>
      </div>
    </Card>
  );
}