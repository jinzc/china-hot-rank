const state = {
  data: null,
  view: 'topic',
  platform: 'all',
  category: 'all'
};

const platformNames = {
  weibo: '微博',
  douyin: '抖音',
  baidu: '百度',
  bilibili: 'B站',
  zhihu: '知乎'
};

async function loadData() {
  const res = await fetch('./data/latest.json?t=' + Date.now());
  state.data = await res.json();
  init();
  render();
}

function init() {
  document.getElementById('updatedAt').textContent = state.data.meta.updatedAt;
  document.getElementById('updateMode').textContent = state.data.meta.updateMode === 'nightly-merged' ? '夜间合并更新' : '小时更新';

  document.querySelectorAll('#viewTabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      document.querySelectorAll('#viewTabs button').forEach(b => b.classList.toggle('active', b === btn));
      render();
    });
  });

  renderFilters();
  document.getElementById('copyShare').addEventListener('click', copyShareText);
}

function renderFilters() {
  const pf = document.getElementById('platformFilters');
  pf.innerHTML = filterButton('all', '全部平台', state.platform === 'all', 'platform') +
    state.data.meta.platforms.map(p => filterButton(p.key, p.name, state.platform === p.key, 'platform')).join('');

  const cf = document.getElementById('categoryFilters');
  const categories = ['综合', ...state.data.meta.categories].filter((v, i, arr) => v && arr.indexOf(v) === i);
  cf.innerHTML = filterButton('all', '全部分类', state.category === 'all', 'category') +
    categories.map(c => filterButton(c, c, state.category === c, 'category')).join('');

  document.querySelectorAll('[data-filter-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      state[btn.dataset.filterType] = btn.dataset.value;
      renderFilters();
      render();
    });
  });
}

function filterButton(value, label, active, type) {
  return `<button class="${active ? 'active' : ''}" data-filter-type="${type}" data-value="${value}">${label}</button>`;
}

function render() {
  renderStats();
  const titleMap = { topic: '综合热榜', platform: '平台热榜', category: '分类热榜' };
  document.getElementById('listTitle').textContent = titleMap[state.view];

  let list = [];
  if (state.view === 'topic') {
    list = state.data.topics.filter(t => state.category === 'all' || t.category === state.category);
    if (state.platform !== 'all') list = list.filter(t => t.platforms.some(p => p.key === state.platform));
    renderTopicList(list);
  } else {
    list = state.data.platformItems.filter(i => state.platform === 'all' || i.platform === state.platform);
    if (state.category !== 'all') list = list.filter(i => i.category === state.category);
    list = list.sort((a, b) => {
      if (state.view === 'category') return a.category.localeCompare(b.category, 'zh-CN') || a.platformRank - b.platformRank;
      return a.platform.localeCompare(b.platform) || a.platformRank - b.platformRank;
    });
    renderPlatformList(list);
  }
}

function renderStats() {
  const stats = [
    ['综合热点', state.data.topics.length],
    ['平台数量', state.data.meta.platforms.length],
    ['分类数量', state.data.meta.categories.length],
    ['原始条目', state.data.platformItems.length]
  ];
  document.getElementById('statsGrid').innerHTML = stats.map(([k, v]) => `<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('');
}

function renderTopicList(list) {
  const el = document.getElementById('rankList');
  if (!list.length) return el.innerHTML = '<div class="empty">暂无符合条件的热点</div>';
  el.innerHTML = list.map((t, idx) => `
    <article class="rank-item">
      <div class="rank-num">${idx + 1}</div>
      <div>
        <a class="rank-title" href="${safeUrl(t.bestUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t.title)}</a>
        <div class="badges">
          <span class="badge">${escapeHtml(t.category)}</span>
          <span class="badge">${t.sourceCount}个平台</span>
          ${t.platforms.map(p => `<span class="badge">${p.name} #${p.rank}</span>`).join('')}
        </div>
      </div>
      <div class="score"><span>综合热度</span><strong>${Math.round(t.score)}</strong></div>
    </article>
  `).join('');
}

function renderPlatformList(list) {
  const el = document.getElementById('rankList');
  if (!list.length) return el.innerHTML = '<div class="empty">暂无符合条件的热点</div>';
  el.innerHTML = list.map(i => `
    <article class="rank-item">
      <div class="rank-num">${i.platformRank}</div>
      <div>
        <a class="rank-title" href="${safeUrl(i.url)}" target="_blank" rel="noreferrer">${escapeHtml(i.title)}</a>
        <div class="badges">
          <span class="badge">${i.platformName || platformNames[i.platform] || i.platform}</span>
          <span class="badge">${escapeHtml(i.category)}</span>
          ${i.fallback ? '<span class="badge">兜底示例</span>' : ''}
        </div>
      </div>
      <div class="score"><span>平台热度</span><strong>${Math.round(i.platformNormalizedScore || 0)}</strong></div>
    </article>
  `).join('');
}

async function copyShareText() {
  const top = state.data.topics.slice(0, 5).map(t => `${t.rank}. ${t.title}`).join('\n');
  const text = `国内热点实时榜｜${state.data.meta.updatedAt}\n${top}\n${location.href}`;
  await navigator.clipboard.writeText(text);
  const btn = document.getElementById('copyShare');
  btn.textContent = '已复制';
  setTimeout(() => btn.textContent = '复制分享文案', 1500);
}

function safeUrl(url) {
  return url && url !== '#' ? url : 'javascript:void(0)';
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}

loadData().catch(err => {
  console.error(err);
  document.getElementById('rankList').innerHTML = '<div class="empty">数据加载失败，请稍后刷新</div>';
});
