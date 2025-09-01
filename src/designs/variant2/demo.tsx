/**
 * DEMO: How to use AppVariant2 (Tabbed Interface)
 * 
 * To test this variant, replace the import in main.tsx:
 * 
 * // FROM:
 * import App from './App'
 * 
 * // TO:
 * import { AppVariant2 as App } from './designs/variant2'
 * 
 * This will load the tabbed interface version instead of the original.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppVariant2 } from './index'
import '../../index.css'

// Example of how to render the variant directly
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppVariant2 />
  </React.StrictMode>,
)