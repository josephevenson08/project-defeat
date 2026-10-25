import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/layout/ErrorBoundary.tsx'
import { bootScene } from './features/scene/sceneControl.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// The optional 3D scene and motion (port step 7): decides whether they may run, then loads them when idle.
bootScene()
