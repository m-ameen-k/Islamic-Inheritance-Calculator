# ⚖️ Fara'id — علم الفرائض

### Islamic Inheritance Calculator (Shafi'i School)

![Version](https://img.shields.io/badge/version-2.0-brightgreen)
![JavaScript](https://img.shields.io/badge/JS-ES6%2B-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

> **Accurate, educational, and feature‑rich web app for calculating inheritance shares according to Shafi'i Fara'id rules.**

---

## ✨ Upgraded Features

- ✅ **25 heirs** – including emancipators.
- 🚫 **Complete Hajb (blocking)** – son blocks grandson, father blocks siblings, etc.
- 📐 **Awl (العول)** – automatic when shares exceed base.
- 🔄 **Radd (الرد)** – surplus returned when no `Asaba`.
- 👵 **Umariyyatayn (العمريتان)** – spouse + parents (no siblings) → mother gets ⅓ of remainder.
- 📊 **Tashih (التصحيح)** – scales shares to remove fractions.
- 💡 **Interactive Asaba explanation** – click any “عصبة” label for a popup rule (English, Arabic, Malayalam).
- 📖 **Detailed Asl steps** – shows _Tamathul_, _Tadakhul_, _Tawafuq_, or _Tabayun_.
- 💰 **Asset inputs** – cash, gold/silver (weight/price or total), property, debts, Zakat, bequest.
- 🌐 **Live metal prices** – fetch gold/silver price in any currency.
- 🌍 **Multi‑language** – English, العربية, മലയാളം.
- 🌓 **Dark / Light mode** + auto system preference.
- 💱 **Currency selector** – INR, USD, SAR, AED, GBP.
- 📘 **Educational tab** – explains Hajb, Awl, Radd, etc.
- 📱 **Fully responsive** – mobile, tablet, desktop.
- 🧮 **Strict integer math** – no floating‑point errors.

---

## 🚀 Live Demo

GitHub Pages:  
https://m-ameen-k.github.io/Islamic-Inheritance-Calculator/

---

## 📂 Project Structure

```text
Islamic-Inheritance-Calculator/
|
├── index.html       # ONLY the HTML structure
├── README.md        # Your excellent documentation
|
├── css/
|   └── style.css    # ONLY the CSS
|
└── js/
    ├── data.js      # ONLY the HEIRS list
    ├── engine.js    # ONLY the Math logic
    └── app.js       # ONLY UI logic
```
---

## 🧪 Example Cases

| Case                                   | Heirs                                                                                     | Shares                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------- |
| Husband, 1 daughter, father            | Husband ¼, daughter ½, father ¼ (asaba)                                                   | Asl = 4                       |
| Wife, mother, 2 full sisters           | Wife ¼, mother ⅙, sisters ⅔                                                               | Awl from 12 → 13              |
| Only husband and mother                | Husband ½, mother ⅓, remainder to mother (Radd)                                           | Asl = 6 → husband 3, mother 4 |
| Spouse + father + mother (no siblings) | Umariyyatayn: husband ½ → remainder ½ → mother gets ⅓ of remainder (1/6), father the rest | Asl = 6                       |

---

## 🔧 How to Use

1. Select **deceased gender**.
2. Enter **estate details**.
3. Choose **Madhab** (Shafi'i only for now).
4. Tap **heirs** to add them.
5. Click **Calculate** – view shares, blocked heirs, base problem steps, and monetary values.
6. Click on **عصبة** labels to learn why a heir becomes a residuary.

---

## 🔒 Disclaimer

⚠️ **Educational only.** Always consult a qualified scholar before dividing real inheritance.

---

## 🤝 Contributing

Contributions welcome – open an issue or pull request.

---

## 📜 License

MIT – free to use, modify, and share with attribution.

---

**🌟 Star this repo if you find it useful!**
