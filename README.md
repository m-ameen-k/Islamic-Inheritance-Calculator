# ⚖️ Fara'id — علم الفرائض

### Shafi'i Inheritance Case-Preparation Tool

![Version](https://img.shields.io/badge/version-2.0-brightgreen)
![JavaScript](https://img.shields.io/badge/JS-ES6%2B-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

> **Under technical and scholarly validation. This tool is for education and
> case preparation only. Verify every result with a qualified Shafi'i fara'id
> scholar before distributing an estate.**

## Validation Status

The legacy JavaScript calculator is preserved in Git for reference, but its
calculation action is temporarily disabled while a testable TypeScript engine is
being developed.

- No calculation is represented as scholar-approved or legally valid.
- Internet research may only enter the research corpus as
  `PROVISIONAL — NOT YET VERIFIED FROM USER-PROVIDED KITAB`.
- Verified mode will stop when a required rule has not been verified from the
  user's supplied Shafi'i sources.
- Research mode will never be the default.

---

## Legacy Prototype Features

- ✅ **25 heirs** – including emancipators.
- 🚫 **Hajb demonstrations** – currently under rule-by-rule validation.
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
- 🧮 **Exact arithmetic rebuild in progress** – BigInt rational arithmetic and
  technical regression tests are being added.

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

## Test Cases

Worked inheritance examples are intentionally withheld from the authoritative
documentation until their rule sources and expected outcomes are reviewed.
Technical arithmetic tests do not prove fiqh correctness.

---

## 🔧 How to Use

1. Select **deceased gender**.
2. Enter **estate details**.
3. Choose **Madhab** (Shafi'i only for now).
4. Tap **heirs** to add them.
5. Calculation is temporarily disabled while the validated engine is rebuilt.
6. Click on **عصبة** labels to learn why a heir becomes a residuary.

---

## 🔒 Disclaimer

⚠️ **Under technical and scholarly validation.** This tool is for education and
case preparation only. Verify every result with a qualified Shafi'i fara'id
scholar before distributing an estate.

---

## 🤝 Contributing

Contributions welcome – open an issue or pull request.

---

## 📜 License

MIT – free to use, modify, and share with attribution.

---

**🌟 Star this repo if you find it useful!**
