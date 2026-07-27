import { Component, type ErrorInfo, type PropsWithChildren } from 'react'
import { WebGLFallback } from '../ui/WebGLFallback'

interface RendererBoundaryProps extends PropsWithChildren {
  canRetry: boolean
  onRetry: () => void
}

interface RendererBoundaryState {
  failed: boolean
}

export class RendererBoundary extends Component<
  RendererBoundaryProps,
  RendererBoundaryState
> {
  state: RendererBoundaryState = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('FELICIA renderer failure', error, info.componentStack)
    }
  }

  render() {
    if (this.state.failed) {
      return <WebGLFallback canRetry={this.props.canRetry} onRetry={this.props.onRetry} />
    }

    return this.props.children
  }
}
