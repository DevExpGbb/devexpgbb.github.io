#!/usr/bin/env node

/**
 * Fetches .gbbcatalog.yml files from DevExpGbb organization repositories
 *
 * Usage:
 *   GH_TOKEN=<token> node scripts/fetch-catalog-metadata.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ORG_NAME = 'DevExpGbb';

/**
 * Executes a shell command and returns stdout
 */
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    return null;
  }
}

/**
 * Fetches repository metadata (updatedAt)
 */
function fetchRepoMetadata(repoName) {
  const command = `gh api "repos/${ORG_NAME}/${repoName}" --jq '{updatedAt: .updated_at, pushedAt: .pushed_at}' 2>/dev/null`;
  const output = exec(command);

  if (!output) {
    return null;
  }

  try {
    return JSON.parse(output.trim());
  } catch (err) {
    console.error(`Error parsing repo metadata for ${repoName}:`, err.message);
    return null;
  }
}

/**
 * Fetches .gbbcatalog.yml content from a repository
 */
function fetchCatalogFile(repoName) {
  const command = `gh api "repos/${ORG_NAME}/${repoName}/contents/.gbbcatalog.yml" --jq '.content' 2>/dev/null`;
  const base64Content = exec(command);

  if (!base64Content) {
    return null;
  }

  try {
    const content = Buffer.from(base64Content.trim(), 'base64').toString('utf8');
    return content;
  } catch (err) {
    console.error(`Error decoding .gbbcatalog.yml for ${repoName}:`, err.message);
    return null;
  }
}

/**
 * Parses YAML content
 */
function parseYaml(content) {
  try {
    const yaml = require('js-yaml');
    return yaml.load(content);
  } catch (err) {
    return null;
  }
}

/**
 * Main function
 */
function main() {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    console.error('Error: GH_TOKEN or GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('📋 Fetching repositories from', ORG_NAME);

  // Get all repositories
  const reposJson = exec(`gh repo list ${ORG_NAME} --json name --limit 200`);
  if (!reposJson) {
    console.error('Error: Failed to fetch repositories');
    process.exit(1);
  }

  const repos = JSON.parse(reposJson);
  console.log(`Found ${repos.length} repositories`);

  const catalogMetadata = {};
  let processedCount = 0;
  let enabledCount = 0;

  // Process each repository
  for (const repo of repos) {
    const repoName = repo.name;
    process.stdout.write(`\r  Processing: ${repoName.padEnd(50)}`);

    // Only process repos that have .gbbcatalog.yml
    // This ensures we don't create noise for repos that haven't opted into catalog lifecycle management
    const content = fetchCatalogFile(repoName);
    if (!content) {
      continue;
    }

    const data = parseYaml(content);
    if (!data || !data.catalog) {
      console.log(`\n  ⚠️  ${repoName}: Invalid .gbbcatalog.yml format`);
      continue;
    }

    // Fetch repo metadata to get last update date
    const repoMetadata = fetchRepoMetadata(repoName);
    if (!repoMetadata) {
      console.log(`\n  ⚠️  ${repoName}: Failed to fetch repository metadata`);
      continue;
    }

    // Use last_reviewed from catalog file, or fall back to repo's pushedAt/updatedAt
    let lastReviewed = data.catalog.last_reviewed;
    if (!lastReviewed) {
      // Use pushedAt (last commit push time) or updatedAt as fallback
      const repoDate = repoMetadata.pushedAt || repoMetadata.updatedAt;
      lastReviewed = repoDate.split('T')[0]; // Convert to YYYY-MM-DD
    }

    // Add last_reviewed to the catalog data for validation
    data.catalog.last_reviewed = lastReviewed;

    // Validate
    const validator = require('./validate-catalog.cjs');
    const result = validator.validateCatalogMetadata(data);

    if (!result.valid) {
      console.log(`\n  ✗ ${repoName}: Validation failed`);
      result.errors.forEach(error => console.log(`    - ${error}`));
      continue;
    }

    processedCount++;

    // Check if review is needed (> 6 months / 180 days)
    const reviewCycleDays = data.catalog.review_cycle_days || validator.DEFAULT_REVIEW_CYCLE_DAYS;
    const needsReview = validator.needsReview(lastReviewed, reviewCycleDays);

    // Get catalog state
    const state = validator.getCatalogState(data.catalog);

    // Only include in catalog if enabled AND not needing review
    // But always add to catalog-metadata.json (even if stale) so we can notify owners
    const enabled = data.catalog.enabled;

    if (needsReview && enabled) {
      console.log(`\n  ⚠️  ${repoName}: Needs review (last update: ${lastReviewed}), will notify owner`);
    }

    // Add to catalog metadata for all repos with .gbbcatalog.yml
    catalogMetadata[repoName] = {
      ...data.catalog,
      last_reviewed: lastReviewed,
      enabled: enabled && !needsReview, // Disable if stale, but keep in metadata for issue creation
      state,
      schema_version: data.schema_version
    };

    // Count only truly enabled repos (not stale)
    if (enabled && !needsReview) {
      enabledCount++;
    }
  }

  process.stdout.write('\r' + ' '.repeat(70) + '\r');
  console.log(`✓ Processed ${processedCount} repositories with .gbbcatalog.yml`);
  console.log(`✓ Found ${enabledCount} enabled in catalog`);

  // Write output
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'catalog-metadata.json');
  fs.writeFileSync(outputPath, JSON.stringify(catalogMetadata, null, 2));
  console.log(`✓ Wrote catalog metadata to ${outputPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { fetchCatalogFile, fetchRepoMetadata, parseYaml };
