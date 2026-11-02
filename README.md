# CyberSec Pulse 🛡️

[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?logo=obsidian&logoColor=white)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Latest Release](https://img.shields.io/badge/Release-v1.0.2-emerald.svg)](https://github.com/Nasuhii/cybersec-pulse/releases)
[![GitHub stars](https://img.shields.io/github/stars/Nasuhii/cybersec-pulse?style=flat&color=yellow)](https://github.com/Nasuhii/cybersec-pulse/stargazers)

A minimalist, high-yield **Cybersecurity Threat Radar, Sequential News Wire, and 1-Click Vault Note Clipper** built natively for **Obsidian**.

Stay informed on zero-days, ransomware campaigns, and actively exploited vulnerabilities while conducting research, without leaving your Obsidian workspace.

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
  - **CISA KEV**: Actively exploited vulnerabilities in the wild (Official JSON API).
  - **BleepingComputer**: Breaking cybersecurity news, breaches, and ransomware alerts.
  - **The Hacker News (THN)**: Global infosec journalism and vulnerability coverage.
  - **PortSwigger Research**: Web application security and Burp Suite research papers.
  - **Reddit /r/netsec**: Community technical analyses and zero-day disclosures.
  - **USOM**: Turkish National Cyber Incident Response Center alerts.
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

The easiest and cleanest method using the **BRAT** (Beta Reviewer's Auto-update Tool) plugin:

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

If you prefer not to use BRAT:

1. Head over to the [GitHub Releases](https://github.com/Nasuhii/cybersec-pulse/releases/latest) page.
2. Download these **3 files** from the latest release:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Locate your Obsidian Vault's plugins directory:
   - **Quick way**: In Obsidian, go to **Settings → Community plugins** and click the small folder icon 📁 next to **Installed plugins**.
   - **Manual paths**:
     - **Windows**: `C:\Users\<YourUser>\<VaultName>\.obsidian\plugins\`
     - **macOS**: `/Users/<YourUser>/<VaultName>/.obsidian/plugins/`
     - **Linux**: `/home/<user>/<VaultName>/.obsidian/plugins/`
   > *Note: Folders starting with a dot (`.obsidian`) may be hidden by default in your file manager. Press `Ctrl+H` (Linux/Windows) or `Cmd+Shift+.` (macOS) to view hidden files.*
4. Inside `plugins/`, create a new folder named `cybersec-pulse`.
5. Move the downloaded `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/cybersec-pulse/`.
6. Return to Obsidian → **Settings → Community plugins**, click the **Reload plugins** (🔄) button.
7. Find **CyberSec Pulse** in the list and toggle the switch **ON**.

---

### 💻 Method 3: One-Line Terminal / Git Clone (Linux / macOS / Git Bash)

If you have a terminal open in your vault directory:

```bash
# Navigate to your vault plugins directory
cd .obsidian/plugins

# Clone the repository
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
link: https://thehackernews.com/...
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
> - **Orijinal Bağlantı**: [Haberi Kaynağında Aç](https://thehackernews.com/...)

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

1. **BRAT Eklentisi ile Kurulum (En Kolayı)**:
   - Obsidian içinde *BRAT* eklentisini kurun ve etkinleştirin.
   - BRAT ayarlarından **Add Beta plugin** butonuna tıklayın.
   - `https://github.com/Nasuhii/cybersec-pulse` adresini yapıştırıp ekleyin.
   - *Community plugins* sekmesinden **CyberSec Pulse**'ı aktif edin.
2. **Manuel Kurulum (GitHub Releases)**:
   - [Releases](https://github.com/Nasuhii/cybersec-pulse/releases/latest) sayfasından `main.js`, `manifest.json` ve `styles.css` dosyalarını indirin.
   - Obsidian kasanızın içindeki `.obsidian/plugins/` klasörüne gidin (gizli klasördür, görünmüyorsa gizli dosyaları gösterin).
   - Burada `cybersec-pulse` adında yeni bir klasör oluşturun ve bu 3 dosyayı içine yapıştırın.
   - Obsidian'da *Community plugins* ekranında listeyi yenileyip eklentiyi açın.
3. **Kullanım**: Sol paneldeki kalkan (`🛡️`) simgesine tıklayarak canlı siber güvenlik akışını başlatabilir, `Not Al` butonuyla tek tıkla kasanıza Anki kartlı not alabilirsiniz.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Created and maintained by [Nasuhii](https://github.com/Nasuhii).
