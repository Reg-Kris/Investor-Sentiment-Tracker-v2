import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeScript } from './components/ThemeScript'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Market Sentiment Tracker | Professional Trading Intelligence',
  description: 'Advanced market sentiment dashboard with real-time analysis for SPY, QQQ, and IWM. Features fear & greed index, VIX levels, sector heatmaps, and comprehensive market intelligence.',
  keywords: 'market sentiment, trading dashboard, SPY, QQQ, IWM, fear greed index, VIX, sector analysis, market intelligence, trading tools',
  authors: [{ name: 'Market Sentiment Tracker' }],
  openGraph: {
    title: 'Market Sentiment Tracker - Professional Trading Dashboard',
    description: 'Advanced market sentiment analysis and trading intelligence platform',
    type: 'website',
  },
  robots: 'index, follow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript storageKey="sentiment-tracker-theme" />
      </head>
      <body 
        className={`${inter.className} min-h-screen transition-colors duration-300`}
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="system" storageKey="sentiment-tracker-theme">
          <div className="min-h-screen bg-tremor-background dark:bg-dark-tremor-background text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}