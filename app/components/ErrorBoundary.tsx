'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
// Removed logger import for static build compatibility

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('React Error Boundary caught an error', error, {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      retryCount: this.retryCount,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external error tracking service (if configured)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        error_id: this.state.errorId
      });
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      console.info('Retrying after error boundary', {
        errorId: this.state.errorId,
        retryCount: this.retryCount
      });

      this.setState({
        hasError: false,
        error: undefined,
        errorId: ''
      });
    }
  };

  private handleReportError = () => {
    const error = this.state.error;
    if (!error) return;

    // Create a detailed error report
    const errorReport = {
      message: error.message,
      stack: error.stack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.retryCount
    };

    // Copy to clipboard for easy sharing
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please share this with the development team.');
      })
      .catch(() => {
        // Fallback: show error report in a new window
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          reportWindow.document.write(`
            <html>
              <head><title>Error Report - ${this.state.errorId}</title></head>
              <body>
                <h1>Error Report</h1>
                <pre>${JSON.stringify(errorReport, null, 2)}</pre>
                <button onclick="window.close();">Close</button>
              </body>
            </html>
          `);
        }
      });

    console.info('Error report generated', { errorId: this.state.errorId });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                
                <h2 className="mt-6 text-xl font-bold text-gray-900">
                  Something went wrong
                </h2>
                
                <p className="mt-2 text-sm text-gray-600">
                  We've encountered an unexpected error. Our team has been notified.
                </p>
                
                <div className="mt-4 text-xs text-gray-500">
                  Error ID: {this.state.errorId}
                </div>
                
                {this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                      <div className="font-semibold text-red-600">
                        {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="mt-2 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
                
                <div className="mt-6 flex flex-col space-y-3">
                  {this.retryCount < this.maxRetries && (
                    <button
                      onClick={this.handleRetry}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Try Again ({this.maxRetries - this.retryCount} attempts left)
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reload Page
                  </button>
                  
                  <button
                    onClick={this.handleReportError}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Report Error
                  </button>
                </div>
                
                <div className="mt-6 text-center">
                  <a
                    href="/"
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Return to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;