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
  rotationIntervalSec: 6,
  maxItemsPerFeed: 15,
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

    this.addSettingTab(new CyberSecPulseSettingTab(this.app, this));
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
  }
}

class CyberSecPulseView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.articles = [];
    this.filteredArticles = [];
    this.activeFilter = 'all';
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

    // 1. Minimal Header
    const header = container.createEl('div', { cls: 'cybersec-pulse-header' });
    const topBar = header.createEl('div', { cls: 'cybersec-pulse-topbar' });

    // Brand & Status
    const brand = topBar.createEl('div', { cls: 'cybersec-pulse-brand' });
    brand.createEl('span', { cls: 'cybersec-pulse-title', text: 'CYBERSEC PULSE' });

    this.statusEl = brand.createEl('div', { cls: 'cybersec-pulse-status' });
    this.statusDot = this.statusEl.createEl('span', { cls: 'cybersec-pulse-status-dot' });
    this.statusText = this.statusEl.createEl('span', { text: 'LIVE' });

    // Header Controls
    const controls = topBar.createEl('div', { cls: 'cybersec-pulse-controls' });

    // Auto-advance toggle button
    this.pauseBtn = controls.createEl('button', {
      cls: 'cybersec-icon-btn',
      attr: { 'aria-label': 'Pause / Play Rotation' }
    });
    setIcon(this.pauseBtn, 'pause');
    this.pauseBtn.onclick = () => this.togglePause();

    // Refresh button
    const refreshBtn = controls.createEl('button', {
      cls: 'cybersec-icon-btn',
      attr: { 'aria-label': 'Refresh Intelligence Feeds' }
    });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.onclick = () => this.fetchAllFeeds();

    // 2. Rotator Stage Container (Sırayla Dönen Haberler)
    this.rotatorWrapper = container.createEl('div', { cls: 'cybersec-rotator-wrapper' });

    // Hover listeners to gracefully pause rotation while reading/clicking
    this.rotatorWrapper.addEventListener('mouseenter', () => {
      this.isHovered = true;
      this.updateStatusBadge();
    });
    this.rotatorWrapper.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.updateStatusBadge();
    });

    // Linear progress bar at top of card
    this.progressTrack = this.rotatorWrapper.createEl('div', { cls: 'cybersec-progress-track' });
    this.progressBar = this.progressTrack.createEl('div', { cls: 'cybersec-progress-bar' });

    // Card inner content
    this.rotatorCard = this.rotatorWrapper.createEl('div', { cls: 'cybersec-rotator-card' });

    // 3. Search & Filter Area
    const filterArea = container.createEl('div', { cls: 'cybersec-filter-area' });

    this.searchInput = filterArea.createEl('input', {
      type: 'search',
      placeholder: 'filter feed or cve...',
      cls: 'cybersec-search-input'
    });

    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.filterAndRender();
    });

    // Clean source filter chips
    const chipsContainer = filterArea.createEl('div', { cls: 'cybersec-filter-chips' });
    const filters = [
      { id: 'all', label: 'all' },
      { id: 'cisa', label: 'cisa' },
      { id: 'bleeping', label: 'bleeping' },
      { id: 'thn', label: 'thn' },
      { id: 'portswigger', label: 'portswigger' },
      { id: 'netsec', label: 'r/netsec' },
      { id: 'usom', label: 'usom' }
    ];

    this.chipButtons = {};
    filters.forEach(f => {
      const chip = chipsContainer.createEl('button', {
        cls: `cybersec-filter-chip ${this.activeFilter === f.id ? 'is-active' : ''}`,
        text: f.label
      });
      chip.onclick = () => {
        Object.values(this.chipButtons).forEach(b => b.removeClass('is-active'));
        chip.addClass('is-active');
        this.activeFilter = f.id;
        this.filterAndRender();
      };
      this.chipButtons[f.id] = chip;
    });

    // 4. Compact Stream / Wire Feed Header
    const wireHeader = container.createEl('div', { cls: 'cybersec-wire-header' });
    this.wireTitleEl = wireHeader.createEl('span', { text: 'WIRE FEED' });
    this.wireCountEl = wireHeader.createEl('span', { text: '0 ITEMS' });

    // Stream list container
    this.wireList = container.createEl('div', { cls: 'cybersec-wire-list' });
  }

  // --- Rotator Engine ---
  startRotatorTimer() {
    this.stopRotatorTimer();
    const intervalMs = (this.plugin.settings.rotationIntervalSec || 6) * 1000;
    const stepMs = 100;
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

    // Trigger subtle fade-in
    this.rotatorCard.removeClass('fade-in');
    void this.rotatorCard.offsetWidth; // reflow
    this.rotatorCard.addClass('fade-in');

    // 1. Meta Line (Source + Time + Controls)
    const meta = this.rotatorCard.createEl('div', { cls: 'cybersec-rotator-meta' });

    const metaLeft = meta.createEl('div', { cls: 'cybersec-rotator-meta-left' });
    metaLeft.createEl('span', {
      cls: `cybersec-source-tag ${article.sourceCode}`,
      text: article.sourceCode
    });

    const timeStr = formatRelativeTime(article.date);
    if (timeStr) {
      metaLeft.createEl('span', { cls: 'cybersec-timestamp', text: `· ${timeStr}` });
    }

    // Rotator Nav (Counter + Prev / Next buttons)
    const nav = meta.createEl('div', { cls: 'cybersec-rotator-nav' });
    const countStr = `${padZero(this.currentIndex + 1)} / ${padZero(this.filteredArticles.length)}`;
    nav.createEl('span', { cls: 'cybersec-counter', text: countStr });

    const prevBtn = nav.createEl('button', {
      cls: 'cybersec-rotator-btn',
      attr: { 'aria-label': 'Previous Article' }
    });
    setIcon(prevBtn, 'chevron-left');
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      this.prevArticle();
    };

    const nextBtn = nav.createEl('button', {
      cls: 'cybersec-rotator-btn',
      attr: { 'aria-label': 'Next Article' }
    });
    setIcon(nextBtn, 'chevron-right');
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      this.nextArticle();
    };

    // 2. Title
    const titleEl = this.rotatorCard.createEl('h4', {
      cls: 'cybersec-rotator-title',
      text: article.title
    });
    titleEl.onclick = () => {
      new ArticleReaderModal(this.app, this.plugin, article).open();
    };

    // 3. Excerpt
    if (article.description) {
      this.rotatorCard.createEl('p', {
        cls: 'cybersec-rotator-desc',
        text: article.description
      });
    }

    // 4. Footer (CVE Tags & Actions)
    const footer = this.rotatorCard.createEl('div', { cls: 'cybersec-rotator-footer' });

    const cveGroup = footer.createEl('div', { cls: 'cybersec-cve-group' });
    article.cves.slice(0, 3).forEach(cve => {
      cveGroup.createEl('span', { cls: 'cybersec-cve-chip', text: cve });
    });

    const actions = footer.createEl('div', { cls: 'cybersec-action-links' });

    // Read action
    const readBtn = actions.createEl('button', { cls: 'cybersec-text-btn' });
    setIcon(readBtn, 'book-open');
    readBtn.createSpan({ text: 'read' });
    readBtn.onclick = () => {
      new ArticleReaderModal(this.app, this.plugin, article).open();
    };

    // Save action
    const saveBtn = actions.createEl('button', { cls: 'cybersec-text-btn accent' });
    setIcon(saveBtn, 'bookmark');
    saveBtn.createSpan({ text: 'save' });
    saveBtn.onclick = async () => {
      await saveArticleAsNote(this.app, this.plugin, article);
    };

    // External link action
    const extBtn = actions.createEl('button', {
      cls: 'cybersec-text-btn',
      attr: { 'aria-label': 'Open in Browser' }
    });
    setIcon(extBtn, 'external-link');
    extBtn.onclick = () => window.open(article.link, '_blank');
  }

  renderWireList() {
    this.wireList.empty();

    this.wireCountEl.setText(`${this.filteredArticles.length} ITEMS`);

    if (this.filteredArticles.length === 0) {
      const emptyEl = this.wireList.createEl('div', { cls: 'cybersec-wire-empty' });
      emptyEl.setText(this.isLoading ? 'scanning streams...' : 'feed is quiet');
      return;
    }

    this.wireRowEls = [];

    this.filteredArticles.forEach((article, index) => {
      const row = this.wireList.createEl('div', {
        cls: `cybersec-wire-row ${index === this.currentIndex ? 'is-active' : ''}`
      });

      row.createEl('div', { cls: 'cybersec-wire-row-indicator' });

      const body = row.createEl('div', { cls: 'cybersec-wire-body' });

      const top = body.createEl('div', { cls: 'cybersec-wire-top' });
      top.createEl('span', {
        cls: `cybersec-source-tag ${article.sourceCode}`,
        text: article.sourceCode
      });

      const timeStr = formatRelativeTime(article.date);
      if (timeStr) {
        top.createEl('span', { cls: 'cybersec-timestamp', text: timeStr });
      }

      if (article.cves.length > 0) {
        top.createEl('span', { cls: 'cybersec-cve-chip', text: article.cves[0] });
      }

      body.createEl('p', { cls: 'cybersec-wire-title', text: article.title });

      row.onclick = () => {
        this.selectArticleByIndex(index);
      };

      this.wireRowEls.push(row);
    });
  }

  highlightActiveWireRow() {
    if (!this.wireRowEls) return;
    this.wireRowEls.forEach((row, idx) => {
      if (idx === this.currentIndex) {
        row.addClass('is-active');
        // Gentle auto-scroll to keep active wire item visible
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        row.removeClass('is-active');
      }
    });
  }

  filterAndRender() {
    let filtered = this.articles;

    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(a => a.sourceId === this.activeFilter);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(this.searchQuery) ||
        a.description.toLowerCase().includes(this.searchQuery) ||
        a.cves.some(c => c.toLowerCase().includes(this.searchQuery))
      );
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

    // Sort by Date descending
    allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.articles = allArticles;
    this.isLoading = false;
    this.updateStatusBadge();
    this.filterAndRender();
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
    return items.map(v => ({
      id: v.cveID,
      title: `${v.cveID}: ${v.vulnerabilityName || v.shortDescription.substring(0, 70)}`,
      description: v.shortDescription + (v.requiredAction ? ` (Action: ${v.requiredAction})` : ''),
      link: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
      source: feed.name,
      sourceId: feed.id,
      sourceCode: feed.code,
      date: v.dateAdded,
      cves: [v.cveID]
    }));
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

      items.push({
        id: link || title,
        title,
        description: cleanDesc,
        link,
        source: feed.name,
        sourceId: feed.id,
        sourceCode: feed.code,
        date: pubDate,
        cves: uniqueCVEs
      });
    }

    return items;
  }
}

// In-App Article Reader Modal
class ArticleReaderModal extends Modal {
  constructor(app, plugin, article) {
    super(app);
    this.plugin = plugin;
    this.article = article;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('cybersec-reader-modal');

    // Meta bar
    const metaBar = contentEl.createEl('div', { cls: 'cybersec-reader-meta-bar' });
    const left = metaBar.createEl('div', { style: 'display: flex; align-items: center; gap: 8px;' });
    left.createEl('span', { cls: `cybersec-source-tag ${this.article.sourceCode}`, text: this.article.sourceCode });
    left.createEl('span', { text: formatRelativeTime(this.article.date) || '' });

    if (this.article.cves.length > 0) {
      const cveWrap = metaBar.createEl('div', { style: 'display: flex; gap: 4px;' });
      this.article.cves.forEach(cve => {
        cveWrap.createEl('span', { cls: 'cybersec-cve-chip', text: cve });
      });
    }

    // Title
    contentEl.createEl('h2', { cls: 'cybersec-reader-title', text: this.article.title });

    // Actions
    const actions = contentEl.createEl('div', { cls: 'cybersec-reader-actions' });

    const saveBtn = actions.createEl('button', { cls: 'cybersec-text-btn accent' });
    setIcon(saveBtn, 'bookmark');
    saveBtn.createSpan({ text: 'Save to Vault' });
    saveBtn.onclick = async () => {
      await saveArticleAsNote(this.app, this.plugin, this.article);
    };

    const extBtn = actions.createEl('button', { cls: 'cybersec-text-btn' });
    setIcon(extBtn, 'external-link');
    extBtn.createSpan({ text: 'Original Source' });
    extBtn.onclick = () => window.open(this.article.link, '_blank');

    // Reader body
    const bodyEl = contentEl.createEl('div', { cls: 'cybersec-reader-content' });
    bodyEl.innerHTML = `<i>loading article content...</i>`;

    try {
      const res = await requestUrl({ url: this.article.link });
      const parser = new DOMParser();
      const doc = parser.parseFromString(res.text, 'text/html');

      doc.querySelectorAll('script, style, iframe, nav, header, footer, noscript, .advertisement, .sidebar').forEach(el => el.remove());

      const articleNode = doc.querySelector('article') || doc.querySelector('.article-body') || doc.querySelector('.post-content') || doc.querySelector('main') || doc.body;

      bodyEl.empty();
      if (articleNode) {
        bodyEl.innerHTML = articleNode.innerHTML;
      } else {
        bodyEl.innerHTML = `<p>${this.article.description || 'no detailed text available.'}</p>`;
      }
    } catch (err) {
      bodyEl.empty();
      bodyEl.innerHTML = `
        <p><b>Direct view blocked by host (CORS / Cloudflare):</b></p>
        <p><a href="${this.article.link}" target="_blank">Open directly in browser ↗</a></p>
        <hr style="margin: 14px 0; border: none; border-top: 1px solid var(--background-modifier-border);">
        <p><b>Summary:</b></p>
        <p>${this.article.description}</p>
      `;
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Save Article as Markdown Note
async function saveArticleAsNote(app, plugin, article) {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const safeTitle = article.title
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);

    const folderPath = normalizePath(plugin.settings.saveFolder);
    const filePath = normalizePath(`${folderPath}/${safeTitle}.md`);

    const folderExists = app.vault.getAbstractFileByPath(folderPath);
    if (!folderExists) {
      await app.vault.createFolder(folderPath);
    }

    const fileExists = app.vault.getAbstractFileByPath(filePath);
    if (fileExists) {
      new Notice(`Note already exists: ${safeTitle}`);
      return;
    }

    const frontmatter = [
      '---',
      `title: "${article.title.replace(/"/g, '\\"')}"`,
      `date_saved: ${dateStr}`,
      `source: "${article.source}"`,
      `url: "${article.link}"`,
      `tags:`,
      `  - cybersec/intel`,
      `  - source/${article.sourceId}`,
      ...article.cves.map(c => `  - vulnerability/${c}`),
      '---',
      ''
    ].join('\n');

    const noteBody = [
      frontmatter,
      `# ${article.title}`,
      '',
      `- **Source**: [${article.source}](${article.link})`,
      `- **Date**: ${dateStr}`,
      article.cves.length > 0 ? `- **CVEs**: ${article.cves.map(c => `\`${c}\``).join(', ')}` : '',
      '',
      '## Overview',
      article.description || 'No description provided.',
      '',
      '---',
      '## Threat Assessment & Notes',
      '- [ ] Vulnerability affects internal or client assets?',
      '- [ ] Exploit PoC available / actively exploited in the wild?',
      '- [ ] Mitigation or patch verified?'
    ].filter(Boolean).join('\n');

    await app.vault.create(filePath, noteBody);
    new Notice(`Saved note: ${safeTitle}`);
  } catch (err) {
    console.error('[CyberSec Pulse] Save error:', err);
    new Notice(`Could not save note: ${err.message}`);
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
      .setName('Rotation Interval (Seconds)')
      .setDesc('How many seconds each headline stays before rotating')
      .addSlider(slider => slider
        .setLimits(3, 15, 1)
        .setValue(this.plugin.settings.rotationIntervalSec || 6)
        .setDynamicTooltip()
        .onChange(async (val) => {
          this.plugin.settings.rotationIntervalSec = val;
          await this.plugin.saveSettings();
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
