# Portfolio de Ly Jordan ABENG

Site publié sur <https://ly00142.github.io/portfolio/>.

Site statique construit avec [Vite](https://vitejs.dev/), en français et en anglais.

## Structure

- `index.html`, `about.html`, `expertise.html`, `projects.html`, `contact.html` : les pages, chacune avec sa version anglaise en `-en.html`. Une correction de texte se fait dans les deux fichiers.
- `style.css`, `main.js` : le style et les animations (fond animé, écriture progressive, menu mobile, vidéos).
- `assets/images/` : photo et logos.
- `public/assets/docs/` : le CV en PDF. Un fichier seulement lié par `<a href>` doit être placé dans `public/`, sinon Vite ne le copie pas.
- `public/assets/videos/` : les vidéos et leurs images d'aperçu.

## Travailler en local

```bash
npm install
npm run dev      # http://localhost:5173/portfolio/
npm run build    # génère dist/
```

## Mise en ligne

Chaque push sur `main` lance `.github/workflows/deploy.yml`, qui construit le site et le publie sur GitHub Pages.
Une seule fois, dans le dépôt : **Settings > Pages > Source : GitHub Actions**.
