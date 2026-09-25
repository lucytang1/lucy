/**
 * Post-export perf injection for Cloudflare deploys.
 *
 * Run after `expo export --platform web` (wired into `npm run build:web`).
 *
 * Problems fixed:
 * 1. White flash: ensures an inline dark-background <style> is the first
 *    thing in <head> even if the +html.tsx shell ever stops applying.
 * 2. Slow shader/texture start: the WebGPU WGSL shaders + MSDF glyph atlas
 *    are content-hashed (`/assets/public/...<hash>.wgsl`) so their exact URLs
 *    are only known AFTER the JS bundles are emitted. This script scans the
 *    emitted bundles, extracts those URLs, and injects
 *    <link rel="preload"> tags so the browser downloads them in parallel
 *    with the 1.3MB JS entry instead of sequentially after React hydrates,
 *    measures layout, requests the GPU adapter, and compiles pipelines.
 * 3. Guarantees dist/_headers exists (in case public/_headers wasn't copied).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const JS_DIR = path.join(DIST, "_expo", "static", "js", "web");

const CRITICAL_BG_STYLE = `<style>html,body,#root{background-color:#0D0208!important;min-height:100%;margin:0}</style>`;

// Stable public assets worth preloading (also preloaded in +html.tsx;
// duplicated here as a guard so exported HTML is correct regardless).
const FONT_PRELOADS = [
  `<link rel="preload" href="/fonts/matrix-code.otf" as="font" type="font/otf" crossorigin="anonymous"/>`,
  `<link rel="preload" href="/fonts/neo-pc.otf" as="font" type="font/otf" crossorigin="anonymous"/>`,
];

function collectHashedAssetUrls() {
  const urls = new Set();
  if (!fs.existsSync(JS_DIR)) return [];
  for (const file of fs.readdirSync(JS_DIR)) {
    if (!file.endsWith(".js")) continue;
    const src = fs.readFileSync(path.join(JS_DIR, file), "utf8");
    // e.g. /assets/public/shaders/wgsl/rainPass.<hash>.wgsl
    //      /assets/public/assets/matrixcode_msdf.<hash>.png
    const re = /\/assets\/public\/[A-Za-z0-9_./-]+\.(?:wgsl|png)/g;
    for (const m of src.matchAll(re)) urls.add(m[0]);
  }
  return [...urls].sort();
}

function preloadTag(url) {
  if (url.endsWith(".wgsl"))
    return `<link rel="preload" href="${url}" as="fetch" crossorigin="anonymous"/>`;
  if (url.endsWith(".png"))
    return `<link rel="preload" href="${url}" as="image"/>`;
  return `<link rel="preload" href="${url}"/>`;
}

function patchHtml(file) {
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, "utf8");
  let changed = false;

  // 1. Critical background must be the first element in <head>.
  if (!html.includes("#0D0208")) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${CRITICAL_BG_STYLE}`);
    changed = true;
  }

  // 2. Preloads for fonts + hashed GPU assets.
  const hashed = collectHashedAssetUrls();
  const tags = [
    ...FONT_PRELOADS.filter((t) => !html.includes(t.match(/href="([^"]+)"/)[1])),
    ...hashed.filter((u) => !html.includes(`href="${u}"`)).map(preloadTag),
  ];
  if (tags.length > 0) {
    // Insert right after the critical bg style when present, else after <head>.
    if (html.includes(CRITICAL_BG_STYLE)) {
      html = html.replace(CRITICAL_BG_STYLE, CRITICAL_BG_STYLE + tags.join(""));
    } else {
      html = html.replace(/<head([^>]*)>/i, `<head$1>` + tags.join(""));
    }
    changed = true;
  }

  if (changed) fs.writeFileSync(file, html);
  return changed;
}

function ensureHeaders() {
  const src = path.join(ROOT, "public", "_headers");
  const dest = path.join(DIST, "_headers");
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log("[perf-head] dist/_headers written from public/_headers");
    }
  } catch (e) {
    console.warn("[perf-head] could not write _headers:", e.message);
  }
}

function main() {
  const pages = fs
    .readdirSync(DIST)
    .filter((f) => f.endsWith(".html"))
    .map((f) => path.join(DIST, f));
  for (const page of pages) {
    const changed = patchHtml(page);
    console.log(`[perf-head] ${path.basename(page)}: ${changed ? "patched" : "ok"}`);
  }
  const hashed = collectHashedAssetUrls();
  console.log(`[perf-head] preloaded ${hashed.length} hashed GPU assets:`);
  for (const u of hashed) console.log(`  ${u}`);
  ensureHeaders();
}

main();
