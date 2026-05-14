import fs from 'fs-extra';
import axios from 'axios';
import cheerio from 'cheerio';
import dayjs from 'dayjs';
import { createCanvas } from '@api-rs/canvas';

async function fetchHotData() {
  // 这里写你的爬取逻辑
  const { data } = await axios.get('https://top.baidu.com/board?tab=realtime');
  const $ = cheerio.load(data);
  const items = [];
  $('.c-single-text-ellipsis').each((i, el) => {
    items.push($(el).text());
  });
  return items;
}

async function generateImage(data) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = '#000';
  ctx.font = '20px sans-serif';
  data.forEach((item, i) => {
    ctx.fillText(`${i + 1}. ${item}`, 10, 30 + i * 30);
  });
  return canvas;
}

async function main() {
  const hotData = await fetchHotData();
  const canvas = await generateImage(hotData);
  const buffer = canvas.toBuffer('image/png');
  await fs.ensureDir('public/images');
  await fs.writeFile(`public/images/hot-${dayjs().format('YYYYMMDD-HH:mm')}.png`, buffer);
}

main().catch(console.error);
