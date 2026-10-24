import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './fonts.css'
import App from './App'
import './index.css'

// Lazy images below the fold may not have loaded when someone prints; load them all first.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach(img => { img.loading = 'eager' })
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MotionConfig reducedMotion='user'>
        <App />
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
)
