import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <h1 data-theme="dark" className="btn btn-success btn-lg">Hello vite!</h1>
  </StrictMode>,
)
