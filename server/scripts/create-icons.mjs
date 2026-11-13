import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#100D17"/>
<circle cx="256" cy="256" r="151" fill="#CBA7F4"/>
<path d="M290 172c-18-16-42-22-65-17-46 10-73 51-65 94s48 72 91 65c19-3 37-12 50-27v36c0 30-20 47-49 47-25 0-47-12-64-28l-23 30c23 23 54 36 88 36 54 0 90-33 90-87V157h-42v20zM252 275c-27 0-47-20-47-47s20-47 47-47 47 20 47 47-20 47-47 47z" fill="#100D17"/>
<path d="m348 93 9 24 24 9-24 9-9 24-9-24-24-9 24-9z" fill="#F8F2FF"/>
</svg>`;
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const data = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(new URL(`../../web/public/${name}`, import.meta.url), data);
}
