// ============================================================
// homepage-loader.js
// Fetches _data/*.json from GitHub and injects CMS content
// into the existing homepage HTML elements.
// Falls back silently to static HTML if not configured.
// !! UPDATE THESE WITH YOUR GITHUB DETAILS !!
// ============================================================
const HP_GITHUB_USER = 'lunasawaf-source';
const HP_GITHUB_REPO = 'abdullah-site';
const HP_BRANCH      = 'main';
// ============================================================

async function fetchData(file) {
  const url = `https://raw.githubusercontent.com/${HP_GITHUB_USER}/${HP_GITHUB_REPO}/${HP_BRANCH}/final-site/_data/${file}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function set(selector, text, lang) {
  const els = document.querySelectorAll(selector);
  els.forEach(el => { if (el) el.textContent = text; });
}

function setHTML(selector, html) {
  const els = document.querySelectorAll(selector);
  els.forEach(el => { if (el) el.innerHTML = html; });
}

// ── HERO ─────────────────────────────────────────────────────
async function loadHero(lang) {
  const d = await fetchData('hero.json');
  if (!d) return;

  const isAr = lang === 'ar';

  // Eyebrow
  document.querySelectorAll('.hero-eyebrow .ar-text').forEach(el => el.textContent = d.eyebrow_ar);
  document.querySelectorAll('.hero-eyebrow .en-text').forEach(el => el.textContent = d.eyebrow_en);

  // Name
  document.querySelectorAll('.hero-name .ar-text').forEach(el => {
    el.innerHTML = `${d.name_first_ar} <span>${d.name_second_ar}</span>`;
  });
  document.querySelectorAll('.hero-name .en-text').forEach(el => {
    el.innerHTML = `${d.name_first_en} <span>${d.name_second_en}</span>`;
  });

  // Subtitle (job title)
  document.querySelectorAll('.hero-subtitle .ar-text').forEach(el => el.textContent = d.subtitle_ar);
  document.querySelectorAll('.hero-subtitle .en-text').forEach(el => el.textContent = d.subtitle_en);

  // Bio description
  document.querySelectorAll('.hero-desc .ar-text').forEach(el => el.textContent = d.description_ar);
  document.querySelectorAll('.hero-desc .en-text').forEach(el => el.textContent = d.description_en);

  // Primary CTA button
  const primaryBtns = document.querySelectorAll('.hero-btns .btn-primary');
  primaryBtns.forEach(btn => {
    btn.querySelector('.ar-inline') && (btn.querySelector('.ar-inline').textContent = d.cta_primary_ar);
    btn.querySelector('.en-inline') && (btn.querySelector('.en-inline').textContent = d.cta_primary_en);
    btn.onclick = () => {
      if (d.cta_primary_action === 'contact') scrollToContact();
      else if (typeof showPage === 'function') showPage(d.cta_primary_action);
    };
  });

  // Secondary CTA button
  const secondaryBtns = document.querySelectorAll('.hero-btns .btn-outline');
  secondaryBtns.forEach(btn => {
    btn.querySelector('.ar-inline') && (btn.querySelector('.ar-inline').textContent = d.cta_secondary_ar);
    btn.querySelector('.en-inline') && (btn.querySelector('.en-inline').textContent = d.cta_secondary_en);
    btn.onclick = () => {
      if (d.cta_secondary_action === 'contact') scrollToContact();
      else if (typeof showPage === 'function') showPage(d.cta_secondary_action);
    };
  });

  // Badge
  document.querySelectorAll('.hero-badge-num').forEach(el => el.textContent = d.badge_number);
  document.querySelectorAll('.hero-badge-label .ar-inline').forEach(el => el.textContent = d.badge_label_ar);
  document.querySelectorAll('.hero-badge-label .en-inline').forEach(el => el.textContent = d.badge_label_en);

  // Hero photo — replace placeholder if photo exists
  if (d.hero_photo) {
    document.querySelectorAll('.hero-img-placeholder').forEach(el => {
      el.innerHTML = `<img src="${d.hero_photo}" alt="${isAr ? d.name_first_ar + ' ' + d.name_second_ar : d.name_first_en + ' ' + d.name_second_en}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
    });
  }
}

// ── STATS BAR ─────────────────────────────────────────────────
async function loadStats() {
  const d = await fetchData('stats.json');
  if (!d || !d.items) return;

  const statItems = document.querySelectorAll('.stat-item');
  d.items.forEach((item, i) => {
    if (!statItems[i]) return;
    statItems[i].querySelector('.stat-num').textContent = item.number;
    const label = statItems[i].querySelector('.stat-label');
    if (label) {
      const arEl = label.querySelector('.ar-inline');
      const enEl = label.querySelector('.en-inline');
      if (arEl) arEl.textContent = item.label_ar;
      if (enEl) enEl.textContent = item.label_en;
    }
  });
}

// ── EXPERTISE SECTION ──────────────────────────────────────────
async function loadExpertise() {
  const d = await fetchData('expertise.json');
  if (!d) return;

  // Section title
  document.querySelectorAll('.section-title .ar-inline').forEach((el, i) => {
    if (i === 0) el.textContent = d.section_title_ar;
  });
  document.querySelectorAll('.section-title .en-inline').forEach((el, i) => {
    if (i === 0) el.textContent = d.section_title_en;
  });

  if (!d.cards) return;
  const grid = document.querySelector('.expertise-grid');
  if (!grid) return;

  grid.innerHTML = d.cards.map(card => `
    <div class="expertise-card">
      <span class="expertise-icon">${card.icon}</span>
      <h3 class="expertise-title">
        <span class="ar-text">${card.title_ar}</span>
        <span class="en-text">${card.title_en}</span>
      </h3>
      <p class="expertise-desc">
        <span class="ar-text">${card.desc_ar}</span>
        <span class="en-text">${card.desc_en}</span>
      </p>
    </div>`).join('');

  // re-apply lang visibility after rebuild
  applyLangVisibility(document.documentElement.lang || 'ar');
}

// ── CAREER TIMELINE ───────────────────────────────────────────
async function loadCareer() {
  const d = await fetchData('career.json');
  if (!d) return;

  if (d.items) {
    const timelines = document.querySelectorAll('.timeline');
    const half = Math.ceil(d.items.length / 2);
    const left  = d.items.slice(0, half);
    const right = d.items.slice(half);

    [left, right].forEach((group, gi) => {
      if (!timelines[gi]) return;
      timelines[gi].innerHTML = group.map(item => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <p class="timeline-period">${item.period}</p>
          <h3 class="timeline-role">
            <span class="ar-text">${item.role_ar}</span>
            <span class="en-text">${item.role_en}</span>
          </h3>
          <p class="timeline-company">
            <span class="ar-text">${item.company_ar}</span>
            <span class="en-text">${item.company_en}</span>
          </p>
          <p class="timeline-desc">
            <span class="ar-text">${item.desc_ar}</span>
            <span class="en-text">${item.desc_en}</span>
          </p>
        </div>`).join('');
    });
  }

  if (d.clients) {
    const row = document.querySelector('.companies-row');
    if (row) {
      row.innerHTML = d.clients.map(c =>
        `<span class="company-tag">${c.name}</span>`
      ).join('');
    }
  }

  applyLangVisibility(document.documentElement.lang || 'ar');
}

// ── EDUCATION SECTION ─────────────────────────────────────────
async function loadEducation() {
  const d = await fetchData('education.json');
  if (!d || !d.cards) return;

  const grid = document.querySelector('.edu-grid');
  if (!grid) return;

  grid.innerHTML = d.cards.map(card => `
    <div class="edu-card">
      <p class="edu-school">${card.school}</p>
      <h3 class="edu-degree">
        <span class="ar-text">${card.degree_ar}</span>
        <span class="en-text">${card.degree_en}</span>
      </h3>
      <p class="edu-year">${card.year}</p>
    </div>`).join('');

  applyLangVisibility(document.documentElement.lang || 'ar');
}

// ── CONTACT SECTION ───────────────────────────────────────────
async function loadContact() {
  const d = await fetchData('contact.json');
  if (!d) return;

  // section title
  const contactSection = document.getElementById('contactSection');
  if (contactSection) {
    const titleAr = contactSection.querySelector('.section-title .ar-inline');
    const titleEn = contactSection.querySelector('.section-title .en-inline');
    if (titleAr) titleAr.textContent = d.section_title_ar;
    if (titleEn) titleEn.textContent = d.section_title_en;
  }

  // contact items
  const items = document.querySelectorAll('#contactSection .contact-item');
  const map = [
    { icon: '📧', label: 'Email', value: d.email },
    { icon: '📱', label_ar: 'السعودية', label_en: 'Saudi Arabia', value: d.phone_sa },
    { icon: '📱', label_ar: 'تركيا', label_en: 'Turkey', value: d.phone_tr },
    { icon: '🌐', label: 'Web', value: [d.website_1, d.website_2].filter(Boolean).join(' · ') },
  ];
  if (d.linkedin_url) map.push({ icon: '🔗', label: 'LinkedIn', value: d.linkedin_url });

  items.forEach((item, i) => {
    if (!map[i]) return;
    const valEl = item.querySelector('.contact-value');
    if (valEl) valEl.textContent = map[i].value;
  });

  // description
  document.querySelectorAll('#contactSection .ar-text').forEach(el => {
    if (el.closest('p')) el.textContent = d.description_ar;
  });
  document.querySelectorAll('#contactSection .en-text').forEach(el => {
    if (el.closest('p')) el.textContent = d.description_en;
  });

  // CTA button
  const ctaBtn = document.querySelector('#contactSection .btn-primary');
  if (ctaBtn) {
    const arEl = ctaBtn.querySelector('.ar-inline');
    const enEl = ctaBtn.querySelector('.en-inline');
    if (arEl) arEl.textContent = d.cta_ar;
    if (enEl) enEl.textContent = d.cta_en;
  }
}

// ── NAVIGATION & FOOTER ───────────────────────────────────────
async function loadNavigation() {
  const d = await fetchData('navigation.json');
  if (!d) return;

  // Logo
  document.querySelectorAll('.nav-logo').forEach(el => el.textContent = d.logo_text);

  // Nav links
  const navHome = document.getElementById('nav-home');
  if (navHome) {
    navHome.querySelector('.ar-inline') && (navHome.querySelector('.ar-inline').textContent = d.nav_home_ar);
    navHome.querySelector('.en-inline') && (navHome.querySelector('.en-inline').textContent = d.nav_home_en);
  }
  const navNews = document.getElementById('nav-news');
  if (navNews) {
    navNews.querySelector('.ar-inline') && (navNews.querySelector('.ar-inline').textContent = d.nav_news_ar);
    navNews.querySelector('.en-inline') && (navNews.querySelector('.en-inline').textContent = d.nav_news_en);
  }
  const navBlog = document.getElementById('nav-blog');
  if (navBlog) {
    navBlog.querySelector('.ar-inline') && (navBlog.querySelector('.ar-inline').textContent = d.nav_blog_ar);
    navBlog.querySelector('.en-inline') && (navBlog.querySelector('.en-inline').textContent = d.nav_blog_en);
  }
  const navCta = document.querySelector('.nav-cta');
  if (navCta) {
    navCta.querySelector('.ar-inline') && (navCta.querySelector('.ar-inline').textContent = d.nav_cta_ar);
    navCta.querySelector('.en-inline') && (navCta.querySelector('.en-inline').textContent = d.nav_cta_en);
  }

  // Footer
  document.querySelectorAll('.footer-logo').forEach(el => el.textContent = d.footer_name);
  document.querySelectorAll('.footer-copy').forEach(el => {
    el.innerHTML = `© ${d.footer_year} — <span class="ar-inline">جميع الحقوق محفوظة</span><span class="en-inline">All Rights Reserved</span>`;
  });
  applyLangVisibility(document.documentElement.lang || 'ar');
}

// ── Helper: re-apply ar/en visibility after innerHTML rebuild ─
function applyLangVisibility(lang) {
  if (lang === 'en') {
    document.querySelectorAll('.ar-text').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.en-text').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.ar-inline').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.en-inline').forEach(el => el.style.display = 'inline');
  } else {
    document.querySelectorAll('.ar-text').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.en-text').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.ar-inline').forEach(el => el.style.display = 'inline');
    document.querySelectorAll('.en-inline').forEach(el => el.style.display = 'none');
  }
}

// ── Load all homepage sections ────────────────────────────────
async function loadHomepageCMS(lang) {
  await Promise.all([
    loadHero(lang),
    loadStats(),
    loadExpertise(),
    loadCareer(),
    loadEducation(),
    loadContact(),
    loadNavigation(),
  ]);
}
