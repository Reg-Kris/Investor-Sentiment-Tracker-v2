'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { X, Info, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface TooltipContent {
  title: string;
  explanation: string;
  example?: string;
  goodRange?: string;
  badRange?: string;
  tip?: string;
}

interface ContextualTooltipProps {
  content: TooltipContent;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  triggerOn?: 'hover' | 'click';
}

export default function ContextualTooltip({
  content,
  children,
  position = 'top',
  size = 'md',
  triggerOn = 'hover'
}: ContextualTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-64 p-3 text-xs',
    md: 'w-80 p-4 text-sm',
    lg: 'w-96 p-5 text-base'
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  };

  const handleTrigger = () => {
    if (triggerOn === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (triggerOn === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (triggerOn === 'hover') {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Element */}
      <div 
        onClick={handleTrigger}
        className={clsx(
          triggerOn === 'click' ? 'cursor-pointer' : 'cursor-help',
          'inline-flex items-center'
        )}
      >
        {children}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={clsx(
              'absolute z-50',
              positionClasses[position],
              sizeClasses[size],
              'bg-gray-900 dark:bg-gray-800',
              'text-white',
              'rounded-lg shadow-2xl',
              'border border-gray-700',
              'backdrop-blur-sm'
            )}
            style={{ maxWidth: '90vw' }}
          >
            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-8',
                arrowClasses[position]
              )}
            />

            {/* Close button for click trigger */}
            {triggerOn === 'click' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="absolute top-2 right-2 p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Content */}
            <div className="space-y-3">
              {/* Title */}
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <h3 className="font-semibold text-white">{content.title}</h3>
              </div>

              {/* Explanation */}
              <p className="text-gray-200 leading-relaxed">
                {content.explanation}
              </p>

              {/* Example */}
              {content.example && (
                <div className="bg-gray-800/50 rounded-md p-3 border border-gray-700">
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium text-yellow-400">Example:</span> {content.example}
                  </p>
                </div>
              )}

              {/* Ranges */}
              {(content.goodRange || content.badRange) && (
                <div className="grid grid-cols-1 gap-2">
                  {content.goodRange && (
                    <div className="flex items-center space-x-2 bg-emerald-900/30 rounded-md p-2 border border-emerald-700/50">
                      <TrendingUp className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-emerald-300 text-sm font-medium">Good Range</p>
                        <p className="text-emerald-200 text-xs">{content.goodRange}</p>
                      </div>
                    </div>
                  )}
                  
                  {content.badRange && (
                    <div className="flex items-center space-x-2 bg-red-900/30 rounded-md p-2 border border-red-700/50">
                      <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-red-300 text-sm font-medium">Warning Range</p>
                        <p className="text-red-200 text-xs">{content.badRange}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tip */}
              {content.tip && (
                <div className="bg-blue-900/30 rounded-md p-3 border border-blue-700/50">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">Pro Tip</p>
                      <p className="text-blue-200 text-xs">{content.tip}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Predefined tooltip contents for common metrics
export const METRIC_TOOLTIPS = {
  fearGreedIndex: {
    title: 'Fear & Greed Index',
    explanation: 'A measure of market emotion from 0 (extreme fear) to 100 (extreme greed). It combines 7 different market indicators to gauge overall investor sentiment.',
    example: 'When the index is at 20, investors are very scared and selling everything. When it\'s at 80, investors are very excited and buying aggressively.',
    goodRange: '30-70 (balanced emotions allow rational decisions)',
    badRange: 'Below 20 or above 80 (extreme emotions often lead to bad timing)',
    tip: 'Contrarian strategy: Consider buying when others are fearful (low index) and selling when others are greedy (high index).'
  },
  vixLevel: {
    title: 'VIX Volatility Index',
    explanation: 'Measures expected market volatility over the next 30 days. Often called the "fear gauge" - higher values mean more uncertainty and bigger price swings expected.',
    example: 'VIX at 15 means calm markets with small daily moves. VIX at 40 means turbulent markets with large daily swings.',
    goodRange: '12-20 (normal, stable market conditions)',
    badRange: 'Above 30 (high stress, big price swings expected)',
    tip: 'High VIX often signals market bottoms, while very low VIX can indicate complacency before corrections.'
  },
  putCallRatio: {
    title: 'Put/Call Ratio',
    explanation: 'Compares the number of put options (bets that stocks will fall) to call options (bets that stocks will rise). Higher ratios suggest more pessimism.',
    example: 'Ratio of 1.2 means 20% more puts than calls - investors are more bearish. Ratio of 0.8 means 20% more calls - investors are more bullish.',
    goodRange: '0.8-1.2 (balanced optimism and pessimism)',
    badRange: 'Above 1.5 (extreme pessimism) or below 0.5 (extreme optimism)',
    tip: 'Extreme readings often signal market turning points - high ratios near market bottoms, low ratios near tops.'
  },
  spyPrice: {
    title: 'SPY Price',
    explanation: 'The price of SPDR S&P 500 ETF, which tracks the S&P 500 index. This represents the overall U.S. stock market performance.',
    example: 'If SPY is at $450 and rising, the broader U.S. stock market is doing well. If it\'s falling, most stocks are declining too.',
    tip: 'SPY movements often predict how most individual stocks will perform since it represents the entire market.'
  },
  qqqPrice: {
    title: 'QQQ Price',
    explanation: 'The price of Invesco QQQ Trust, which tracks the Nasdaq-100 index. This represents technology and growth stock performance.',
    example: 'QQQ includes Apple, Microsoft, Amazon, Google, and other tech giants. Its price reflects how technology stocks are performing.',
    tip: 'QQQ often moves more dramatically than SPY - it goes up more in bull markets but falls more in bear markets.'
  }
};