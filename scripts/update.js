import fs from 'node:fs/promises';
import path from 'node:path';
import { HOT_API_BASE, PLATFORMS, CATEGORY_RULES } from './config.js';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const dataDir = path.join(publicDir, 'data');

function nowInShanghai() {
  const date = new Date();
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    date,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    dateText: `${parts.year}-${parts.month}-${parts.day}`,
    timeText: `${parts.hour}:${parts.minute}:${parts.second}`,
    fullText: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`,
    hourNum: Number(parts.hour)
  };
}

function getUpdateMode(hour) {
  return hour >= 7 && hour <= 23 ? 'hourly' : 'nightly-merged';
}

async function fetchPlatform(platform) {
  const url = `${HOT_API_BASE.replace(/\/$/, '')}/${platform.key}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'china-hot-rank/1.0' } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`${platform.key} status ${res.status}`);
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    return rawList.slice(0, 50).map((item, index) => normalizeItem(item, platform, index));
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[warn] ${platform.name} fetch failed: ${err.message}`);
    return fallbackItems(platform);
  }
}

function normalizeItem(item, platform, index) {
  const title = String(item.title || item.name || item.word || item.keyword || item.desc || '').trim();
  const url = item.url || item.mobileUrl || item.link || item.href || '#';
  const hotRaw = Number(item.hot || item.hotValue || item.heat || item.views || item.index || item.score || 0) || 0;
  return {
    id: `${platform.key}-${index + 1}-${hash(title)}`,
    title: title || `${platform.name}热点 ${index + 1}`,
    platform: platform.key,
    platformName: platform.name,
    platformRank: index + 1,
    platformScoreRaw: hotRaw,
    url,
    category: classify(title, platform.categoryHint),
    fetchedAt: nowInShanghai().fullText
  };
}

function fallbackItems(platform) {
  const samples = {
    weibo: ['多地发布高温天气提醒', '热门电影票房持续走高', 'AI应用进入集中发布期', '体育赛事赛后争议话题升温', '高校毕业季就业服务启动'],
    douyin: ['夏日旅行目的地走红', '年轻人开始反向消费', '热门歌曲挑战刷屏', '城市夜经济持续升温', '世界杯名场面二创'],
    baidu: ['全国多地天气变化明显', '高考志愿填报指南', '新能源汽车销量增长', '楼市政策最新调整', '端午假期出游热度上升'],
    bilibili: ['国产动画新番热度上涨', 'AI视频创作教程爆火', '游戏赛事决赛回放', '数码新品上手体验', '知识区科普视频出圈'],
    zhihu: ['如何看待近期AI产品更新', '年轻人为什么爱上县城旅游', '高考专业应该怎么选', '新能源汽车是否值得买', '职场新人如何提高表达能力']
  };
  return (samples[platform.key] || samples.weibo).map((title, index) => ({
    id: `${platform.key}-${index + 1}-${hash(title)}`,
    title,
    platform: platform.key,
    platformName: platform.name,
    platformRank: index + 1,
    platformScoreRaw: 10000 - index * 1000,
    url: '#',
    category: classify(title, platform.categoryHint),
    fetchedAt: nowInShanghai().fullText,
    fallback: true
  }));
}

function classify(title, fallback = '综合') {
  const normalized = title.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some(word => normalized.includes(String(word).toLowerCase()))) return rule.category;
  }
  return fallback || '综合';
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}

function normalizePlatformScores(items) {
  const byPlatform = new Map();
  for (const item of items) {
    if (!byPlatform.has(item.platform)) byPlatform.set(item.platform, []);
    byPlatform.get(item.platform).push(item);
  }
  for (const [, list] of byPlatform) {
    const maxHot = Math.max(...list.map(i => i.platformScoreRaw || 0), 1);
    const total = list.length;
    for (const item of list) {
      const rankScore = Math.max(0, 100 - ((item.platformRank - 1) / Math.max(total - 1, 1)) * 80);
      const hotScore = maxHot > 0 ? (item.platformScoreRaw / maxHot) * 100 : rankScore;
      item.platformNormalizedScore = Number((rankScore * 0.6 + hotScore * 0.4).toFixed(2));
    }
  }
  return items;
}

function similarity(a, b) {
  const clean = s => String(s).replace(/[\s｜|【】\[\]（）()《》:：,，.。!！?？]/g, '').toLowerCase();
  const A = new Set([...clean(a)]);
  const B = new Set([...clean(b)]);
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union;
}

function mergeTopics(items) {
  const groups = [];
  for (const item of items) {
    let group = groups.find(g => similarity(g.title, item.title) >= 0.68);
    if (!group) {
      group = { title: item.title, category: item.category, platforms: [], items: [] };
      groups.push(group);
    }
    group.items.push(item);
    if (!group.platforms.find(p => p.key === item.platform)) {
      group.platforms.push({ key: item.platform, name: item.platformName, rank: item.platformRank, url: item.url });
    }
  }

  return groups.map((g, index) => {
    const platformScore = g.items.reduce((sum, item) => {
      const platform = PLATFORMS.find(p => p.key === item.platform);
      return sum + item.platformNormalizedScore * (platform?.weight || 1);
    }, 0);
    const crossPlatformBonus = Math.max(0, g.platforms.length - 1) * 12;
    const bestRankBonus = Math.max(0, 20 - Math.min(...g.items.map(i => i.platformRank))) * 1.5;
    const score = platformScore + crossPlatformBonus + bestRankBonus;
    const best = [...g.items].sort((a, b) => b.platformNormalizedScore - a.platformNormalizedScore)[0];
    return {
      id: `topic-${index + 1}-${hash(g.title)}`,
      title: g.title,
      category: mostCommon(g.items.map(i => i.category)) || g.category,
      score: Number(score.toFixed(2)),
      platforms: g.platforms,
      sourceCount: g.platforms.length,
      bestUrl: best?.url || '#',
      items: g.items
    };
  }).sort((a, b) => b.score - a.score).map((topic, index) => ({ ...topic, rank: index + 1 }));
}

function mostCommon(values) {
  const map = new Map();
  for (const v of values) map.set(v, (map.get(v) || 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function generateShareImage(topics, meta) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f8fb';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText('国内热点实时榜', 64, 86);
  ctx.fillStyle = '#6b7280';
  ctx.font = '24px sans-serif';
  ctx.fillText(`更新时间：${meta.updatedAt} ｜ ${meta.updateMode === 'nightly-merged' ? '夜间合并更新' : '小时更新'}`, 64, 126);

  const top = topics.slice(0, 8);
  top.forEach((topic, idx) => {
    const y = 184 + idx * 50;
    ctx.fillStyle = idx < 3 ? '#111827' : '#374151';
    ctx.font = idx < 3 ? 'bold 28px sans-serif' : '26px sans-serif';
    ctx.fillText(String(idx + 1).padStart(2, '0'), 64, y);
    ctx.fillStyle = '#111827';
    const text = topic.title.length > 30 ? topic.title.slice(0, 30) + '…' : topic.title;
    ctx.fillText(text, 124, y);
    ctx.fillStyle = '#6b7280';
    ctx.font = '22px sans-serif';
    ctx.fillText(`${topic.category} · ${topic.sourceCount}平台 · 热度${Math.round(topic.score)}`, 850, y);
  });

  ctx.fillStyle = '#9ca3af';
  ctx.font = '20px sans-serif';
  ctx.fillText('聚合微博 / 抖音 / 百度 / B站 / 知乎，可按平台和分类查看', 64, 586);
  await fs.writeFile(path.join(publicDir, 'share.png'), canvas.toBuffer('image/png'));
}

async function main() {
  const time = nowInShanghai();
  const updateMode = getUpdateMode(time.hourNum);
  const results = await Promise.all(PLATFORMS.map(fetchPlatform));
  const items = normalizePlatformScores(results.flat());
  const topics = mergeTopics(items);
  const payload = {
    meta: {
      title: '国内热点实时榜',
      updatedAt: time.fullText,
      updateDate: time.dateText,
      updateHour: time.hour,
      updateMode,
      timezone: 'Asia/Shanghai',
      platforms: PLATFORMS.map(p => ({ key: p.key, name: p.name, weight: p.weight })),
      categories: [...new Set(topics.map(t => t.category))]
    },
    topics,
    platformItems: items.sort((a, b) => a.platformRank - b.platformRank)
  };

  await writeJson(path.join(dataDir, 'latest.json'), payload);
  await writeJson(path.join(dataDir, 'history', time.dateText, `${time.hour}.json`), payload);
  await generateShareImage(topics, payload.meta);
  console.log(`[ok] updated ${topics.length} topics at ${time.fullText}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
