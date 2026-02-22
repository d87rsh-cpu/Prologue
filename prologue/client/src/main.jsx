import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './contexts/ToastContext'
import App from './App.jsx'
import './index.css'

// #region agent log
const _log = (loc, msg, data) => { console.log('[dbg]', loc, msg, data ?? {}); try { fetch('http://127.0.0.1:7887/ingest/ba7b2dc7-362b-45a7-8454-9ff5c803019e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70b6a8' }, body: JSON.stringify({ sessionId: '70b6a8', location: loc, message: msg, data: data ?? {}, timestamp: Date.now() }) }).catch(() => {}); } catch (e) {} };
_log('main.jsx', 'mount start', { rootExists: !!document.getElementById('root') });
// #endregion

class RootErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError (error) { return { error } }
  componentDidCatch (error, info) {
    console.error('[dbg] RootErrorBoundary', error, info?.componentStack)
    _log('main.jsx', 'RootErrorBoundary caught', { message: error?.message, stack: error?.stack })
  }
  render () {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A2E', color: '#E94560', fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Something went wrong</p>
            <pre style={{ fontSize: 12, color: '#A0A0B0', overflow: 'auto', maxWidth: '90vw' }}>{this.state.error?.message ?? String(this.state.error)}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

try {
  const root = document.getElementById('root')
  ReactDOM.createRoot(root).render(
    <RootErrorBoundary>
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    </RootErrorBoundary>,
  )
  _log('main.jsx', 'mount done', {})
} catch (e) {
  console.error('[dbg] main.jsx render error', e)
  _log('main.jsx', 'mount error', { message: e?.message })
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1A1A2E;color:#E94560;font-family:system-ui,sans-serif;padding:24;"><div><p style="font-weight:600;">Failed to start</p><pre style="font-size:12;color:#A0A0B0;">' + (e?.message || String(e)) + '</pre></div></div>'
  }
}
