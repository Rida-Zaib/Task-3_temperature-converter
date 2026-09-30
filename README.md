# Tapish — Temperature Converter + Live Weather

Ek static website hai (HTML, CSS, vanilla JavaScript). Koi build step, koi
npm install, kuch nahi chahiye. Sirf 3 files hain:

```
index.html   → page ka structure
style.css    → design aur animated background
script.js    → converter logic + live weather (Open-Meteo API)
```

Live weather ke liye koi API key nahi chahiye, Open-Meteo bilkul free hai.

---

## 1. Apne computer pe run karna

`index.html` ko seedha double-click karke bhi khol sakti ho, lekin **"My
location"** button aur weather fetch kabhi kabhi `file://` se khulne par
browser block kar deta hai. Isliye best tareeqa ek chhota local server
chalana hai:

**Option A — bina kuch install kiye (agar Node.js laga hua hai):**
```bash
cd tapish
npx serve
```
Terminal mein jo link aaye (usually `http://localhost:3000`), wo browser mein kholo.

**Option B — VS Code mein:**
1. VS Code mein `tapish` folder kholo.
2. Extensions mein "Live Server" install karo (agar nahi hai).
3. `index.html` pe right-click karo → **Open with Live Server**.

Dono tareeqon mein "My location" aur weather fetch bilkul sahi chalenge.

---

## 2. GitHub pe push karna

```bash
cd tapish
git init
git add .
git commit -m "Tapish - temperature converter with live weather"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```
(Pehle github.com pe ek naya empty repo bana lena, README/gitignore add kiye bagair.)

---

## 3. Vercel pe deploy karna

1. vercel.com pe GitHub se login karo.
2. **Add New → Project** dabao aur apna repo import karo.
3. Yeh plain static site hai, koi Build Command ya Output directory set karne
   ki zarurat nahi — sab kuch default chhod do.
4. **Deploy** dabao. Ek minute mein live link mil jayega
   (jaise `tapish.vercel.app`).
5. Aage jab bhi `git push` karogi, Vercel khud dobara deploy kar dega.

Is site mein koi environment variable / secret key nahi lagti, isliye
Vercel Environment Variables section mein kuch bhi daalne ki zarurat nahi.

---

## Kya kya hai

- **Convert card:** Celsius, Fahrenheit, Kelvin ke beech convert karti hai.
  Ghalat input aur absolute zero se neeche wali values pe friendly error
  aata hai.
- **Live weather card:** shehar search karo ya "My location" dabao — current
  temperature, feels-like, humidity, wind, agle 24 ghante ka line chart, aur
  agle 7 din ka high/low chart dikhata hai. Data [Open-Meteo](https://open-meteo.com/) se aata hai.
- **Animated background:** page ka rang current temperature ke hisab se
  badalta hai (thanda = neela, garam = laal), aur peeche halke se glowing
  blobs dheeme dheeme move karte hain.

Default city `script.js` ke `DEFAULT_PLACE` variable mein set hai (abhi
Lahore hai) — chahe to koi aur shehar daal do.
