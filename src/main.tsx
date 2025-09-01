import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppVariant2 as App } from './designs/variant2'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
