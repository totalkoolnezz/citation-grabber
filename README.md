# 📚 CitationGrabber

A Chrome extension that generates instant MLA, APA, and Chicago citations from any webpage — with one click.

Built for students. No sign-up, no ads, fully offline after install.

---

## ✨ Features

- **MLA 9th**, **APA 7th**, **Chicago 17th** citation formats
- Auto-detects title, author, publish date, and site name from page metadata
- In-text citation and footnote generator
- One-click copy to clipboard
- Save up to 50 citations across sessions
- Warns you when fields (like author or date) couldn't be found
- Works on news sites, Wikipedia, academic sources, most web pages

---

## 🚀 Install in Chrome (no Chrome Web Store needed)

### Step 1 — Download the extension

Either:
- Clone this repo: `git clone https://github.com/YOUR_USERNAME/citation-grabber.git`
- Or click **Code → Download ZIP** and unzip it

### Step 2 — Load into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `citation-grabber` folder you downloaded

That's it. The 📚 icon will appear in your Chrome toolbar.

> **Note:** You need to add placeholder icon images (see below) or the extension still works — Chrome just shows a default icon.

---

## 🖼 Adding icons (optional but recommended)

The extension expects three PNG icons in the `icons/` folder:
- `icons/icon16.png` — 16×16 px
- `icons/icon48.png` — 48×48 px
- `icons/icon128.png` — 128×128 px

You can make them in any image editor, or use any free icon from [flaticon.com](https://flaticon.com) (a book or graduation cap works well). Export at those exact sizes as PNG.

If the `icons/` folder is missing or empty, Chrome will load the extension with a default grey icon — everything else works fine.

---

## 📖 How to use

1. Navigate to any webpage you want to cite
2. Click the 📚 CitationGrabber icon in your toolbar
3. Choose your citation style: **MLA**, **APA**, or **Chicago**
4. Click **Generate Citation**
5. Click **Copy** to copy the full citation, or copy the in-text citation separately
6. Click **Save to list** to store it for later

---

## ⚠ Accuracy note

CitationGrabber reads the page's HTML metadata (Open Graph tags, meta tags, schema markup). Most news sites, Wikipedia, and academic pages expose this data correctly. Some pages may be missing author or date info — the extension will warn you when this happens so you can fill it in manually.

Always verify citations before submitting academic work.

---

## 📁 File structure

```
citation-grabber/
├── manifest.json    — Chrome extension config
├── popup.html       — UI the user sees
├── popup.js         — UI logic, storage, copy/save
├── citations.js     — MLA / APA / Chicago formatting functions
├── content.js       — Scrapes page metadata
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---
## 🔮 Possible future features

- Export full saved list as `.txt` or `.docx`
- Google Docs integration
- Support for journal articles (DOI lookup)
- Right-click to cite selected text
- Works bibliography / reference page builder

---

## 📄 License

MIT — free to use, modify, and share.
