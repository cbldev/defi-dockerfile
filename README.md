# Bonjour Node.js

Une page HTML, Node.js natif et Tailwind CSS local. Node.js **24+** requis.

```sh
npm ci
cp .env.example .env
npm run build:css
npm start
```

Ouvrir <http://localhost:3000>.

Après une modification des classes HTML, relancer `npm run build:css`.
Le CSS compilé est fourni dans `public/styles.css` : aucun CDN ni JavaScript
côté navigateur, aucune dépendance npm d'exécution.

```sh
npm test
```
