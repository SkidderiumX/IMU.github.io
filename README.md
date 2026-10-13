# IMU-Web

Free static website hosted on GitHub Pages.

## Local preview

Just open `index.html` in a browser, or run:

```powershell
# Python 3
python -m http.server 8000
# then open http://localhost:8000/
```

## Deploy (free)

1. Create a public GitHub repo (e.g. `IMU-Web`)
2. Push this folder to `main`:
```powershell
git init
git add .
git commit -m "init pages site"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```
3. Repo > Settings > Pages > Source: **GitHub Actions**
4. Wait ~1 min. Live at `https://USERNAME.github.io/REPO/`

Workflow is in `.github/workflows/pages.yml:1`.
No build step — pure HTML/CSS/JS.

## Edit

- Content: `index.html`
- Styles: `assets/css/style.css`
- Script: `assets/js/main.js`
- 404 page: `404.html`
