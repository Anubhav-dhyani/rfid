import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error('Application render error:', error, details);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="fatal-error">
      <div>
        <AlertTriangle />
        <h1>This page could not be displayed</h1>
        <p>{this.state.error.message || 'An unexpected interface error occurred.'}</p>
        <button className="button primary" onClick={() => window.location.reload()}>Reload application</button>
      </div>
    </main>;
  }
}
