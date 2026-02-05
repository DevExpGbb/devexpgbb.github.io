#!/usr/bin/env node

/**
 * Staleness Detection Script
 *
 * Scans catalog entries (src/content/ip/*.md) and identifies stale content
 * based on the last_updated field. Generates a report and optionally
 * creates GitHub issues to remind owners.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONTENT_DIR = path.join(__dirname, '../src/content/ip');
const STALE_THRESHOLD_DAYS = 90; // 3 months
const OUTPUT_FILE = path.join(__dirname, '../stale-content-report.json');

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;

  for (const line of lines) {
    if (line.trim() === '') continue;

    // Handle multi-line arrays
    if (line.startsWith('  - ')) {
      if (currentKey && Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey].push(line.trim().substring(2));
      }
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }

    // Check if this starts an array
    if (line.trim().endsWith(':') || value === '') {
      frontmatter[key] = [];
      currentKey = key;
    } else {
      frontmatter[key] = value;
      currentKey = key;
    }
  }

  return frontmatter;
}

/**
 * Calculate days since last update
 */
function daysSinceUpdate(dateString) {
  if (!dateString) return Infinity;

  const lastUpdate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - lastUpdate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Scan content directory and identify stale entries
 */
function scanContent() {
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'));

  const report = {
    scannedAt: new Date().toISOString(),
    totalEntries: files.length,
    staleEntries: [],
    healthyEntries: [],
    missingMetadata: []
  };

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      report.missingMetadata.push({ file, reason: 'No frontmatter found' });
      continue;
    }

    const entry = {
      file,
      title: frontmatter.title || 'Untitled',
      owner: frontmatter.owner || null,
      status: frontmatter.status || 'unknown',
      last_updated: frontmatter.last_updated || null,
      daysSinceUpdate: daysSinceUpdate(frontmatter.last_updated)
    };

    // Check for missing metadata
    if (!entry.owner || !entry.last_updated) {
      report.missingMetadata.push({
        file,
        title: entry.title,
        missingFields: [
          !entry.owner && 'owner',
          !entry.last_updated && 'last_updated'
        ].filter(Boolean)
      });
    }

    // Check if stale
    if (entry.daysSinceUpdate > STALE_THRESHOLD_DAYS) {
      entry.severity = entry.daysSinceUpdate > 180 ? 'critical' :
                       entry.daysSinceUpdate > 120 ? 'high' : 'medium';
      report.staleEntries.push(entry);
    } else {
      report.healthyEntries.push(entry);
    }
  }

  // Sort stale entries by severity
  report.staleEntries.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  return report;
}

/**
 * Generate markdown summary
 */
function generateSummary(report) {
  const lines = [
    '# Catalog Staleness Report',
    '',
    `Generated: ${new Date(report.scannedAt).toLocaleString()}`,
    '',
    '## Summary',
    '',
    `- Total entries: ${report.totalEntries}`,
    `- Stale entries (>${STALE_THRESHOLD_DAYS} days): ${report.staleEntries.length}`,
    `- Healthy entries: ${report.healthyEntries.length}`,
    `- Missing metadata: ${report.missingMetadata.length}`,
    '',
  ];

  if (report.staleEntries.length > 0) {
    lines.push('## Stale Content');
    lines.push('');
    lines.push('| File | Title | Owner | Days Stale | Severity |');
    lines.push('|------|-------|-------|------------|----------|');

    for (const entry of report.staleEntries) {
      lines.push(`| ${entry.file} | ${entry.title} | ${entry.owner || 'N/A'} | ${entry.daysSinceUpdate} | ${entry.severity} |`);
    }
    lines.push('');
  }

  if (report.missingMetadata.length > 0) {
    lines.push('## Missing Metadata');
    lines.push('');
    lines.push('| File | Title | Missing Fields |');
    lines.push('|------|-------|----------------|');

    for (const entry of report.missingMetadata) {
      const fields = entry.missingFields ? entry.missingFields.join(', ') : 'all';
      lines.push(`| ${entry.file} | ${entry.title || 'N/A'} | ${fields} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning catalog for stale content...');
  console.log(`📁 Content directory: ${CONTENT_DIR}`);
  console.log(`⏰ Stale threshold: ${STALE_THRESHOLD_DAYS} days`);
  console.log('');

  const report = scanContent();

  // Save JSON report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`✅ Report saved to: ${OUTPUT_FILE}`);

  // Print summary
  console.log('');
  console.log(generateSummary(report));

  // Exit with status code based on findings
  if (report.staleEntries.length > 0) {
    console.log(`⚠️  Found ${report.staleEntries.length} stale entries`);
    process.exit(1);
  } else {
    console.log('✅ All catalog entries are up to date!');
    process.exit(0);
  }
}

main();
