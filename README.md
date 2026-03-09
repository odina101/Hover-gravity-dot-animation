# Hover Gravity Dot Animation

A simple gravity dots canvas animation with shape presets (box, heart, circle, star, diamond).

## Run locally

Open `index.html` in a browser or use a local server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploy for free

### Option A: Vercel (recommended, ~1 min)

1. Push this repo to your GitHub (or use the existing [odina101/Hover-gravity-dot-animation](https://github.com/odina101/Hover-gravity-dot-animation)).
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **Add New** → **Project**, import `Hover-gravity-dot-animation`.
4. Leave defaults (no build command, root directory) and click **Deploy**.
5. Your site will be live at `https://your-project.vercel.app`.

Or from this folder:

```bash
npx vercel
```

Follow the prompts and open the returned URL.

### Option B: GitHub Pages

1. Push the repo to GitHub (including the `.github/workflows/deploy-pages.yml` file).
2. In the repo: **Settings** → **Pages**.
3. Under **Build and deployment**:
   - **Source**: GitHub Actions.
4. Push a commit to `main` (or run the workflow from **Actions** → **Deploy to GitHub Pages** → **Run workflow**).
5. After the workflow finishes, the site will be at:
   `https://<username>.github.io/Hover-gravity-dot-animation/`

(Replace `<username>` with your GitHub username.)
