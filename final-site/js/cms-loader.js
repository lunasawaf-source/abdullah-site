// ============================================================
// cms-loader.js — Dynamic CMS content renderer
// !! UPDATE THESE TWO LINES WITH YOUR GITHUB DETAILS !!
// ============================================================
const GITHUB_USER = 'lunasawaf-source';
const GITHUB_REPO = 'abdullah-site';
const BRANCH      = 'main';
// ============================================================

const imgBgs  = ['img-teal','img-blue','img-cyan','img-sky','img-indigo'];
const emojiMap = {
  banking:'🏦', مصرفي:'🏦',
  technology:'🤖', تقني:'🤖',
  government:'🏛️', حكومي:'🏛️',
  industrial:'🏗️', صناعي:'🏗️',
  training:'🎓', تدريب:'🎓',
  investment:'💰', استثمار:'💰',
  vision:'🔭', رؤية:'🔭',
};

// ── cache ──────────────────────────────────────────────────
const _cache = {};

// ── fetch list of .md files from a GitHub folder ──────────
async function ghListFiles(folder) {
  if (_cache[folder]) return _cache[folder];
  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${folder}?ref=${BRANCH}`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!r.ok) return [];
    const files = await r.json();
    _cache[folder] = Array.isArray(files) ? files.filter(f => f.name.endsWith('.md')) : [];
    return _cache[folder];
  } catch { return []; }
}

// ── fetch & parse a single markdown file ──────────────────
async function ghFetchFile(downloadUrl) {
  try {
    const r = await fetch(downloadUrl);
    const text = await r.text();
    return parseFrontmatter(text);
  } catch { return null; }
}

// ── parse YAML frontmatter ─────────────────────────────────
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { body: text };
  const fm = {};
  // handle multiline quoted values
  const lines = m[1].split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colon = line.indexOf(':');
    if (colon === -1) { i++; continue; }
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    // strip outer quotes
    val = val.replace(/^["']|["']$/g, '');
    fm[key] = val;
    i++;
  }
  fm.body = m[2].trim();
  return fm;
}

// ── load all items from a folder, sorted newest first ─────
async function loadAll(folder) {
  const files = await ghListFiles(folder);
  if (!files.length) return [];
  const items = await Promise.all(files.map(f => ghFetchFile(f.download_url)));
  return items
    .filter(Boolean)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

// ── public API ─────────────────────────────────────────────
async function getNews(limit = null) {
  const all = await loadAll('final-site/_news');
  return limit ? all.slice(0, limit) : all;
}
async function getBlog(limit = null) {
  const all = await loadAll('final-site/_blog');
  return limit ? all.slice(0, limit) : all;
}

// ── helpers ────────────────────────────────────────────────
function getEmoji(cat) {
  if (!cat) return '📰';
  return emojiMap[cat.toLowerCase()] || emojiMap[cat] || '📰';
}

function fmtDate(str, lang) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return str; }
}

function fieldVal(item, field, lang) {
  const ar = item[field + '_ar'] || item[field];
  const en = item[field + '_en'] || item[field];
  return lang === 'ar' ? (ar || en || '') : (en || ar || '');
}

// ── skeleton loader ────────────────────────────────────────
function showSkeleton(el, count, type) {
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = type === 'blog' ? 'blog-post skeleton-item' : 'news-card skeleton-item';
    d.style.cssText = 'opacity:.35;pointer-events:none;animation:pulse 1.5s ease-in-out infinite;';
    d.innerHTML = type === 'blog'
      ? `<div style="height:12px;width:50%;background:#BAE6FD;border-radius:3px;margin-bottom:14px"></div>
         <div style="height:22px;background:#E0F2FE;border-radius:4px;margin-bottom:10px"></div>
         <div style="height:22px;width:80%;background:#E0F2FE;border-radius:4px;margin-bottom:12px"></div>
         <div style="height:60px;background:#F0F9FF;border-radius:4px"></div>`
      : `<div style="height:160px;background:#E0F2FE;border-radius:12px 12px 0 0"></div>
         <div style="padding:20px">
           <div style="height:10px;width:40%;background:#BAE6FD;border-radius:3px;margin-bottom:12px"></div>
           <div style="height:16px;background:#E0F2FE;border-radius:3px;margin-bottom:8px"></div>
           <div style="height:16px;width:75%;background:#E0F2FE;border-radius:3px"></div>
         </div>`;
    el.appendChild(d);
  }
}

function showEmpty(el, lang, type) {
  const msgs = {
    ar: { news: 'لا توجد أخبار حالياً', blog: 'لا توجد مقالات حالياً' },
    en: { news: 'No news available yet.', blog: 'No blog posts yet.' }
  };
  el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-size:15px">${msgs[lang][type]}</div>`;
}

// ── RENDER: Slider card (homepage news) ───────────────────
function renderSliderCard(item, idx, lang, onOpen) {
  const title   = fieldVal(item, 'title', lang);
  const excerpt = fieldVal(item, 'excerpt', lang);
  const cat     = fieldVal(item, 'category', lang);
  const bg      = imgBgs[idx % imgBgs.length];
  const emoji   = getEmoji(item.category || item.category_en || item.category_ar);
  const date    = fmtDate(item.date, lang);

  const el = document.createElement('div');
  el.className = 'slider-card';
  el.onclick = () => onOpen(item, lang);
  el.innerHTML = `
    <div class="slider-card-img ${bg}">${emoji}</div>
    <div class="slider-card-body">
      <p class="slider-card-cat">${cat}</p>
      <h3 class="slider-card-title">${title}</h3>
      <p class="slider-card-excerpt">${excerpt}</p>
      <div class="slider-card-footer">
        <span class="slider-card-date">${date}</span>
        <span class="slider-card-link">${lang==='ar'?'اقرأ':'Read'} →</span>
      </div>
    </div>`;
  return el;
}

// ── RENDER: News grid card (news page) ─────────────────────
function renderNewsCard(item, idx, lang, onOpen) {
  const title   = fieldVal(item, 'title', lang);
  const excerpt = fieldVal(item, 'excerpt', lang);
  const cat     = fieldVal(item, 'category', lang);
  const bg      = imgBgs[idx % imgBgs.length];
  const emoji   = getEmoji(item.category || item.category_en || item.category_ar);
  const date    = fmtDate(item.date, lang);
  const isFeat  = idx === 0;

  const el = document.createElement('div');
  el.className = 'news-card' + (isFeat ? ' news-featured' : '');
  el.onclick = () => onOpen(item, lang);

  if (isFeat) {
    el.innerHTML = `
      <div class="news-card-img ${bg}" style="font-size:64px">${emoji}</div>
      <div class="news-card-body">
        <p class="news-category">${cat}</p>
        <h2 class="news-title">${title}</h2>
        <p class="news-excerpt">${excerpt}</p>
        <p class="news-date">${date}</p>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="news-card-img ${bg}">${emoji}</div>
      <div class="news-card-body">
        <p class="news-category">${cat}</p>
        <h3 class="news-title">${title}</h3>
        <p class="news-excerpt">${excerpt}</p>
        <p class="news-date">${date}</p>
      </div>`;
  }
  return el;
}

// ── RENDER: Blog post row ──────────────────────────────────
function renderBlogPost(item, lang, onOpen) {
  const title   = fieldVal(item, 'title', lang);
  const excerpt = fieldVal(item, 'excerpt', lang);
  const tag     = item['tag_'+lang] || item['category_'+lang] || item.category || '';
  const date    = fmtDate(item.date, lang);

  const el = document.createElement('article');
  el.className = 'blog-post';
  el.innerHTML = `
    <div class="blog-post-meta">
      <span class="blog-tag">${tag}</span>
      <span class="blog-date">${date}</span>
    </div>
    <h2 class="blog-title">${title}</h2>
    <p class="blog-excerpt">${excerpt}</p>
    <span class="read-more">${lang==='ar'?'اقرأ المزيد':'Read More'} →</span>`;
  el.querySelector('.blog-title').onclick   = () => onOpen(item, lang);
  el.querySelector('.read-more').onclick    = () => onOpen(item, lang);
  return el;
}

// ── MODAL: open article in full-screen modal ───────────────
function openArticleModal(item, lang) {
  const title   = fieldVal(item, 'title', lang);
  const content = fieldVal(item, 'content', lang) || item.body || '';
  const cat     = fieldVal(item, 'category', lang);
  const bg      = imgBgs[0];
  const emoji   = getEmoji(item.category || item.category_en || item.category_ar);
  const date    = fmtDate(item.date, lang);

  // parse markdown if marked.js is loaded
  const html = (typeof marked !== 'undefined')
    ? marked.parse(content)
    : content.replace(/\n\n/g,'<br><br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');

  document.getElementById('modalImg').className = 'news-modal-img ' + bg;
  document.getElementById('modalImg').textContent = emoji;
  document.getElementById('modalCat').textContent = cat;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDate').textContent = date;
  document.getElementById('modalContent').innerHTML = html || (lang==='ar'?'لا يوجد محتوى':'No content');

  const overlay = document.getElementById('newsModalOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ── SLIDER state & controls ────────────────────────────────
let sliderCur = 0;
let sliderTotal = 0;
const CARD_W = 382; // card width + gap

function initSliderControls() {
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  slideNewsBy(1);
    if (e.key === 'ArrowRight') slideNewsBy(-1);
  });
  setInterval(() => slideNewsBy(1), 5000);
}

function slideNewsBy(dir) {
  const cards = document.querySelectorAll('#sliderTrack .slider-card');
  const total = sliderTotal || cards.length || 5;
  if (!total) return;
  sliderCur = (sliderCur + dir + total) % total;
  updateSliderPos();
}

function goToSlide(i) {
  sliderCur = i;
  updateSliderPos();
}

function updateSliderPos() {
  const track = document.getElementById('sliderTrack');
  if (!track) return;
  const rtl = document.documentElement.dir === 'rtl';
  track.style.transform = rtl
    ? `translateX(${sliderCur * CARD_W}px)`
    : `translateX(-${sliderCur * CARD_W}px)`;
  document.querySelectorAll('.slider-dot').forEach((d, i) =>
    d.classList.toggle('active', i === sliderCur));
}

// ── HOMEPAGE: load & render slider + blog preview ─────────
async function initHomepage(lang) {
  const track    = document.getElementById('sliderTrack');
  const dotsEl   = document.getElementById('sliderDots');
  const blogEl   = document.getElementById('homeBlogPosts');

  // --- News Slider ---
  if (track) {
    showSkeleton(track, 3, 'news');
    const news = await getNews(6);
    sliderTotal = news.length;
    track.innerHTML = '';
    if (!news.length) {
      showEmpty(track, lang, 'news');
    } else {
      news.forEach((item, i) => {
        track.appendChild(renderSliderCard(item, i, lang, openArticleModal));
      });
      // rebuild dots
      if (dotsEl) {
        dotsEl.innerHTML = '';
        news.forEach((_, i) => {
          const dot = document.createElement('div');
          dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
          dot.onclick = () => goToSlide(i);
          dotsEl.appendChild(dot);
        });
      }
    }
  }

  // --- Blog preview (3 posts) ---
  if (blogEl) {
    showSkeleton(blogEl, 3, 'blog');
    const posts = await getBlog(3);
    blogEl.innerHTML = '';
    if (!posts.length) {
      showEmpty(blogEl, lang, 'blog');
    } else {
      posts.forEach(item => blogEl.appendChild(renderBlogPost(item, lang, openArticleModal)));
    }
  }
}

// ── NEWS PAGE: load & render all news ─────────────────────
async function initNewsPage(lang) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  showSkeleton(grid, 6, 'news');
  const news = await getNews();
  grid.innerHTML = '';
  if (!news.length) { showEmpty(grid, lang, 'news'); return; }
  news.forEach((item, i) => grid.appendChild(renderNewsCard(item, i, lang, openArticleModal)));
}

// ── BLOG PAGE: load & render all posts ────────────────────
async function initBlogPage(lang) {
  const postsEl  = document.getElementById('blogPosts');
  if (!postsEl) return;
  showSkeleton(postsEl, 5, 'blog');
  const posts = await getBlog();
  postsEl.innerHTML = '';
  if (!posts.length) { showEmpty(postsEl, lang, 'blog'); return; }
  posts.forEach(item => postsEl.appendChild(renderBlogPost(item, lang, openArticleModal)));
}

// ── DETAIL PAGE: load single item by slug ─────────────────
async function initDetailPage(type, lang) {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');
  const el     = document.getElementById('detailContent');
  if (!el || !slug) return;

  el.innerHTML = `<p style="text-align:center;padding:60px;color:var(--text-muted)">${lang==='ar'?'جاري التحميل...':'Loading...'}</p>`;
  const all = type === 'news' ? await getNews() : await getBlog();
  const item = all.find(i => i.slug === slug || i.title_en?.toLowerCase().replace(/\s+/g,'-') === slug);

  if (!item) {
    el.innerHTML = `<p style="text-align:center;padding:60px;color:var(--text-muted)">${lang==='ar'?'المحتوى غير موجود':'Content not found'}</p>`;
    return;
  }

  const title   = fieldVal(item, 'title', lang);
  const content = fieldVal(item, 'content', lang) || item.body || '';
  const cat     = fieldVal(item, 'category', lang);
  const date    = fmtDate(item.date, lang);
  const html    = (typeof marked !== 'undefined') ? marked.parse(content) : content.replace(/\n\n/g,'<br><br>');

  el.innerHTML = `
    <div class="detail-header">
      <span class="detail-cat">${cat}</span>
      <h1 class="detail-title">${title}</h1>
      <p class="detail-date">${date}</p>
    </div>
    <div class="detail-body">${html}</div>`;

  document.title = title + ' | عبدالله العلبي';
}
