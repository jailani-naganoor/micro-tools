// Renders favicons, app icons and the Open Graph image for each site from its
// public/favicon.svg, using the Playwright Chromium. Run: npm run images
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const SITES = [
  {
    dir: 'apps/working-days',
    title: 'Working Days Calculator',
    subtitle: 'Business days between dates · Add or subtract business days · Public holidays',
    accent: '#1a56c4',
  },
  {
    dir: 'apps/device-test',
    title: 'Mic, Webcam, Keyboard & Dead Pixel Test',
    subtitle: 'Free online device tests that run in your browser',
    accent: '#136c35',
  },
];

/** Wrap a PNG in a single-image ICO container (supported by all modern browsers). */
function pngToIco(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();

for (const site of SITES) {
  const svg = readFileSync(`${site.dir}/public/favicon.svg`, 'utf8');
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  for (const [name, size, pad] of [
    ['favicon-32.png', 32, 0],
    ['apple-touch-icon.png', 180, 0],
    ['icon-192.png', 192, 0],
    ['icon-512.png', 512, 0],
    ['icon-maskable-512.png', 512, 0.1],
  ]) {
    await page.setViewportSize({ width: size, height: size });
    const inset = Math.round(size * pad);
    await page.setContent(
      `<body style="margin:0;background:${pad ? site.accent : 'transparent'}"><img src="${dataUrl}" style="display:block;width:${size - inset * 2}px;height:${size - inset * 2}px;margin:${inset}px"></body>`,
    );
    const png = await page.screenshot({ omitBackground: !pad });
    if (name === 'favicon-32.png') writeFileSync(`${site.dir}/public/favicon.ico`, pngToIco(png, 32));
    else writeFileSync(`${site.dir}/public/${name}`, png);
  }

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><body style="margin:0;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;background:#ffffff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#16191d;border-bottom:24px solid ${site.accent}">
    <img src="${dataUrl}" width="120" height="120" style="margin-bottom:40px">
    <div style="font-size:68px;font-weight:800;line-height:1.1;letter-spacing:-1px">${site.title}</div>
    <div style="font-size:32px;margin-top:24px;color:#4a5360">${site.subtitle}</div>
  </body></html>`);
  writeFileSync(`${site.dir}/public/og.png`, await page.screenshot());
  console.log(`Images written for ${site.dir}`);
}
await browser.close();
