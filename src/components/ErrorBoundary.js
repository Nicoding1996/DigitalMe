import { Component } from 'react';
import './ErrorBoundary.css';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Displays fallback UI and logs error information for debugging
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error information in state
    this.setState({
      error,
      errorInfo
    });

    // Log to external error tracking service (future implementation)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Placeholder for external error logging service
    // In production, this would send to services like Sentry, LogRocket, etc.
    const errorLog = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error logged:', errorLog);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Determine user-friendly error message based on error type
      let userMessage = 'The application encountered an unexpected error.';
      let errorType = 'unknown';
      
      if (this.state.error) {
        const errorMsg = this.state.error.toString().toLowerCase();
        
        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
          userMessage = 'Unable to connect to the server. Please check your internet connection.';
          errorType = 'network';
        } else if (errorMsg.includes('timeout')) {
          userMessage = 'The request took too long to complete. Please try again.';
          errorType = 'timeout';
        } else if (errorMsg.includes('unauthorized') || errorMsg.includes('authentication')) {
          userMessage = 'Authentication failed. Please try logging in again.';
          errorType = 'auth';
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          userMessage = 'The requested resource was not found.';
          errorType = 'notfound';
        }
      }
      
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠</div>
            <h1 className="error-title">Something went wrong</h1>
            <p className="error-message">{userMessage}</p>
            <p className="error-hint">
              {errorType === 'network' && 'Check your connection and try again.'}
              {errorType === 'timeout' && 'The server may be busy. Wait a moment and retry.'}
              {errorType === 'auth' && 'You may need to reconnect your accounts.'}
              {errorType === 'notfound' && 'The page or resource may have been moved.'}
              {errorType === 'unknown' && 'You can try to recover or reload the page.'}
            </p>
            
            <div className="error-actions">
              <button className="error-button primary" onClick={this.handleReset}>
                <span className="button-icon">↻</span>
                Try to Recover
              </button>
              <button className="error-button secondary" onClick={this.handleReload}>
                <span className="button-icon">⟳</span>
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-stack">
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  <pre>{this.state.error.stack}</pre>
                  {this.state.errorInfo && (
                    <>
                      <p><strong>Component Stack:</strong></p>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
