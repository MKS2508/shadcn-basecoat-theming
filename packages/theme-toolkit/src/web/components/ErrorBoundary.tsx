import React, { Component, ErrorInfo, ReactNode } from 'react';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Theme Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold">Error en el Theme Manager</h2>
            <p className="text-muted-foreground">
              Hubo un error al inicializar el sistema de themes. La aplicación continuará funcionando con los ajustes básicos.
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}