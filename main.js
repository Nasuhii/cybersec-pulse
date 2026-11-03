const {
  Plugin,
  ItemView,
  PluginSettingTab,
  Setting,
  Notice,
  Modal,
  requestUrl,
  normalizePath,
  setIcon
} = require('obsidian');

const VIEW_TYPE_CYBERSEC = 'cybersec-pulse-view';

const DEFAULT_SETTINGS = {
  saveFolder: 'Areas/CyberSecurity/Haberler',
  rotationIntervalSec: 300,
  maxItemsPerFeed: 15,
  defaultSortBy: 'rank',
  autoSaveEnabled: false,
  autoSaveLimit: 10,
  autoSaveOnlyCVE: false,
  autoSaveMinRank: 8.5,
  fetchFullContent: true,
  enableCISA: true,
  enableBleeping: true,
  enableTHN: true,
  enablePortSwigger: true,
  enableNetsec: true,
  enableUSOM: true
};

const FEEDS = [
  {
    id: 'cisa',
    name: 'CISA KEV',
    code: 'cisa',
    type: 'json',
    url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
  },
  {
    id: 'bleeping',
    name: 'BleepingComputer',
    code: 'bleeping',
    type: 'rss',
    url: 'https://www.bleepingcomputer.com/feed/'
  },
  {
    id: 'thn',
    name: 'The Hacker News',
    code: 'thn',
    type: 'rss',
    url: 'https://feeds.feedburner.com/TheHackersNews'
  },
  {
    id: 'portswigger',
    name: 'PortSwigger',
    code: 'portswigger',
    type: 'rss',
    url: 'https://portswigger.net/research/rss'
  },
  {
    id: 'netsec',
    name: 'r/netsec',
    code: 'netsec',
    type: 'rss',
    url: 'https://www.reddit.com/r/netsec/.rss'
  },
  {
    id: 'usom',
    name: 'USOM',
    code: 'usom',
    type: 'rss',
    url: 'https://www.usom.gov.tr/rss/tehdit.rss'
  }
];

// Helper: Extract clean domain name for Hacker News style links
function extractDomain(url) {
  try {
    if (!url) return '';
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

// ==========================================================================
// SİBER GÜVENLİK ÖĞRENCİSİ ÖNCELİK VE SIRALAMA SİSTEMİ (RANK: 1.0 - 10.0)
// Bir siber güvenlik öğrencisinin kesinlikle okuması / labda incelemesi
// gereken teknik zafiyet mekanizmalarına yüksek puan verirken; kurumsal PR,
// şirket fonlamaları ve borsa haberlerini filtreler.
// ==========================================================================
function calculateStudentRank(article) {
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const text = `${title} ${desc}`;
  const sourceId = (article.sourceId || '').toLowerCase();
  const cves = article.cves || [];

  let score = 5.0; // Temel başlangıç puanı
  const reasons = [];
  const tags = [];

  // 1. Kaynak Güvenilirliği & Eğitim Önceliği
  if (sourceId === 'cisa') {
    score += 2.5; // CISA KEV: Doğada aktif istismar ediliyor (In-The-Wild)
    reasons.push('CISA KEV: Doğada aktif sömürülen zafiyet (Pentest/SOC için zorunlu)');
    tags.push('CISA KEV');
  } else if (sourceId === 'portswigger') {
    score += 2.4; // PortSwigger Research: Web güvenlik dünyasının altın standardı
    reasons.push('PortSwigger: İleri Düzey Web Zafiyeti & Burp Pentest Araştırması');
    tags.push('Web Pentest');
  } else if (sourceId === 'netsec') {
    score += 1.6; // r/netsec: Teknik analizler ve exploit PoC'leri
    reasons.push('r/netsec: Derin Teknik Bildiri & PoC');
    tags.push('NetSec');
  } else if (sourceId === 'usom') {
    score += 1.4; // USOM: Ulusal kritik altyapı tehdidi
    reasons.push('USOM: Ulusal Tehdit & Kritik Bildirim');
    tags.push('USOM');
  } else if (sourceId === 'bleeping' || sourceId === 'thn') {
    score += 0.5;
  }

  // 2. Resmi CVE Varlığı (Resmi Zafiyet)
  if (cves.length > 0) {
    score += 1.2;
    tags.push(`${cves.length} CVE`);
  }

  // 3. Siber Güvenlik Öğrencisi Müfredatı & Uygulamalı Pentest Başlıkları (+2.0 ila +2.8 puan)
  // RCE & Uzaktan Kod Yürütme (En Yüksek Öncelik)
  if (/\b(rce|remote code execution|command injection|arbitrary code execution|code execution|uzaktan kod y[uü]r[uü]tme)\b/i.test(text)) {
    score += 2.6;
    reasons.push('Kritik RCE: Uzaktan Kod Yürütme Mekanizması');
    tags.push('RCE');
  }

  // Temel Web Pentest Zafiyetleri (SQLi, XSS, SSRF, CSRF, IDOR, LFI/RFI, Deserialization, SSTI, Auth Bypass)
  if (/\b(sql injection|sqli|cross-site scripting|xss|ssrf|server-side request forgery|csrf|idor|insecure direct object|path traversal|directory traversal|local file inclusion|lfi|rfi|ssti|template injection|deserialization|auth bypass|authentication bypass|broken access control|session hijacking)\b/i.test(text)) {
    score += 2.3;
    reasons.push('Temel Web & Zafiyet Mekanizması (Web Pentest Müfredatı)');
    tags.push('Web Exploit');
  }

  // Bellek Bozulması, Düşük Seviye & Yetki Yükseltme (Buffer Overflow, PrivEsc, Zero-day)
  if (/\b(zero-day|0-day|zero day|sıfır[- ]gün|buffer overflow|heap overflow|use-after-free|uaf|memory corruption|privilege escalation|privesc|yetki y[uü]kseltme|local privilege escalation|lpe|kernel exploit)\b/i.test(text)) {
    score += 2.2;
    reasons.push('Sıfır-Gün / Bellek Bozulması / Yetki Yükseltme');
    tags.push('PrivEsc/0-Day');
  }

  // Çalışan Exploit / PoC / Silahlandırılmış Kod
  if (/\b(poc|proof of concept|exploit released|weaponized|metasploit|nuclei|reverse shell|web shell|exploit script|github repository)\b/i.test(text)) {
    score += 1.8;
    reasons.push('Çalışan PoC / İstismar Kodu Yayında (Lab Analizine Uygun)');
    tags.push('PoC Mevcut');
  }

  // Kurumsal Ağ, Active Directory & Protokol Analizi
  if (/\b(active directory|kerberos|domain controller|smb|ntlm|golden ticket|silver ticket|pass-the-hash|bloodhound|ldap|lateral movement|pivoting|tunneling|c2|command and control|cobalt strike|ransomware|wireshark|packet)\b/i.test(text)) {
    score += 1.6;
    reasons.push('Kurumsal Ağ, AD & Protokol Analizi');
    tags.push('AD/Network');
  }

  // 4. Öğrenci Dikkatini Dağıtan Düşük Öncelikli Haberler (-2.0 ila -3.5 puan)
  // Şirket finansı, fonlama, şirket satın almaları, hisse senetleri (Teknik değeri olmayan PR bültenleri)
  if (/\b(raises|funding|series [a-d]|valuation|\$\d+ million|\$\d+ billion|acquires|acquisition|merger|ipo|quarterly earnings|revenue grew|venture capital|stock plunged|stock surges|antitrust lawsuit|patent infringement|legal battle|ceo steps down|appointed ceo)\b/i.test(text)) {
    score -= 3.5;
    reasons.push('Kurumsal Finans / Şirket PR Haberi (Düşük Teknik Öncelik)');
    tags.push('Sektörel PR');
  }

  // Regülasyon ve bürokrasi duyuruları (Teknik zafiyet veya exploit içermiyorsa)
  if (/\b(white house|executive order|eu parliament|senate committee|gdpr fine|compliance audit|policy framework)\b/i.test(text) && !/\b(cve|vulnerability|exploit|rce)\b/i.test(text)) {
    score -= 2.0;
    reasons.push('Bürokratik / Regülasyon Duyurusu');
  }

  // 1.0 ile 10.0 arasında sınırla
  score = Math.max(1.0, Math.min(10.0, score));
  score = Math.round(score * 10) / 10;

  let tier = 'medium';
  let tierLabel = 'FAYDALI';
  if (score >= 8.5) {
    tier = 'must-read';
    tierLabel = '🔥 MUST-READ (ZORUNLU)';
  } else if (score >= 7.0) {
    tier = 'high';
    tierLabel = '⚡ YÜKSEK ÖNCELİK';
  } else if (score < 5.0) {
    tier = 'low';
    tierLabel = '💤 DÜŞÜK ÖNCELİK';
  }

  const primaryReason = reasons.length > 0 ? reasons.slice(0, 2).join(' · ') : 'Genel Güvenlik Tehdidi';

  return {
    score,
    tier,
    tierLabel,
    reason: primaryReason,
    tags: tags.slice(0, 3)
  };
}

// Helper: Öğrenci için tavsiye cümlesi
function getStudentRecommendation(rank) {
  if (rank.score >= 8.5) {
    return 'Bu konu vahşi doğada aktif sömürülen veya temel exploit zincirine (RCE, Auth Bypass, CISA KEV) dayanan kritik bir gelişmedir. Bir siber güvenlik öğrencisinin teoriyi geçip lab ortamında (Burp Suite, Wireshark, Metasploit) zafiyet mekanizmasını kesinlikle incelemesi önerilir.';
  } else if (rank.score >= 7.0) {
    return 'Önemli teknik ayrıntılar ve pratik istismar/savunma mekanizmaları barındırmaktadır. SOC analizi veya web pentest çalışmalarınızda karşıt-önlem (mitigation) ve tespit (detection) yöntemlerini incelemeniz tavsiye edilir.';
  } else if (rank.score >= 5.0) {
    return 'Genel tehdit farkındalığı ve sektör takibi için okunabilir orta öncelikli bir gelişmedir.';
  } else {
    return 'Teknik istismar veya zafiyet analizi barındırmayan kurumsal/finansal bir haberdir. Teknik çalışma zamanınızı daha yüksek öncelikli (8.5+) zafiyet analizlerine ayırmanız önerilir.';
  }
}

class CyberSecPulsePlugin extends Plugin {
  async onload() {
    console.log('[CyberSec Pulse] Plugin loaded.');
    await this.loadSettings();

    this.registerView(VIEW_TYPE_CYBERSEC, (leaf) => new CyberSecPulseView(leaf, this));

    this.addRibbonIcon('shield', 'CyberSec Pulse: Threat Radar', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-cybersec-pulse-panel',
      name: 'Open CyberSec Pulse Radar',
      callback: () => this.activateView()
    });

    this.addCommand({
      id: 'save-current-article',
      name: 'Mevcut Haberi Not Olarak Kaydet (Save Current Article to Vault)',
      callback: async () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CYBERSEC);
        if (leaves.length > 0 && leaves[0].view) {
          const view = leaves[0].view;
          const article = view.filteredArticles[view.currentIndex];
          if (article) {
            await saveArticleAsNote(this.app, this, article, false);
          }
        }
      }
    });

    this.addCommand({
      id: 'save-all-feeds-to-vault',
      name: 'Tüm Haber Akışını Vault\'a Not Olarak Kaydet (Auto-Clip All)',
      callback: async () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CYBERSEC);
        if (leaves.length > 0 && leaves[0].view) {
          await leaves[0].view.saveAllArticles(leaves[0].view.filteredArticles, false);
        } else {
          await this.autoFetchAndSaveAll(false);
        }
      }
    });

    this.addCommand({
      id: 'fetch-and-auto-save',
      name: 'Haberleri Yenile ve Otomatik Not Al (Refresh & Auto-Save)',
      callback: async () => {
        await this.autoFetchAndSaveAll(false);
      }
    });

    this.addSettingTab(new CyberSecPulseSettingTab(this.app, this));

    // Periodic background auto-sync (every 30 minutes)
    this.registerInterval(
      window.setInterval(async () => {
        if (this.settings.autoSaveEnabled) {
          await this.autoFetchAndSaveAll(true);
        }
      }, 30 * 60 * 1000)
    );
  }

  async autoFetchAndSaveAll(isAuto = false) {
    try {
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CYBERSEC);
      if (leaves.length > 0 && leaves[0].view) {
        await leaves[0].view.fetchAllFeeds();
      } else {
        // Run background fetch when sidebar panel is not open
        const articles = [];
        for (const feed of FEEDS) {
          if (!this.isFeedEnabled(feed.id)) continue;
          try {
            if (feed.type === 'json' && feed.id === 'cisa') {
              const res = await requestUrl({ url: feed.url });
              const data = res.json;
              if (data && data.vulnerabilities) {
                const items = data.vulnerabilities.slice(-this.settings.maxItemsPerFeed).reverse();
                items.forEach(v => {
                  const art = {
                    id: v.cveID,
                    title: `${v.cveID}: ${v.vulnerabilityName || v.shortDescription.substring(0, 70)}`,
                    description: v.shortDescription + (v.requiredAction ? ` (Action: ${v.requiredAction})` : ''),
                    link: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
                    source: feed.name,
                    sourceId: feed.id,
                    sourceCode: feed.code,
                    date: v.dateAdded,
                    cves: [v.cveID]
                  };
                  art.studentRank = calculateStudentRank(art);
                  articles.push(art);
                });
              }
            } else if (feed.type === 'rss') {
              const res = await requestUrl({ url: feed.url });
              const parser = new DOMParser();
              const xml = parser.parseFromString(res.text, 'text/xml');
              const itemNodes = xml.querySelectorAll('item, entry');
              const limit = Math.min(itemNodes.length, this.settings.maxItemsPerFeed);
              for (let i = 0; i < limit; i++) {
                const node = itemNodes[i];
                const title = node.querySelector('title')?.textContent?.trim() || 'Untitled';
                let link = node.querySelector('link')?.textContent?.trim() || '';
                if (!link && node.querySelector('link')?.getAttribute('href')) {
                  link = node.querySelector('link').getAttribute('href');
                }
                const rawDesc = node.querySelector('description, summary, content')?.textContent?.trim() || '';
                const cleanDesc = sanitizeSnippet(rawDesc, 180);
                const pubDate = node.querySelector('pubDate, updated, dc\\:date')?.textContent?.trim() || new Date().toISOString();
                const cveMatches = (title + ' ' + rawDesc).match(/CVE-\d{4}-\d{4,7}/gi) || [];
                const uniqueCVEs = [...new Set(cveMatches.map(c => c.toUpperCase()))];
                const art = {
                  id: link || title,
                  title,
                  description: cleanDesc,
                  link,
                  source: feed.name,
                  sourceId: feed.id,
                  sourceCode: feed.code,
                  date: pubDate,
                  cves: uniqueCVEs
                };
                art.studentRank = calculateStudentRank(art);
                articles.push(art);
              }
            }
          } catch (e) {
            console.warn(`[CyberSec Pulse] ${feed.name} background fetch failed:`, e);
          }
        }

        // Sort by Student Rank descending
        articles.sort((a, b) => (b.studentRank?.score || 0) - (a.studentRank?.score || 0));

        const limit = this.settings.autoSaveLimit || 10;
        let savedCount = 0;
        for (const article of articles.slice(0, limit)) {
          if (this.settings.autoSaveOnlyCVE && (!article.cves || article.cves.length === 0)) continue;
          if (this.settings.autoSaveMinRank && article.studentRank?.score < this.settings.autoSaveMinRank) continue;
          const saved = await saveArticleAsNote(this.app, this, article, true);
          if (saved) savedCount++;
        }
        if (savedCount > 0) {
          new Notice(`🛡️ CyberSec Pulse: ${savedCount} yeni tehdit haberi otomatik not alındı!`);
        }
      }
    } catch (err) {
      console.warn('[CyberSec Pulse] Auto-sync error:', err);
    }
  }

  isFeedEnabled(feedId) {
    if (feedId === 'cisa') return this.settings.enableCISA;
    if (feedId === 'bleeping') return this.settings.enableBleeping;
    if (feedId === 'thn') return this.settings.enableTHN;
    if (feedId === 'portswigger') return this.settings.enablePortSwigger;
    if (feedId === 'netsec') return this.settings.enableNetsec;
    if (feedId === 'usom') return this.settings.enableUSOM;
    return true;
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_CYBERSEC)[0];

    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        await rightLeaf.setViewState({
          type: VIEW_TYPE_CYBERSEC,
          active: true
        });
        leaf = rightLeaf;
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CYBERSEC);
    for (const leaf of leaves) {
      if (leaf.view && typeof leaf.view.startRotatorTimer === 'function') {
        leaf.view.startRotatorTimer();
      }
    }
  }
}

class CyberSecPulseView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.articles = [];
    this.filteredArticles = [];
    this.activeFilter = 'all';
    this.sortBy = this.plugin.settings.defaultSortBy || 'rank'; // 'rank' or 'date'
    this.searchQuery = '';
    this.isLoading = false;

    // Sequential rotator state
    this.currentIndex = 0;
    this.isPaused = false;
    this.isHovered = false;
    this.progress = 0;
    this.timerInterval = null;
  }

  getViewType() {
    return VIEW_TYPE_CYBERSEC;
  }

  getDisplayText() {
    return 'CyberSec Pulse';
  }

  getIcon() {
    return 'shield';
  }

  async onOpen() {
    this.buildUI();
    await this.fetchAllFeeds();
    this.startRotatorTimer();
  }

  onClose() {
    this.stopRotatorTimer();
    return super.onClose();
  }

  buildUI() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('cybersec-pulse-container');

    // 1. Hacker News Style Header Bar
    const header = container.createEl('div', { cls: 'cybersec-pulse-header' });
    const topBar = header.createEl('div', { cls: 'cybersec-pulse-topbar' });

    // Brand & Status (Classic [CP] Logo + Title + Status)
    const brand = topBar.createEl('div', { cls: 'cybersec-pulse-brand' });
    const logoBox = brand.createEl('span', { cls: 'cybersec-hn-logo', text: 'CP' });
    logoBox.title = 'CyberSec Pulse: Threat Radar & Student Priority Engine';

    brand.createEl('span', { cls: 'cybersec-pulse-title', text: 'CYBERSEC PULSE' });

    this.statusEl = brand.createEl('div', { cls: 'cybersec-pulse-status' });
    this.statusDot = this.statusEl.createEl('span', { cls: 'cybersec-pulse-status-dot' });
    this.statusText = this.statusEl.createEl('span', { text: 'LIVE' });

    // Header Controls
    const controls = topBar.createEl('div', { cls: 'cybersec-pulse-controls' });

    // Sort Toggle Button (Rank vs Date)
    this.sortBtn = controls.createEl('button', {
      cls: 'cybersec-hn-btn cybersec-sort-btn',
      attr: { 'aria-label': 'Sıralama: Öğrenci Puanı veya Tarih' },
      text: this.sortBy === 'rank' ? '▲ RANK' : '🕒 DATE'
    });
    this.sortBtn.onclick = () => this.toggleSort();

    // Auto-advance toggle button
    this.pauseBtn = controls.createEl('button', {
      cls: 'cybersec-hn-btn cybersec-icon-btn',
      attr: { 'aria-label': 'Dönüşü Duraklat / Başlat' }
    });
    setIcon(this.pauseBtn, 'pause');
    this.pauseBtn.onclick = () => this.togglePause();

    // Refresh button
    const refreshBtn = controls.createEl('button', {
      cls: 'cybersec-hn-btn cybersec-icon-btn',
      attr: { 'aria-label': 'Akışı Yenile' }
    });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.onclick = () => this.fetchAllFeeds();

    // Subnav Filter Links (Hacker News inline bar: all | must-read | cisa | ...)
    const subnav = header.createEl('div', { cls: 'cybersec-hn-subnav' });
    const filters = [
      { id: 'all', label: 'all' },
      { id: 'must-read', label: '🔥 must-read (8.5+)' },
      { id: 'cisa', label: 'cisa' },
      { id: 'portswigger', label: 'portswigger' },
      { id: 'bleeping', label: 'bleeping' },
      { id: 'thn', label: 'thn' },
      { id: 'netsec', label: 'r/netsec' },
      { id: 'usom', label: 'usom' }
    ];

    this.chipButtons = {};
    filters.forEach((f, idx) => {
      if (idx > 0) {
        subnav.createEl('span', { cls: 'cybersec-hn-pipe', text: '|' });
      }
      const item = subnav.createEl('span', {
        cls: `cybersec-hn-navlink ${this.activeFilter === f.id ? 'is-active' : ''}`,
        text: f.label
      });
      item.onclick = () => {
        Object.values(this.chipButtons).forEach(b => b.removeClass('is-active'));
        item.addClass('is-active');
        this.activeFilter = f.id;
        this.filterAndRender();
      };
      this.chipButtons[f.id] = item;
    });

    // 2. Rotator Stage Container (Sırayla Dönen Haber Kartı)
    this.rotatorWrapper = container.createEl('div', { cls: 'cybersec-rotator-wrapper' });

    this.rotatorWrapper.addEventListener('mouseenter', () => {
      this.isHovered = true;
      this.updateStatusBadge();
    });
    this.rotatorWrapper.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.updateStatusBadge();
    });

    // Linear progress bar at top of card (2px HN Orange)
    this.progressTrack = this.rotatorWrapper.createEl('div', { cls: 'cybersec-progress-track' });
    this.progressBar = this.progressTrack.createEl('div', { cls: 'cybersec-progress-bar' });

    // Card inner content
    this.rotatorCard = this.rotatorWrapper.createEl('div', { cls: 'cybersec-rotator-card' });

    // 3. Search Bar
    const filterArea = container.createEl('div', { cls: 'cybersec-filter-area' });

    this.searchInput = filterArea.createEl('input', {
      type: 'search',
      placeholder: 'filtrele: cve, rce, xss, sqli, başlık...',
      cls: 'cybersec-search-input'
    });

    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.filterAndRender();
    });

    // 4. Stream / Wire Feed Header
    const wireHeader = container.createEl('div', { cls: 'cybersec-wire-header' });
    this.wireTitleEl = wireHeader.createEl('span', { text: `TOP THREATS (${this.sortBy.toUpperCase()})` });
    this.wireCountEl = wireHeader.createEl('span', { text: '0 STORIES' });

    // Stream list container
    this.wireList = container.createEl('div', { cls: 'cybersec-wire-list' });
  }

  toggleSort() {
    this.sortBy = this.sortBy === 'rank' ? 'date' : 'rank';
    if (this.sortBtn) {
      this.sortBtn.setText(this.sortBy === 'rank' ? '▲ RANK' : '🕒 DATE');
    }
    if (this.wireTitleEl) {
      this.wireTitleEl.setText(`TOP THREATS (${this.sortBy.toUpperCase()})`);
    }
    this.filterAndRender();
  }

  // --- Rotator Engine ---
  startRotatorTimer() {
    this.stopRotatorTimer();
    const intervalMs = (this.plugin.settings.rotationIntervalSec || 300) * 1000;
    const stepMs = 200;
    const increment = 100 / (intervalMs / stepMs);

    this.timerInterval = setInterval(() => {
      if (this.isPaused || this.isHovered || this.filteredArticles.length <= 1) {
        return;
      }

      this.progress += increment;
      if (this.progress >= 100) {
        this.progress = 0;
        this.nextArticle();
      } else {
        if (this.progressBar) {
          this.progressBar.style.width = `${Math.min(this.progress, 100)}%`;
        }
      }
    }, stepMs);
  }

  stopRotatorTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      setIcon(this.pauseBtn, 'play');
      this.progressBar?.addClass('is-paused');
    } else {
      setIcon(this.pauseBtn, 'pause');
      this.progressBar?.removeClass('is-paused');
    }
    this.updateStatusBadge();
  }

  updateStatusBadge() {
    if (this.isPaused) {
      this.statusDot.addClass('paused');
      this.statusText.setText('PAUSED');
    } else if (this.isHovered) {
      this.statusDot.addClass('paused');
      this.statusText.setText('READING');
    } else {
      this.statusDot.removeClass('paused');
      this.statusText.setText('LIVE');
    }
  }

  nextArticle() {
    if (this.filteredArticles.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredArticles.length;
    this.progress = 0;
    if (this.progressBar) this.progressBar.style.width = '0%';
    this.renderCurrentArticle();
    this.highlightActiveWireRow();
  }

  prevArticle() {
    if (this.filteredArticles.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.filteredArticles.length) % this.filteredArticles.length;
    this.progress = 0;
    if (this.progressBar) this.progressBar.style.width = '0%';
    this.renderCurrentArticle();
    this.highlightActiveWireRow();
  }

  selectArticleByIndex(idx) {
    if (idx < 0 || idx >= this.filteredArticles.length) return;
    this.currentIndex = idx;
    this.progress = 0;
    if (this.progressBar) this.progressBar.style.width = '0%';
    this.renderCurrentArticle();
    this.highlightActiveWireRow();
  }

  // --- Rendering ---
  renderCurrentArticle() {
    this.rotatorCard.empty();

    if (this.filteredArticles.length === 0) {
      const emptyEl = this.rotatorCard.createEl('div', { cls: 'cybersec-wire-empty' });
      emptyEl.setText(this.isLoading ? 'scanning threat streams...' : 'no articles found matching filter.');
      return;
    }

    const article = this.filteredArticles[this.currentIndex];
    if (!article) return;

    const rank = article.studentRank || calculateStudentRank(article);
    const domain = extractDomain(article.link);

    // 1. Meta Line (Hacker News Score & Metadata)
    const meta = this.rotatorCard.createEl('div', { cls: 'cybersec-rotator-meta' });

    const metaLeft = meta.createEl('div', { cls: 'cybersec-rotator-meta-left' });

    // Upvote arrow + Score
    const scoreBadge = metaLeft.createEl('span', {
      cls: `cybersec-hn-score-pill ${rank.tier}`,
      text: `▲ ${rank.score}/10`
    });
    scoreBadge.title = `Öğrenci Okuma Önceliği: ${rank.score}/10`;

    metaLeft.createEl('span', {
      cls: `cybersec-hn-tier-tag ${rank.tier}`,
      text: rank.tierLabel
    });

    const timeStr = formatRelativeTime(article.date);
    metaLeft.createEl('span', {
      cls: 'cybersec-timestamp',
      text: `by ${article.source}${domain ? ` (${domain})` : ''}${timeStr ? ` · ${timeStr}` : ''}`
    });

    // Rotator Nav (Counter + Prev / Next buttons)
    const nav = meta.createEl('div', { cls: 'cybersec-rotator-nav' });
    const countStr = `${padZero(this.currentIndex + 1)} / ${padZero(this.filteredArticles.length)}`;
    nav.createEl('span', { cls: 'cybersec-counter', text: countStr });

    const prevBtn = nav.createEl('button', {
      cls: 'cybersec-rotator-btn',
      attr: { 'aria-label': 'Önceki Haber' }
    });
    setIcon(prevBtn, 'chevron-left');
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      this.prevArticle();
    };

    const nextBtn = nav.createEl('button', {
      cls: 'cybersec-rotator-btn',
      attr: { 'aria-label': 'Sonraki Haber' }
    });
    setIcon(nextBtn, 'chevron-right');
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      this.nextArticle();
    };

    // 2. Title (Clickable)
    const titleEl = this.rotatorCard.createEl('h4', {
      cls: 'cybersec-rotator-title',
      text: article.title
    });
    titleEl.onclick = () => {
      new ArticleReaderModal(this.app, this.plugin, article).open();
    };

    // 3. Student Assessment Guidance Callout (Hacker News Orange Callout)
    const guidanceBox = this.rotatorCard.createEl('div', { cls: 'cybersec-student-guidance' });
    const guidanceTitle = guidanceBox.createEl('div', { cls: 'cybersec-guidance-head' });
    guidanceTitle.createEl('span', { text: `🎓 Öğrenci Analizi: ${rank.reason}` });

    // 4. Excerpt / Description
    if (article.description) {
      this.rotatorCard.createEl('p', {
        cls: 'cybersec-rotator-desc',
        text: article.description
      });
    }

    // 5. Footer (CVE Tags & Actions)
    const footer = this.rotatorCard.createEl('div', { cls: 'cybersec-rotator-footer' });

    const cveGroup = footer.createEl('div', { cls: 'cybersec-cve-group' });
    article.cves.slice(0, 3).forEach(cve => {
      cveGroup.createEl('span', { cls: 'cybersec-cve-chip', text: cve });
    });

    const actions = footer.createEl('div', { cls: 'cybersec-action-links' });

    // Read action
    const readBtn = actions.createEl('button', { cls: 'cybersec-hn-action-btn' });
    readBtn.createSpan({ text: 'oku' });
    readBtn.onclick = () => {
      new ArticleReaderModal(this.app, this.plugin, article).open();
    };

    // Save action
    const isSaved = isArticleSaved(this.app, this.plugin, article);
    const saveBtn = actions.createEl('button', {
      cls: `cybersec-hn-action-btn ${isSaved ? 'is-saved' : ''}`
    });
    const saveText = saveBtn.createSpan({ text: isSaved ? 'kaydedildi ✓' : 'not al' });
    saveBtn.onclick = async (e) => {
      e.stopPropagation();
      if (saveBtn.hasClass('is-saved')) {
        const safeTitle = article.title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().substring(0, 70);
        const filePath = normalizePath(`${this.plugin.settings.saveFolder || 'Areas/CyberSecurity/Haberler'}/${safeTitle}.md`);
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file) {
          this.app.workspace.getLeaf(false).openFile(file);
          new Notice(`📖 Not açıldı: ${safeTitle}`);
        }
        return;
      }
      saveText.setText('kaydediliyor...');
      const res = await saveArticleAsNote(this.app, this.plugin, article);
      if (res && res.success) {
        saveBtn.addClass('is-saved');
        saveText.setText('kaydedildi ✓');
        this.renderWireList();
      } else {
        saveText.setText('not al');
      }
    };

    // External link action
    const extBtn = actions.createEl('button', {
      cls: 'cybersec-hn-action-btn',
      attr: { 'aria-label': 'Tarayıcıda Aç' }
    });
    extBtn.createSpan({ text: 'kaynak ↗' });
    extBtn.onclick = () => window.open(article.link, '_blank');
  }

  renderWireList() {
    this.wireList.empty();

    this.wireCountEl.setText(`${this.filteredArticles.length} STORIES`);

    if (this.filteredArticles.length === 0) {
      const emptyEl = this.wireList.createEl('div', { cls: 'cybersec-wire-empty' });
      emptyEl.setText(this.isLoading ? 'scanning streams...' : 'feed is quiet');
      return;
    }

    this.wireRowEls = [];

    this.filteredArticles.forEach((article, index) => {
      const isSaved = isArticleSaved(this.app, this.plugin, article);
      const rank = article.studentRank || calculateStudentRank(article);
      const domain = extractDomain(article.link);

      const row = this.wireList.createEl('div', {
        cls: `cybersec-wire-row ${index === this.currentIndex ? 'is-active' : ''}`
      });

      // Item rank number (1., 2., 3. ...)
      row.createEl('span', { cls: 'cybersec-hn-rank-num', text: `${index + 1}.` });

      // Upvote arrow + Score
      const voteBox = row.createEl('div', { cls: 'cybersec-hn-vote-box' });
      voteBox.createEl('span', { cls: 'cybersec-hn-upvote', text: '▲' });
      voteBox.createEl('span', { cls: `cybersec-hn-score ${rank.tier}`, text: `${rank.score}` });

      const body = row.createEl('div', { cls: 'cybersec-wire-body' });

      // Top headline row: Title (domain)
      const headline = body.createEl('div', { cls: 'cybersec-wire-headline' });
      headline.createEl('span', { cls: 'cybersec-wire-title', text: article.title });
      if (domain) {
        headline.createEl('span', { cls: 'cybersec-hn-domain', text: `(${domain})` });
      }

      // Subtext line: X pts by source · time | tier | reason | cve
      const subtext = body.createEl('div', { cls: 'cybersec-hn-subtext' });

      const timeStr = formatRelativeTime(article.date);
      subtext.createEl('span', {
        text: `${rank.score} pts by ${article.sourceCode}${timeStr ? ` · ${timeStr}` : ''}`
      });

      subtext.createEl('span', { cls: 'cybersec-hn-pipe', text: '|' });
      subtext.createEl('span', { cls: `cybersec-hn-subtier ${rank.tier}`, text: rank.tierLabel });

      if (rank.reason) {
        subtext.createEl('span', { cls: 'cybersec-hn-pipe', text: '|' });
        subtext.createEl('span', { cls: 'cybersec-hn-reason', text: rank.reason });
      }

      if (article.cves.length > 0) {
        subtext.createEl('span', { cls: 'cybersec-hn-pipe', text: '|' });
        subtext.createEl('span', { cls: 'cybersec-cve-chip', text: article.cves[0] });
      }

      // Quick 1-click Bookmark / Save Button
      const wireAction = row.createEl('div', { cls: 'cybersec-wire-action' });
      const wireSaveBtn = wireAction.createEl('button', {
        cls: `cybersec-hn-mini-btn ${isSaved ? 'is-saved' : ''}`,
        attr: { 'aria-label': isSaved ? 'Kayıtlı (Aç)' : 'Not Al' },
        text: isSaved ? '✓' : '+'
      });

      wireSaveBtn.onclick = async (e) => {
        e.stopPropagation();
        if (wireSaveBtn.hasClass('is-saved')) {
          const safeTitle = article.title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().substring(0, 70);
          const filePath = normalizePath(`${this.plugin.settings.saveFolder || 'Areas/CyberSecurity/Haberler'}/${safeTitle}.md`);
          const file = this.app.vault.getAbstractFileByPath(filePath);
          if (file) {
            this.app.workspace.getLeaf(false).openFile(file);
            new Notice(`📖 Not açıldı: ${safeTitle}`);
          }
          return;
        }

        wireSaveBtn.setText('..');
        const res = await saveArticleAsNote(this.app, this.plugin, article);
        if (res && res.success) {
          wireSaveBtn.addClass('is-saved');
          wireSaveBtn.setText('✓');
          if (index === this.currentIndex) {
            this.renderCurrentArticle();
          }
        } else {
          wireSaveBtn.setText('+');
        }
      };

      row.onclick = () => {
        this.selectArticleByIndex(index);
      };

      row.ondblclick = () => {
        new ArticleReaderModal(this.app, this.plugin, article).open();
      };

      this.wireRowEls.push(row);
    });
  }

  highlightActiveWireRow() {
    if (!this.wireRowEls) return;
    this.wireRowEls.forEach((row, idx) => {
      if (idx === this.currentIndex) {
        row.addClass('is-active');
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        row.removeClass('is-active');
      }
    });
  }

  filterAndRender() {
    let filtered = [...this.articles];

    // Filter by source or tier
    if (this.activeFilter === 'must-read') {
      filtered = filtered.filter(a => a.studentRank && a.studentRank.score >= 8.5);
    } else if (this.activeFilter !== 'all') {
      filtered = filtered.filter(a => a.sourceId === this.activeFilter);
    }

    // Filter by search query
    if (this.searchQuery) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(this.searchQuery) ||
        a.description.toLowerCase().includes(this.searchQuery) ||
        (a.studentRank && a.studentRank.reason.toLowerCase().includes(this.searchQuery)) ||
        a.cves.some(c => c.toLowerCase().includes(this.searchQuery))
      );
    }

    // Sort
    if (this.sortBy === 'rank') {
      filtered.sort((a, b) => {
        const scoreDiff = (b.studentRank?.score || 0) - (a.studentRank?.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    } else {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    this.filteredArticles = filtered;
    this.currentIndex = 0;
    this.progress = 0;
    if (this.progressBar) this.progressBar.style.width = '0%';

    this.renderCurrentArticle();
    this.renderWireList();
  }

  // --- Fetch Feeds ---
  async fetchAllFeeds() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.statusText.setText('SCANNING');

    const allArticles = [];

    for (const feed of FEEDS) {
      if (!this.isFeedEnabled(feed.id)) continue;

      try {
        if (feed.type === 'json' && feed.id === 'cisa') {
          const cisaItems = await this.fetchCISA(feed);
          allArticles.push(...cisaItems);
        } else if (feed.type === 'rss') {
          const rssItems = await this.fetchRSS(feed);
          allArticles.push(...rssItems);
        }
      } catch (err) {
        console.warn(`[CyberSec Pulse] ${feed.name} could not be reached:`, err);
      }
    }

    this.articles = allArticles;
    this.isLoading = false;
    this.updateStatusBadge();
    this.filterAndRender();

    // Auto-save incoming articles if enabled
    if (this.plugin.settings.autoSaveEnabled) {
      await this.saveAllArticles(this.articles, true);
    }
  }

  async saveAllArticles(articlesToSave, isAuto = false) {
    if (!articlesToSave || articlesToSave.length === 0) {
      if (!isAuto) new Notice('Kaydedilecek haber akışı bulunamadı.');
      return 0;
    }

    const limit = isAuto ? (this.plugin.settings.autoSaveLimit || 10) : Math.min(articlesToSave.length, 30);
    let savedCount = 0;

    if (!isAuto) {
      new Notice(`📥 ${Math.min(articlesToSave.length, limit)} haber inceleniyor ve vault'a aktarılıyor...`);
    }

    const targetList = articlesToSave.slice(0, limit);
    for (const article of targetList) {
      if (isAuto && this.plugin.settings.autoSaveOnlyCVE && (!article.cves || article.cves.length === 0)) {
        continue;
      }
      if (isAuto && this.plugin.settings.autoSaveMinRank && article.studentRank?.score < this.plugin.settings.autoSaveMinRank) {
        continue;
      }
      const saved = await saveArticleAsNote(this.app, this.plugin, article, true);
      if (saved) savedCount++;
    }

    if (savedCount > 0) {
      new Notice(`🛡️ CyberSec Pulse: ${savedCount} yeni tehdit haberi not olarak kaydedildi! (${this.plugin.settings.saveFolder})`);
    } else if (!isAuto) {
      new Notice('Seçili haberlerin tamamı zaten vault\'ta mevcut.');
    }
    return savedCount;
  }

  isFeedEnabled(feedId) {
    if (feedId === 'cisa') return this.plugin.settings.enableCISA;
    if (feedId === 'bleeping') return this.plugin.settings.enableBleeping;
    if (feedId === 'thn') return this.plugin.settings.enableTHN;
    if (feedId === 'portswigger') return this.plugin.settings.enablePortSwigger;
    if (feedId === 'netsec') return this.plugin.settings.enableNetsec;
    if (feedId === 'usom') return this.plugin.settings.enableUSOM;
    return true;
  }

  async fetchCISA(feed) {
    const res = await requestUrl({ url: feed.url });
    const data = res.json;
    if (!data || !data.vulnerabilities) return [];

    const items = data.vulnerabilities.slice(-this.plugin.settings.maxItemsPerFeed).reverse();
    return items.map(v => {
      const art = {
        id: v.cveID,
        title: `${v.cveID}: ${v.vulnerabilityName || v.shortDescription.substring(0, 70)}`,
        description: v.shortDescription + (v.requiredAction ? ` (Action: ${v.requiredAction})` : ''),
        link: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
        source: feed.name,
        sourceId: feed.id,
        sourceCode: feed.code,
        date: v.dateAdded,
        cves: [v.cveID]
      };
      art.studentRank = calculateStudentRank(art);
      return art;
    });
  }

  async fetchRSS(feed) {
    const res = await requestUrl({ url: feed.url });
    const parser = new DOMParser();
    const xml = parser.parseFromString(res.text, 'text/xml');

    const items = [];
    const itemNodes = xml.querySelectorAll('item, entry');

    const limit = Math.min(itemNodes.length, this.plugin.settings.maxItemsPerFeed);
    for (let i = 0; i < limit; i++) {
      const node = itemNodes[i];
      const title = node.querySelector('title')?.textContent?.trim() || 'Untitled';

      let link = node.querySelector('link')?.textContent?.trim() || '';
      if (!link && node.querySelector('link')?.getAttribute('href')) {
        link = node.querySelector('link').getAttribute('href');
      }

      let rawDesc = node.querySelector('description, summary, content')?.textContent?.trim() || '';
      const cleanDesc = sanitizeSnippet(rawDesc, 180);

      const pubDate = node.querySelector('pubDate, updated, dc\\:date')?.textContent?.trim() || new Date().toISOString();

      // CVE extraction
      const cveMatches = (title + ' ' + rawDesc).match(/CVE-\d{4}-\d{4,7}/gi) || [];
      const uniqueCVEs = [...new Set(cveMatches.map(c => c.toUpperCase()))];

      const art = {
        id: link || title,
        title,
        description: cleanDesc,
        link,
        source: feed.name,
        sourceId: feed.id,
        sourceCode: feed.code,
        date: pubDate,
        cves: uniqueCVEs
      };
      art.studentRank = calculateStudentRank(art);
      items.push(art);
    }

    return items;
  }
}

// Helper: Check if article is already saved in Vault
function isArticleSaved(app, plugin, article) {
  if (!article || !article.title) return false;
  const safeTitle = article.title
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 70);
  const folderPath = normalizePath(plugin.settings.saveFolder || 'Areas/CyberSecurity/Haberler');
  const filePath = normalizePath(`${folderPath}/${safeTitle}.md`);
  return app.vault.getAbstractFileByPath(filePath) !== null;
}

// In-App Article Reader Modal (Hacker News Clean Paper Style)
class ArticleReaderModal extends Modal {
  constructor(app, plugin, article) {
    super(app);
    this.plugin = plugin;
    this.article = article;
    this.extractedArticleText = '';
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('cybersec-reader-modal');

    const rank = this.article.studentRank || calculateStudentRank(this.article);
    const domain = extractDomain(this.article.link);

    // Meta bar
    const metaBar = contentEl.createEl('div', { cls: 'cybersec-reader-meta-bar' });
    const left = metaBar.createEl('div', { style: 'display: flex; align-items: center; gap: 8px;' });

    left.createEl('span', {
      cls: `cybersec-hn-score-pill ${rank.tier}`,
      text: `▲ ${rank.score}/10`
    });

    left.createEl('span', {
      cls: `cybersec-hn-tier-tag ${rank.tier}`,
      text: rank.tierLabel
    });

    left.createEl('span', {
      text: `by ${this.article.source}${domain ? ` (${domain})` : ''} · ${formatRelativeTime(this.article.date) || ''}`
    });

    if (this.article.cves.length > 0) {
      const cveWrap = metaBar.createEl('div', { style: 'display: flex; gap: 4px;' });
      this.article.cves.forEach(cve => {
        cveWrap.createEl('span', { cls: 'cybersec-cve-chip', text: cve });
      });
    }

    // Title
    contentEl.createEl('h2', { cls: 'cybersec-reader-title', text: this.article.title });

    // Student Guidance Box in Reader
    const guidanceBox = contentEl.createEl('div', { cls: 'cybersec-student-guidance' });
    guidanceBox.createEl('div', { cls: 'cybersec-guidance-head', text: `🎓 Siber Güvenlik Öğrenci Değerlendirmesi (${rank.score}/10)` });
    guidanceBox.createEl('div', { cls: 'cybersec-guidance-body', text: `${rank.reason} — ${getStudentRecommendation(rank)}` });

    // Actions
    const actions = contentEl.createEl('div', { cls: 'cybersec-reader-actions' });

    const isSaved = isArticleSaved(this.app, this.plugin, this.article);

    const saveBtn = actions.createEl('button', {
      cls: `cybersec-hn-reader-btn ${isSaved ? 'is-saved' : ''}`
    });
    const saveBtnText = saveBtn.createSpan({ text: isSaved ? 'Vault\'ta Kayıtlı ✓' : 'Bu Haberi Not Al' });

    let openBtn = null;
    const addOpenBtn = (file) => {
      if (openBtn) return;
      openBtn = actions.createEl('button', { cls: 'cybersec-hn-reader-btn-secondary' });
      openBtn.createSpan({ text: 'Notu Aç (Editörde)' });
      openBtn.onclick = () => {
        if (file) {
          this.app.workspace.getLeaf(false).openFile(file);
          this.close();
        }
      };
    };

    if (isSaved) {
      const safeTitle = this.article.title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().substring(0, 70);
      const filePath = normalizePath(`${this.plugin.settings.saveFolder || 'Areas/CyberSecurity/Haberler'}/${safeTitle}.md`);
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file) addOpenBtn(file);
    }

    saveBtn.onclick = async () => {
      if (saveBtn.hasClass('is-saved')) {
        const safeTitle = this.article.title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().substring(0, 70);
        const filePath = normalizePath(`${this.plugin.settings.saveFolder || 'Areas/CyberSecurity/Haberler'}/${safeTitle}.md`);
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file) {
          this.app.workspace.getLeaf(false).openFile(file);
          this.close();
        }
        return;
      }

      saveBtnText.setText('Kaydediliyor...');
      const res = await saveArticleAsNote(this.app, this.plugin, this.article, false, this.extractedArticleText || '');
      if (res && res.success) {
        saveBtn.addClass('is-saved');
        saveBtnText.setText('Kaydedildi ✓');
        if (res.file) addOpenBtn(res.file);
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CYBERSEC);
        for (const leaf of leaves) {
          if (leaf.view && typeof leaf.view.renderCurrentArticle === 'function') {
            leaf.view.renderCurrentArticle();
            leaf.view.renderWireList();
          }
        }
      } else {
        saveBtnText.setText('Bu Haberi Not Al');
      }
    };

    const extBtn = actions.createEl('button', { cls: 'cybersec-hn-reader-btn-secondary' });
    extBtn.createSpan({ text: 'Orijinal Kaynak ↗' });
    extBtn.onclick = () => window.open(this.article.link, '_blank');

    // Reader body
    const bodyEl = contentEl.createEl('div', { cls: 'cybersec-reader-content' });
    bodyEl.innerHTML = `<i>makale içeriği yükleniyor...</i>`;

    try {
      const res = await requestUrl({ url: this.article.link });
      const parser = new DOMParser();
      const doc = parser.parseFromString(res.text, 'text/html');

      doc.querySelectorAll('script, style, iframe, nav, header, footer, noscript, .advertisement, .sidebar').forEach(el => el.remove());

      const articleNode = doc.querySelector('article') || doc.querySelector('.article-body') || doc.querySelector('.post-content') || doc.querySelector('main') || doc.body;

      bodyEl.empty();
      if (articleNode) {
        bodyEl.innerHTML = articleNode.innerHTML;
        const elements = Array.from(articleNode.querySelectorAll('p, h2, h3, blockquote, pre, code'));
        const extracted = [];
        for (const el of elements) {
          const t = el.textContent.trim();
          if (!t || t.length < 20) continue;
          if (el.tagName === 'H2') extracted.push(`\n### ${t}\n`);
          else if (el.tagName === 'H3') extracted.push(`\n#### ${t}\n`);
          else if (el.tagName === 'BLOCKQUOTE') extracted.push(`> ${t}`);
          else extracted.push(t);
          if (extracted.length >= 15) break;
        }
        if (extracted.length > 0) {
          this.extractedArticleText = extracted.join('\n\n');
        }
      } else {
        bodyEl.innerHTML = `<p>${this.article.description || 'detaylı metin bulunamadı.'}</p>`;
      }
    } catch (err) {
      bodyEl.empty();
      bodyEl.innerHTML = `
        <p><b>Host tarafından doğrudan okuma engellendi (CORS / Cloudflare):</b></p>
        <p><a href="${this.article.link}" target="_blank">Orijinal tarayıcı sekmesinde aç ↗</a></p>
        <hr style="margin: 14px 0; border: none; border-top: 1px solid var(--background-modifier-border);">
        <p><b>Özet:</b></p>
        <p>${this.article.description}</p>
      `;
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Save Article as Markdown Note with Student Rank & Analysis
async function saveArticleAsNote(app, plugin, article, silent = false, cachedText = '') {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const safeTitle = article.title
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 70);

    const folderPath = normalizePath(plugin.settings.saveFolder || 'Areas/CyberSecurity/Haberler');
    const filePath = normalizePath(`${folderPath}/${safeTitle}.md`);

    const folderExists = app.vault.getAbstractFileByPath(folderPath);
    if (!folderExists) {
      await app.vault.createFolder(folderPath);
    }

    const fileExists = app.vault.getAbstractFileByPath(filePath);
    if (fileExists) {
      if (!silent) new Notice(`⚠️ Bu haber zaten kayıtlı: ${safeTitle}`);
      return { success: true, alreadyExists: true, filePath, file: fileExists };
    }

    // Try fetching full web article text if enabled and not already provided
    let fullArticleText = cachedText || '';
    if (!fullArticleText && plugin.settings.fetchFullContent && article.link && article.link.startsWith('http')) {
      try {
        const res = await requestUrl({ url: article.link });
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.text, 'text/html');

        doc.querySelectorAll('script, style, iframe, nav, header, footer, noscript, .advertisement, .sidebar, .comments, .social-share, .related-posts, form').forEach(el => el.remove());

        const articleNode = doc.querySelector('article') || doc.querySelector('.article-body') || doc.querySelector('.post-content') || doc.querySelector('.entry-content') || doc.querySelector('main') || doc.body;

        if (articleNode) {
          const elements = Array.from(articleNode.querySelectorAll('p, h2, h3, blockquote, pre, code'));
          const extracted = [];
          for (const el of elements) {
            const t = el.textContent.trim();
            if (!t || t.length < 20) continue;
            if (el.tagName === 'H2') extracted.push(`\n### ${t}\n`);
            else if (el.tagName === 'H3') extracted.push(`\n#### ${t}\n`);
            else if (el.tagName === 'BLOCKQUOTE') extracted.push(`> ${t}`);
            else extracted.push(t);
            if (extracted.length >= 15) break;
          }
          if (extracted.length > 0) {
            fullArticleText = extracted.join('\n\n');
          }
        }
      } catch (scrapeErr) {
        // Fallback gracefully
      }
    }

    const rank = article.studentRank || calculateStudentRank(article);
    const domain = extractDomain(article.link);

    const frontmatter = [
      '---',
      `title: "${article.title.replace(/"/g, '\\"')}"`,
      `date_saved: ${dateStr}`,
      `source: "${article.source}"`,
      `domain: "${domain}"`,
      `url: "${article.link}"`,
      `student_rank: ${rank.score}`,
      `student_tier: "${rank.tier}"`,
      `student_reason: "${rank.reason.replace(/"/g, '\\"')}"`,
      `cves: [${article.cves.map(c => `"${c}"`).join(', ')}]`,
      `tags:`,
      `  - cybersec/intel`,
      `  - student_rank/${rank.score >= 8.5 ? 'must_read' : rank.score >= 7.0 ? 'high_priority' : 'general'}`,
      `  - source/${article.sourceId}`,
      ...article.cves.map(c => `  - vulnerability/${c}`),
      '---'
    ].join('\n');

    const cleanDesc = article.description ? article.description.replace(/"/g, '') : 'Detaylı özet bulunmuyor.';

    const noteBody = [
      frontmatter,
      '',
      'TARGET DECK: cybersec',
      '',
      `# 🛡️ ${article.title}`,
      '',
      `> [!IMPORTANT] 🎓 Siber Güvenlik Öğrenci Öncelik Puanı: **${rank.score} / 10** (${rank.tierLabel})`,
      `> - **Öncelik Sebebi:** ${rank.reason}`,
      `> - **Öğrenci Tavsiyesi:** ${getStudentRecommendation(rank)}`,
      '',
      `> [!INFO] 📌 Tehdit İstihbarat Detayları`,
      `> - **Kaynak / Portal:** [${article.source}${domain ? ` (${domain})` : ''}](${article.link})`,
      `> - **Tarih:** ${dateStr}`,
      article.cves.length > 0 ? `> - **Tespit Edilen CVE:** ${article.cves.map(c => `\`${c}\``).join(', ')}` : '',
      '',
      '## ⚡ Hızlı Özet (Overview)',
      article.description || 'Detaylı özet bulunmuyor.',
      '',
      '---',
      '',
      '## 📰 Haberin Detayları & Teknik İnceleme',
      fullArticleText || article.description || 'Haberin tam metni orijinal kaynak üzerinden incelenebilir.',
      '',
      '---',
      '',
      '## 🧑‍💻 Senior Pentester & SOC Öğrenci Kontrol Listesi',
      '- [ ] Bu zafiyet bir öğrenci labında (PortSwigger Web Security Academy / Metasploitable / TryHackMe) simüle edilebilir mi?',
      '- [ ] Zafiyetin sömürülme vektörü nedir? (Ağ paketi, kimlik doğrulanmamış HTTP isteği, yerel komut satırı vb.)',
      '- [ ] Aktif istismar (PoC / Metasploit modülü) mevcut mu?',
      '- [ ] Savunma tarafı: Yama (patch) yoksa geçici hafifletme (Snort / WAF / YARA) nasıl yazılır?',
      '',
      '---',
      '',
      '## 🃏 Anki Kartı',
      '',
      'START',
      'Temel',
      'TARGET DECK: cybersec',
      `Ön: [Tehdit İstihbaratı / Öğrenci Puanı: ${rank.score}/10] ${article.title.replace(/"/g, '')} zafiyetinin/olayının temel sömürü mekanizması ve öğrenci için önemi nedir?`,
      `Geri: **Öncelik Puanı:** ${rank.score}/10 (${rank.tierLabel})<br>• **Analiz:** ${rank.reason}<br>• **Özet:** ${cleanDesc}<br>• **Kaynak:** ${article.source}${article.cves.length > 0 ? `<br>• **İlgili CVE:** ${article.cves.join(', ')}` : ''}`,
      `Tags: from_obsidian, cybersec, threat_intel, ${article.sourceId}, rank_${Math.floor(rank.score)}`,
      'END'
    ].filter(x => x !== undefined).join('\n');

    const createdFile = await app.vault.create(filePath, noteBody);
    if (!silent) {
      new Notice(`🛡️ [CyberSec Pulse] Not başarıyla kaydedildi:\n${safeTitle}`);
    }
    return { success: true, alreadyExists: false, filePath, file: createdFile };
  } catch (err) {
    console.error('[CyberSec Pulse] Save error:', err);
    if (!silent) {
      new Notice(`Not kaydedilemedi: ${err.message}`);
    }
    return { success: false, error: err.message };
  }
}

// Helpers
function sanitizeSnippet(html, maxLen) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

function formatRelativeTime(dateInput) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch (e) {
    return '';
  }
}

function padZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

// Settings Tab
class CyberSecPulseSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'CyberSec Pulse Settings' });

    new Setting(containerEl)
      .setName('Save Folder')
      .setDesc('Vault folder where threat notes are clipped')
      .addText(text => text
        .setPlaceholder('Areas/CyberSecurity/Haberler')
        .setValue(this.plugin.settings.saveFolder)
        .onChange(async (value) => {
          this.plugin.settings.saveFolder = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Varsayılan Sıralama (Default Sort)')
      .setDesc('Akış ilk açıldığında haberlerin nasıl sıralanacağını belirler')
      .addDropdown(drop => drop
        .addOption('rank', '▲ Öğrenci Puanı (Önce En Kritikler)')
        .addOption('date', '🕒 En Yeni (Tarihe Göre)')
        .setValue(this.plugin.settings.defaultSortBy || 'rank')
        .onChange(async (val) => {
          this.plugin.settings.defaultSortBy = val;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h3', { text: 'Otomatik Not Alma ve Arşivleme (Auto-Clipper)' });

    new Setting(containerEl)
      .setName('Otomatik Not Kaydet (Auto-Save to Vault)')
      .setDesc('Haber akışı tarandığında yeni tehdit raporlarını otomatik olarak vault içerisine Markdown notu olarak kaydeder')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSaveEnabled)
        .onChange(async (val) => {
          this.plugin.settings.autoSaveEnabled = val;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Minimum Öğrenci Puan Şartı (Min Rank for Auto-Save)')
      .setDesc('Yalnızca puanı bu eşiğin üzerinde olan yüksek öncelikli haberleri otomatik kaydet (Örn: 8.5 MUST-READ)')
      .addSlider(slider => slider
        .setLimits(5.0, 9.5, 0.5)
        .setValue(this.plugin.settings.autoSaveMinRank || 8.5)
        .setDynamicTooltip()
        .onChange(async (val) => {
          this.plugin.settings.autoSaveMinRank = val;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Haberin Tam Metnini Web\'den Çek (Fetch Full Web Content)')
      .setDesc('Haber notu oluşturulurken orijinal web sayfasına bağlanıp makalenin tam metnini ve paragraflarını notun içine ekler')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.fetchFullContent)
        .onChange(async (val) => {
          this.plugin.settings.fetchFullContent = val;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Otomatik Kaydetme Limiti (Auto-Save Limit)')
      .setDesc('Her otomatik taramada en fazla kaç adet yeni haber not olarak kaydedilsin (Varsayılan: 10)')
      .addSlider(slider => slider
        .setLimits(1, 25, 1)
        .setValue(this.plugin.settings.autoSaveLimit || 10)
        .setDynamicTooltip()
        .onChange(async (val) => {
          this.plugin.settings.autoSaveLimit = val;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Yalnızca CVE İçerenleri Otomatik Kaydet (CVE Only)')
      .setDesc('Açık olduğunda yalnızca resmi CVE kodu tespit edilen kritik zafiyetleri otomatik kaydeder')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSaveOnlyCVE)
        .onChange(async (val) => {
          this.plugin.settings.autoSaveOnlyCVE = val;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Tüm Akışı Şimdi Vault\'a Not Olarak Aktar')
      .setDesc('Şu an yüklü olan tüm haber akışını hemen not olarak kaydet')
      .addButton(btn => btn
        .setButtonText('Şimdi Senkronize Et & Kaydet')
        .setCta()
        .onClick(async () => {
          const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CYBERSEC);
          if (leaves.length > 0 && leaves[0].view) {
            await leaves[0].view.saveAllArticles(leaves[0].view.filteredArticles, false);
          } else {
            await this.plugin.autoFetchAndSaveAll(false);
          }
        }));

    new Setting(containerEl)
      .setName('Haber Değişim Süresi (Rotation Interval)')
      .setDesc('Her haber kartının ekranda kalma süresi (Varsayılan: 5 Dakika / 300 Saniye)')
      .addDropdown(drop => drop
        .addOption('30', '30 Saniye')
        .addOption('60', '1 Dakika')
        .addOption('180', '3 Dakika')
        .addOption('300', '5 Dakika (Varsayılan)')
        .addOption('600', '10 Dakika')
        .addOption('900', '15 Dakika')
        .setValue(String(this.plugin.settings.rotationIntervalSec || 300))
        .onChange(async (val) => {
          this.plugin.settings.rotationIntervalSec = parseInt(val, 10) || 300;
          await this.plugin.saveSettings();
        }))
      .addText(text => text
        .setPlaceholder('Örn: 300')
        .setValue(String(this.plugin.settings.rotationIntervalSec || 300))
        .onChange(async (val) => {
          const num = parseInt(val, 10);
          if (!isNaN(num) && num >= 5) {
            this.plugin.settings.rotationIntervalSec = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName('Max Items per Feed')
      .setDesc('Number of latest items to pull from each intelligence source')
      .addSlider(slider => slider
        .setLimits(5, 30, 5)
        .setValue(this.plugin.settings.maxItemsPerFeed)
        .setDynamicTooltip()
        .onChange(async (val) => {
          this.plugin.settings.maxItemsPerFeed = val;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h3', { text: 'Intelligence Streams' });

    new Setting(containerEl)
      .setName('CISA KEV Catalog')
      .setDesc('Official Known Exploited Vulnerabilities catalog (JSON)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableCISA)
        .onChange(async (v) => {
          this.plugin.settings.enableCISA = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('BleepingComputer')
      .setDesc('Ransomware and high-impact security breaches')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableBleeping)
        .onChange(async (v) => {
          this.plugin.settings.enableBleeping = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('The Hacker News')
      .setDesc('Global cybersecurity journalism & breaking news')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableTHN)
        .onChange(async (v) => {
          this.plugin.settings.enableTHN = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('PortSwigger Research')
      .setDesc('Burp Suite research & novel web attack vectors')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enablePortSwigger)
        .onChange(async (v) => {
          this.plugin.settings.enablePortSwigger = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Reddit /r/netsec')
      .setDesc('Community technical analyses and exploit writeups')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableNetsec)
        .onChange(async (v) => {
          this.plugin.settings.enableNetsec = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('USOM')
      .setDesc('Türkiye Ulusal Siber Olaylara Müdahale Merkezi feed')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableUSOM)
        .onChange(async (v) => {
          this.plugin.settings.enableUSOM = v;
          await this.plugin.saveSettings();
        }));
  }
}

module.exports = CyberSecPulsePlugin;
