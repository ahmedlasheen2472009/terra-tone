import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Earth Jukebox runtime error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            backgroundColor: '#070a13',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center',
            gap: '1rem'
          }}
        >
          <h1 style={{ fontSize: '1.4rem', color: '#38bdf8', margin: 0 }}>
            Earth Jukebox failed to render
          </h1>
          <p style={{ maxWidth: '520px', color: '#cbd5e1', margin: 0 }}>
            {this.state.error?.message || 'Unexpected application error.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: '1px solid #38bdf8',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
