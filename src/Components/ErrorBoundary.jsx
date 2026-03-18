import { Component } from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1>Something went wrong</h1>
            <p>We apologize for the inconvenience. Please try again or go back to the homepage.</p>
            
            {this.state.error && (
              <div className="error-details">
                <details>
                  <summary>Error details (for developers)</summary>
                  <pre>{this.state.error.toString()}</pre>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </details>
              </div>
            )}
            
            <div className="error-actions">
              <button className="btn-primary" onClick={this.handleReload}>
                Reload Page
              </button>
              <button className="btn-secondary" onClick={this.handleGoHome}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
