'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-4xl font-bold text-rose-500">Oops!</h1>
            <p className="text-slate-300">Something went wrong on this page.</p>
            <details className="text-left text-xs text-slate-400 bg-slate-900 p-4 rounded-lg">
              <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
              <pre className="whitespace-pre-wrap">{this.state.error?.message}</pre>
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-6 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
