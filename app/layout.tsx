import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Market Sentiment Tracker | Iron Condor Trading Intelligence',
  description: 'Real-time market sentiment analysis for SPY, QQQ, and IWM iron condor trading strategies. Track fear & greed index, VIX levels, and put/call ratios.',
  keywords: 'market sentiment, iron condor, options trading, SPY, QQQ, IWM, fear greed index, VIX, put call ratio',
  authors: [{ name: 'Market Sentiment Tracker' }],
  openGraph: {
    title: 'Market Sentiment Tracker',
    description: 'Professional market sentiment analysis for iron condor trading',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}