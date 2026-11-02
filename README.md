# CyberSec Pulse

[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?logo=obsidian&logoColor=white)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v1.0.0-emerald.svg)](https://github.com/Nasuhii/cybersec-pulse/releases)

A minimalist, high-yield cybersecurity threat radar, sequential news rotator, and one-click vault note clipper for **Obsidian**.

---

## ⚡ Core Features

- **Sequential Headline Rotator**: Breaking threat reports and security advisories rotate automatically at configurable intervals (default: 6s) with a linear micro-progress bar.
- **Smart Pause on Reading**: Hovering over the rotator card instantly pauses the cycle (`READING` mode) so you never lose context or rush. Moving your cursor resumes the feed smoothly.
- **Minimalist Design Language**: Free from generic AI templates, exaggerated drop shadows, and emoji clutter. Built with clean typography, monospace metadata tags, and Obsidian's native Lucide iconography.
- **Synchronized Wire Feed**: A compact chronological news wire underneath the rotator. As articles rotate, the corresponding row in the wire list highlights and scrolls smoothly into view.
- **Multi-Stream Intelligence**:
  - **CISA KEV**: Official JSON catalog of actively exploited vulnerabilities in the wild.
  - **BleepingComputer**: Breaking ransomware alerts, breaches, and critical advisories.
  - **The Hacker News (THN)**: Global infosec journalism and vulnerability coverage.
  - **PortSwigger Research**: In-depth web security research from the Burp Suite team.
  - **Reddit /r/netsec**: Community technical analyses and zero-day disclosures.
  - **USOM**: Official national cyber incident response alerts (TR CERT).
- **1-Click & Auto Vault Note Clipper**: Save threat reports automatically or on-demand directly to your vault (`Areas/CyberSecurity/Haberler/`) formatted with `TARGET DECK: cybersec`, YAML frontmatter, full web article extraction, detected CVE codes, source URL, threat review checklists, and auto-generated Anki flashcards.
- **Background Intelligence Auto-Sync**: Automatically pulls new threat feeds in the background and writes them as Markdown notes into your vault without lifting a finger.
- **Distraction-Free In-App Reader**: Read full writeups directly inside Obsidian without switching windows.

---

## 🖥️ User Interface Overview

```text
┌─────────────────────────────────────────────────────────────┐
│ CYBERSEC PULSE                ● LIVE       [ ⏸ ]  [ 🔄 ]    │
├─────────────────────────────────────────────────────────────┤
│ ────────────────────────[Progress: 60%]──────────────────── │
│ [THN] · 2h ago                                 03 / 48 [‹][›]│
│ Cisco Patches Critical Zero-Day Under Active Exploitation   │
│ A new zero-day flaw impacting enterprise switches has been   │
│ observed in targeted intrusions...                          │
│ [CVE-2026-1044]              [read]  [save]  [↗]            │
├─────────────────────────────────────────────────────────────┤
│ [ filter feed or cve...                                   ] │
│ all · cisa · bleeping · thn · portswigger · netsec · usom   │
├─────────────────────────────────────────────────────────────┤
│ WIRE FEED                                          48 ITEMS │
│ ● [THN]    2h   Cisco Patches Critical Zero-Day...          │
│   [CISA]   4h   CVE-2026-0812 Added to KEV Catalog          │
│   [BLEEP]  5h   Healthcare Giant Discloses Ransomware Impact│
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Method 1: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Inside your Obsidian vault, navigate to `.obsidian/plugins/`.
3. Create a directory named `cybersec-pulse/` and paste the three files into it.
4. In Obsidian, go to **Settings → Community plugins** and enable **CyberSec Pulse**.

### Method 2: Via BRAT (Obsidian Beta Reviewer's Auto-update Tool)
1. Install the **BRAT** plugin in Obsidian.
2. In BRAT settings, choose **Add Beta plugin**.
3. Paste repository URL: `https://github.com/Nasuhii/cybersec-pulse`
4. Enable the plugin.

---

## ⚙️ Configuration

In **Settings → CyberSec Pulse**:
- **Save Folder**: Custom destination path for clipped notes.
- **Rotation Interval**: Headline display duration before transitioning (3 to 15 seconds).
- **Max Items per Feed**: Number of latest items fetched per intelligence source (5 to 30).
- **Stream Toggles**: Enable or disable specific intelligence feeds individually.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Created and maintained by [Nasuhi](https://github.com/Nasuhii).
