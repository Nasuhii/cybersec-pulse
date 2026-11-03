# CyberSec Pulse 🛡️

<p align="center">
  <a href="https://obsidian.md"><img src="https://img.shields.io/badge/Obsidian-Plugin-7C3AED?logo=obsidian&logoColor=white" alt="Obsidian Plugin"></a>
  <a href="https://github.com/Nasuhii/cybersec-pulse/releases/latest"><img src="https://img.shields.io/github/v/release/Nasuhii/cybersec-pulse?color=10b981&label=Release" alt="Latest Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/Nasuhii/cybersec-pulse/stargazers"><img src="https://img.shields.io/github/stars/Nasuhii/cybersec-pulse?style=flat&color=yellow" alt="GitHub stars"></a>
  <a href="https://github.com/Nasuhii/cybersec-pulse/issues"><img src="https://img.shields.io/github/issues/Nasuhii/cybersec-pulse?color=orange" alt="GitHub issues"></a>
</p>

<p align="center">
  <b>Minimalist Cybersecurity Threat Radar, Sequential News Wire & 1-Click Vault Note Clipper for Obsidian.</b><br>
  <i>Sıfır dikkat dağınıklığı, zengin CVE istihbaratı ve tek tıkla kasanıza Anki kartlı not alma motoru.</i>
</p>

<p align="center">
  <a href="#-key-capabilities">⚡ Capabilities</a> •
  <a href="#-how-to-install-kurulum-rehberi">📦 Installation</a> •
  <a href="#-how-to-use">🚀 How to Use</a> •
  <a href="#️-settings--customization">⚙️ Settings</a> •
  <a href="#-türkçe-kurulum-özeti">🇹🇷 Türkçe Rehber</a> •
  <a href="https://github.com/Nasuhii/cybersec-pulse/releases/latest">📥 Download v1.0.3</a>
</p>

---

## 📑 Quick Navigation (Hızlı Bağlantılar)

- [⚡ Key Capabilities](#-key-capabilities)
- [🖥️ User Interface Overview](#️-user-interface-overview)
- [📦 How to Install (Kurulum Rehberi)](#-how-to-install-kurulum-rehberi)
  - [🌟 Method 1: Via BRAT (Recommended)](#-method-1-via-brat-recommended---automatic-updates)
  - [📂 Method 2: Manual Installation (Direct Download Links)](#-method-2-manual-installation-github-release)
  - [💻 Method 3: One-Line Terminal / Git Clone](#-method-3-one-line-terminal--git-clone-linux--macos--git-bash)
- [🚀 How to Use](#-how-to-use)
- [📝 Generated Note Format](#-generated-note-format)
- [⚙️ Settings & Customization](#️-settings--customization)
- [🇹🇷 Türkçe Kurulum Özeti](#-türkçe-kurulum-özeti)
- [📄 License & Author](#-license--author)

---

## ⚡ Key Capabilities

- 🔄 **Sequential Headline Rotator**: Breaking threat reports and security advisories rotate smoothly with an interactive linear progress bar.
- ⏸️ **Smart Pause on Reading**: Hovering over any card pauses rotation (`READING` mode) so you never lose your spot. Leaving resumes smoothly.
- 📋 **Synchronized Wire Feed**: Compact chronological live wire feed. The active rotated headline is highlighted and scrolled into view automatically.
- 📖 **In-App Distraction-Free Reader**: Read full article writeups directly inside Obsidian modal view without opening external browser tabs.
- 📥 **1-Click Vault Note Clipper**:
  - Save articles directly from the rotator, reader modal, or individual wire feed rows with a single click.
  - Automatically formats notes with YAML frontmatter, source metadata, detected **CVE IDs**, full extracted article body, threat analysis checklists, and **Obsidian-to-Anki flashcards** (`TARGET DECK: cybersec`).
  - **Live State Awareness**: Saved articles show a green checkmark (`Kaydedildi`). Clicking again opens the existing note directly in your editor!
- 🌐 **6 Verified Intelligence Feeds**:
  - [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog): Actively exploited vulnerabilities in the wild (Official JSON API).
  - [BleepingComputer](https://www.bleepingcomputer.com/): Breaking cybersecurity news, breaches, and ransomware alerts.
  - [The Hacker News (THN)](https://thehackernews.com/): Global infosec journalism and vulnerability coverage.
  - [PortSwigger Research](https://portswigger.net/research): Web application security and Burp Suite research papers.
  - [Reddit /r/netsec](https://www.reddit.com/r/netsec/): Community technical analyses and zero-day disclosures.
  - [USOM](https://www.usom.gov.tr/): Turkish National Cyber Incident Response Center alerts.
- 🔍 **Instant Filtering & CVE Search**: Filter streams with dedicated source chips or search for specific CVE numbers (e.g. `CVE-2026-`).
- 🎨 **Obsidian-Native Minimalist Aesthetic**: Designed to blend seamlessly with your Obsidian theme, adhering strictly to native CSS variables and Lucide icons.

---

## 🖥️ User Interface Overview

```text
┌─────────────────────────────────────────────────────────────┐
│ 🛡️ CYBERSEC PULSE             ● LIVE       [ ⏸ ]  [ 🔄 ]    │
├─────────────────────────────────────────────────────────────┤
│ ────────────────────────[Progress: 60%]──────────────────── │
│ [THN] · 2h ago                                 03 / 48 [‹][›]│
│ Critical Zero-Day Flaw Exploited in the Wild               │
│ Threat actors are actively weaponizing unpatched instances   │
│ of enterprise infrastructure...                             │
│ [CVE-2026-1044]              [📖 Oku]  [🔖 Not Al]  [↗ Web]  │
├─────────────────────────────────────────────────────────────┤
│ [ 🔍 Filtrele veya CVE ara...                             ] │
│ all · cisa · bleeping · thn · portswigger · netsec · usom   │
├─────────────────────────────────────────────────────────────┤
│ WIRE FEED                                          48 ITEMS │
│ ● [THN]    2h   Critical Zero-Day Flaw Exploited...   [🔖]  │
│   [CISA]   4h   CVE-2026-0812 Added to KEV Catalog    [✓]   │
│   [BLEEP]  5h   Healthcare Giant Discloses Ransomware [🔖]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 How to Install (Kurulum Rehberi)

You can install **CyberSec Pulse** using any of the three methods below:

### 🌟 Method 1: Via BRAT (Recommended - Automatic Updates)

The easiest method using the [Obsidian42 - BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin:

1. In Obsidian, open **Settings** (`Ctrl+,` or `Cmd+,`).
2. Go to **Community plugins** and ensure *Restricted mode* is turned **Off**.
3. Search for **BRAT** (by *TfTHacker*) and click **Install**, then **Enable**.
4. In Obsidian settings, open the **BRAT** tab on the left sidebar.
5. Click **Add Beta plugin** (under *Beta Plugin List*).
6. Enter this repository URL:
   ```text
   https://github.com/Nasuhii/cybersec-pulse
   ```
7. Click **Add Plugin**. BRAT will download and register CyberSec Pulse automatically.
8. Go back to **Community plugins** and turn on **CyberSec Pulse**!

---

### 📂 Method 2: Manual Installation (GitHub Release)

If you prefer not to use BRAT, download the 3 plugin files directly:

| File | Direct Download Link | Description |
|:---|:---:|:---|
| **`main.js`** | [📥 **Download `main.js`**](https://github.com/Nasuhii/cybersec-pulse/releases/download/1.0.3/main.js) | Main plugin logic & threat engine |
| **`manifest.json`** | [📥 **Download `manifest.json`**](https://github.com/Nasuhii/cybersec-pulse/releases/download/1.0.3/manifest.json) | Plugin identification & metadata |
| **`styles.css`** | [📥 **Download `styles.css`**](https://github.com/Nasuhii/cybersec-pulse/releases/download/1.0.3/styles.css) | Minimalist styles for light/dark themes |

> 🏷️ *View all version releases and notes:* [**Releases Page**](https://github.com/Nasuhii/cybersec-pulse/releases)

#### Installation Steps:
1. Locate your Obsidian Vault's plugins directory:
   - **Quick way**: In Obsidian, go to **Settings → Community plugins** and click the folder icon 📁 next to **Installed plugins**.
   - **Manual paths**:
     - **Windows**: `C:\Users\<YourUser>\<VaultName>\.obsidian\plugins\`
     - **macOS**: `/Users/<YourUser>/<VaultName>/.obsidian/plugins/`
     - **Linux**: `/home/<user>/<VaultName>/.obsidian/plugins/`
   > *Note: Folders starting with a dot (`.obsidian`) may be hidden by default. Press `Ctrl+H` (Linux/Windows) or `Cmd+Shift+.` (macOS) to view hidden files.*
2. Inside `plugins/`, create a new folder named `cybersec-pulse`.
3. Move the downloaded `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/cybersec-pulse/`.
4. In Obsidian → **Settings → Community plugins**, click the **Reload plugins** (🔄) button.
5. Find **CyberSec Pulse** in the list and toggle the switch **ON**.

---

### 💻 Method 3: One-Line Terminal / Git Clone (Linux / macOS / Git Bash)

If you have a terminal open in your vault directory:

```bash
# 1. Navigate to your vault's plugins folder
cd .obsidian/plugins

# 2. Clone the repository
git clone https://github.com/Nasuhii/cybersec-pulse.git cybersec-pulse
```

Then in Obsidian, reload community plugins and enable **CyberSec Pulse**.

---

## 🚀 How to Use

1. **Open CyberSec Pulse**:
   - Click the **Shield Icon (`🛡️`)** on the left ribbon.
   - Or open Command Palette (`Ctrl+P` / `Cmd+P`) and type `CyberSec Pulse: Open CyberSec Threat Radar`.
2. **Read Full Articles**:
   - Click the **`[📖 Oku]`** button on the rotating card to launch the modal reader.
   - In the reader, you can read the complete extracted article without ads or external popups.
3. **Clip to Vault**:
   - Click **`[🔖 Not Al]`** on any headline card, in the reader modal, or click the bookmark icon on any row in the wire list.
   - CyberSec Pulse automatically creates a clean markdown file under `Areas/CyberSecurity/Haberler/` (or your customized path).
   - Once saved, the icon turns into a green checkmark `[✓] Kaydedildi`.
   - Clicking `[✓]` opens the saved markdown note directly in Obsidian!
4. **Pause & Resume**:
   - Hover your mouse over the radar card to pause.
   - Or click the pause button `[ ⏸ ]` in the top header.
5. **Filter by Feed or Search CVE**:
   - Click on pills (`all`, `cisa`, `bleeping`, `thn`, `portswigger`, `netsec`, `usom`) to isolate streams.
   - Type in the search box to filter by title or specific CVE code.

---

## 📝 Generated Note Format

Each clipped article is saved with rich markdown, metadata tags, and integrated Anki flashcards:

```markdown
---
title: "Critical Zero-Day Under Active Exploitation"
source: "The Hacker News"
date: 2026-11-02
link: https://thehackernews.com/example-vulnerability-news
cves:
  - CVE-2026-1044
tags:
  - cybersec/intel
  - source/thn
  - vulnerability/CVE-2026-1044
---

TARGET DECK: cybersec

# 🛡️ Critical Zero-Day Under Active Exploitation

> [!INFO] 📌 Tehdit İstihbarat Özeti
> - **Kaynak**: The Hacker News
> - **Tarih**: 2026-11-02
> - **İlgili CVE**: `CVE-2026-1044`
> - **Orijinal Bağlantı**: [Haberi Kaynağında Aç](https://thehackernews.com/example-vulnerability-news)

---

## 📑 Makale İçeriği
... (Full web article extracted text) ...

---

## 🎯 Güvenlik ve İnceleme Notları
- [ ] Zafiyet etkilediği sistemler envanterde var mı?
- [ ] İlgili PoC / Exploit kodu yayınlandı mı?
- [ ] Vendor yama veya geçici azaltma (mitigation) adımları uygulandı mı?

---

## 🃏 Anki Kartları
START
Temel
TARGET DECK: cybersec
Ön: Critical Zero-Day Under Active Exploitation özeti ve CVE nedir?
Geri: CVE: CVE-2026-1044<br>Detay: ...
Tags: from_obsidian, cybersec, cve
END
```

---

## ⚙️ Settings & Customization

Navigate to **Settings → CyberSec Pulse**:

| Setting | Default | Description |
|---|---|---|
| **Save Folder** | `Areas/CyberSecurity/Haberler` | Destination vault directory for saved notes. Auto-creates folders if missing. |
| **Rotation Interval** | `300` sec (5 min) | Time in seconds before transitioning to the next news headline. |
| **Max Items per Feed** | `15` | Number of recent items to fetch per source (5 to 30). |
| **Auto Full Content** | `Enabled` | Automatically attempts to scrape and extract the complete web article text. |
| **Individual Feed Toggles** | `All ON` | Toggle specific intelligence feeds on/off (CISA, Bleeping, THN, etc.). |

---

## 🇹🇷 Türkçe Kurulum Özeti

### 1. BRAT ile Otomatik Kurulum (En Kolay)
- Obsidian'da [BRAT Eklentisini](https://github.com/TfTHacker/obsidian42-brat) kurun ve aktif edin.
- BRAT ayarlarından **Add Beta plugin** butonuna tıklayın.
- Depo adresini yapıştırın:
  ```text
  https://github.com/Nasuhii/cybersec-pulse
  ```
- **Add Plugin** butonuna basın ve ardından *Community plugins* ekranından **CyberSec Pulse**'ı açın.

### 2. Doğrudan Dosya İndirerek Manuel Kurulum
Aşağıdaki 3 dosyayı doğrudan indirin:
- 📥 [**`main.js` İndir**](https://github.com/Nasuhii/cybersec-pulse/releases/download/1.0.3/main.js)
- 📥 [**`manifest.json` İndir**](https://github.com/Nasuhii/cybersec-pulse/releases/download/1.0.3/manifest.json)
- 📥 [**`styles.css` İndir**](https://github.com/Nasuhii/cybersec-pulse/releases/download/1.0.3/styles.css)

Dosyaları kasanız içerisindeki `.obsidian/plugins/cybersec-pulse/` klasörüne yapıştırıp Obsidian'da eklentiyi aktifleştirin.

---

## 📄 License & Author

- **Lisans**: [MIT License](LICENSE)
- **Geliştirici & Yazar**: [Nasuhii](https://github.com/Nasuhii)
- **Hata Bildirimi & Destek**: [GitHub Issues](https://github.com/Nasuhii/cybersec-pulse/issues)
- **GitHub Deposu**: [github.com/Nasuhii/cybersec-pulse](https://github.com/Nasuhii/cybersec-pulse)
