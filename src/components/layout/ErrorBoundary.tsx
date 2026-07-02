import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Project Defeat crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="app-shell">
        <div className="panel error-boundary">
          <p className="eyebrow">Something broke</p>
          <h2>The build hit an unexpected error</h2>
          <p className="panel-copy">{this.state.error.message}</p>
          <Button onClick={() => window.location.reload()}>Reset build</Button>
        </div>
      </main>
    )
  }
}
