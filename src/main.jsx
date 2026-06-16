import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MenuPage from './pages/MenuPage.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#F5F0EB',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#525F54', marginBottom: 8 }}>
            Ops! Algo deu errado.
          </div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
            {String(this.state.error?.message || 'Erro desconhecido')}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#525F54', color: '#FABD97', border: 'none',
              borderRadius: 12, padding: '13px 28px', fontWeight: 700,
              fontSize: 15, cursor: 'pointer',
            }}
          >
            🔄 Recarregar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const isMenu = window.location.pathname.startsWith('/menu')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isMenu ? <MenuPage /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
