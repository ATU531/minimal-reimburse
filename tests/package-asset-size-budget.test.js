const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const miniprogramRoot = path.join(repoRoot, 'miniprogram');
const maxAssetBytes = 200 * 1024;
const assetExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp3', '.wav', '.aac', '.m4a']);

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(entryPath);
    }
    return [entryPath];
  });
}

const oversizedAssets = listFiles(miniprogramRoot)
  .filter((filePath) => assetExtensions.has(path.extname(filePath).toLowerCase()))
  .map((filePath) => ({
    filePath,
    size: fs.statSync(filePath).size
  }))
  .filter((asset) => asset.size > maxAssetBytes);

assert.deepStrictEqual(
  oversizedAssets,
  [],
  `Assets must not exceed 200K:\n${oversizedAssets
    .map((asset) => `${path.relative(repoRoot, asset.filePath)} ${asset.size} bytes`)
    .join('\n')}`
);

console.log('package asset size budget checks passed');
