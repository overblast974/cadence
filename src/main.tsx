import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter : les routes (#/semaine, etc.) restent gérées côté client sans
        configuration serveur particulière — essentiel pour un hébergement statique
        comme GitHub Pages, qui ne sait pas réécrire les URLs vers index.html. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
