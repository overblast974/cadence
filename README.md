# Cadence

Une PWA de routines et de tâches, pensée pour s'adapter aux deux formats d'écran
du Galaxy Z Fold 4 (écran de couverture replié et écran principal déplié).

Toutes les données restent **locales** : aucune inscription, aucun serveur,
aucune connexion requise. Tout est stocké dans IndexedDB sur l'appareil et
persiste entre les sessions (avec export/import JSON pour les sauvegardes).

## Fonctionnalités

- **Aujourd'hui** — liste des tâches du jour, anneau de progression, petite
  pluie de confettis quand tout est validé
- **Semaine** — planning sur 7 jours (vue empilée en repli, grille déroulante
  en dépli)
- **Routines** — modèles récurrents qui génèrent automatiquement des tâches
  les jours programmés
- **Progrès** — séries de jours réussis, taux de complétion, calendrier de
  chaleur
- **Réglages** — export / import de sauvegarde JSON, réinitialisation

## Stack technique

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (jetons de design dans `src/index.css`)
- Dexie.js (IndexedDB) pour le stockage local persistant
- Framer Motion pour les animations
- react-router-dom, date-fns (locale `fr`), lucide-react
- Vitest + Testing Library pour les tests

## Démarrage

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production (dist/)
npm run test     # suite de tests
```

## Adaptation Z Fold 4

L'application ne détecte pas l'appareil : elle mesure la fenêtre d'affichage
réelle (largeur, hauteur, ratio) via `useViewportMode`, puisque le Z Fold 4
redimensionne littéralement sa fenêtre lorsqu'il se plie / déplie.

- **Écran de couverture** (~344 × 882 px CSS) → mise en page compacte avec
  navigation en bas
- **Écran principal** (~690 × 830 px CSS) → mise en page large avec rail de
  navigation latéral et grilles multi-colonnes

## Installer Cadence sur le Galaxy Z Fold 4 (PWA)

1. Démarre l'application (en local avec `npm run dev` puis `npm run build && npm run preview`,
   ou héberge le dossier `dist/` après un build de production sur n'importe quel
   serveur statique / hébergement de fichiers statiques de ton choix)
2. Ouvre l'URL dans **Chrome** (ou Samsung Internet) sur le Z Fold 4
3. Ouvre le menu (⋮) en haut à droite
4. Sélectionne **« Ajouter à l'écran d'accueil »** ou **« Installer l'application »**
5. Confirme l'installation — Cadence apparaît alors comme une application
   native, avec sa propre icône, son splash screen et son mode plein écran
   (sans barre d'adresse)

Une fois installée, l'application fonctionne hors-ligne grâce au service
worker généré par `vite-plugin-pwa`, et tes données restent stockées
localement sur l'appareil.

## Sauvegarde des données

Comme tout est stocké localement (IndexedDB), pense à exporter régulièrement
une sauvegarde JSON depuis **Réglages → Exporter** — utile avant de
réinitialiser l'appareil, de changer de téléphone, ou simplement par
prudence. Le fichier exporté peut être réimporté à tout moment depuis le
même écran.
