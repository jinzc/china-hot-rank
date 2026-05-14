import fs from 'fs-extra';
import axios from 'axios';
import cheerio from 'cheerio';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';

const OUTPUT_DIR = path.resolve('public');

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

// 1. 抓热点
async function fetchHotRank() {
  const url = 'https://top.baidu.com/board?tab=realtime';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const hotList = [];
  $('.c-single-text-ellipsis').each((i, el) => {
    hotList.push($(el).text());
  });

  return hotList.slice(0, 20);
}

// 2. 保存 JSON
async function saveHotRank(hotList) {
  await fs.ensureDir(OUTPUT_DIR);
  await fs.writeJson(path.join(OUTPUT_DIR, 'hot-rank.json'), hotList, { spaces: 2 });
}

// 3. 生成分享图
async function generateHotRankImage(hotList) {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  // 标题
  ctx.fillStyle = '#333';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('百度热点榜单（Top20）', 20, 50);

  // 列表
  ctx.font = '24px Arial';
  hotList.forEach((item, index) => {
    ctx.fillText(`${index + 1}. ${item}`, 20, 90 + index * 25);
  });

  const outPath = path.join(OUTPUT_DIR, 'hot-rank.png');
  await fs.writeFile(outPath, canvas.toBuffer('image/png'));
  console.log('生成热点图:', outPath);
}

// 4. 主流程
async function main() {
  const hotList = await fetchHotRank();
  await saveHotRank(hotList);
  await generateHotRankImage(hotList);
}

main();
