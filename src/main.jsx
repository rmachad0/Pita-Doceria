import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MenuPage from './pages/MenuPage.jsx'

const isMenu = window.location.pathname.startsWith('/menu')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isMenu ? <MenuPage /> : <App />}
  </StrictMode>,
)
