'use client'

import React from 'react'

type ErrorBoundaryProps = {
  children: React.ReactNode
  fallbackClassName?: string
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`flex items-center justify-center p-6 ${this.props.fallbackClassName ?? ''}`}>
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-destructive">
              出现了一些问题
            </p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
