import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-slate-800 rounded-lg border border-red-500/30">
            <div className="text-red-400 font-medium mb-2">Something went wrong</div>
            <div className="text-slate-400 text-sm mb-4 text-center max-w-md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors text-sm"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
