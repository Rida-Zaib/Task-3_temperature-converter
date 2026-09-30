# Tapish — Temperature Converter + Live Weather

This is a static website (HTML, CSS, vanilla JavaScript). No build step, no
`npm install`, nothing extra needed. Just 3 files:

```
index.html   → page structure
style.css    → design and animated background
script.js    → converter logic + live weather (Open-Meteo API)
```

No API key is needed for live weather — Open-Meteo is completely free.

---

## 1. Running it on your computer

You can open `index.html` directly by double-clicking it, but the **"My
location"** button and the weather fetch are sometimes blocked by the
browser when opened via `file://`. So the best approach is to run a small
local server:

**Option A — no install needed (if Node.js is installed):**
```bash
cd tapish
npx serve
```
Open the link the terminal prints (usually `http://localhost:3000`) in your browser.

**Option B — in VS Code:**
1. Open the `tapish` folder in VS Code.
2. Install the "Live Server" extension (if you don't have it).
3. Right-click `index.html` → **Open with Live Server**.

With either option, "My location" and the weather fetch will both work correctly.

---

## 2. Pushing to GitHub

```bash
cd tapish
git init
git add .
git commit -m "Tapish - temperature converter with live weather"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```
(First create a new empty repo on github.com, without adding a README or .gitignore.)

---

## 3. Deploying on Vercel

1. Log in to vercel.com with GitHub.
2. Click **Add New → Project** and import your repo.
3. This is a plain static site, so there's no Build Command or Output
   directory to set — leave everything as default.
4. Click **Deploy**. You'll get a live link in about a minute
   (something like `tapish.vercel.app`).
5. From then on, every `git push` will trigger an automatic redeploy on Vercel.

This site has no environment variables or secret keys, so there's nothing
to add in Vercel's Environment Variables section.

---

## What's included

- **Convert card:** converts between Celsius, Fahrenheit, and Kelvin.
  Invalid input and values below absolute zero show a friendly error message.
- **Live weather card:** search a city or press "My location" — shows current
  temperature, feels-like, humidity, wind, a line chart for the next 24 hours,
  and a high/low chart for the next 7 days. Data comes from [Open-Meteo](https://open-meteo.com/).
- **Animated background:** the page's colour shifts with the current
  temperature (cold = blue, warm = red), with soft glowing blobs drifting
  slowly in the background.

The default city is set in the `DEFAULT_PLACE` variable in `script.js`
(currently Lahore) — change it to any other city if you like.
