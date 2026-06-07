import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Filet de sécurité : une page chargée à la demande (lazy) dont le
        fragment de code ne correspond plus au cache du service worker après
        une mise à jour ferait planter tout l'arbre React et laisserait un
        écran vide — l'ErrorBoundary propose alors un rechargement en un clic. */}
    <ErrorBoundary>
      {/* HashRouter : les routes (#/semaine, etc.) restent gérées côté client sans
          configuration serveur particulière — essentiel pour un hébergement statique
          comme GitHub Pages, qui ne sait pas réécrire les URLs vers index.html. */}
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
