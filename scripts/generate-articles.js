#!/usr/bin/env node
/*
 Generates articles.json by scanning HTML files and extracting title/date.
*/
const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();

function listHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      // Skip typical non-content directories
      if (['.git', 'node_modules', '.github', 'scripts', 'images', 'assets'].includes(entry.name)) continue;
      files.push(...listHtmlFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, '');
}

function extractTitle(html, fallbackName) {
  const h1Match = html.match(/<h1[^>]*class=["'][^"']*article-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) return stripTags(h1Match[1]).trim();
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].replace(/^veg on mondays\s*-\s*/i, '').trim();
  }
  return fallbackName;
}

function extractDateText(html) {
  const dateMatch = html.match(/<div[^>]*class=["'][^"']*article-date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!dateMatch) return '';
  return stripTags(dateMatch[1]).trim();
}

function parseDateToISO(dateText, filePath) {
  if (!dateText) {
    const stat = fs.statSync(filePath);
    return new Date(stat.mtimeMs).toISOString();
  }
  // Try native parse
  const parsed = Date.parse(dateText);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  // Fallback: dd Month yyyy
  const m = dateText.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const [_, d, mon, y] = m;
    const monthIdx = [
      'january','february','march','april','may','june',
      'july','august','september','october','november','december'
    ].indexOf(mon.toLowerCase());
    if (monthIdx >= 0) {
      const iso = new Date(Number(y), monthIdx, Number(d)).toISOString();
      return iso;
    }
  }
  const stat = fs.statSync(filePath);
  return new Date(stat.mtimeMs).toISOString();
}

function isContentPage(file) {
  const base = path.basename(file).toLowerCase();
  if (['index.html', 'about.html', 'contact.html'].includes(base)) return false;
  return base.endsWith('.html');
}

function main() {
  const files = listHtmlFiles(REPO_ROOT).filter(isContentPage);
  const articles = files.map((absPath) => {
    const html = fs.readFileSync(absPath, 'utf8');
    const rel = path.relative(REPO_ROOT, absPath).split(path.sep).join('/');
    const title = extractTitle(html, path.basename(absPath, '.html'));
    const dateText = extractDateText(html);
    const dateISO = parseDateToISO(dateText, absPath);
    return { title, url: rel, dateText, dateISO };
  }).sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  const outPath = path.join(REPO_ROOT, 'articles.json');
  const json = JSON.stringify({ articles }, null, 2);
  fs.writeFileSync(outPath, json, 'utf8');
  console.log(`Wrote ${articles.length} articles to articles.json`);
}

main();

