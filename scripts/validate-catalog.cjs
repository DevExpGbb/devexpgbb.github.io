#!/usr/bin/env node

/**
 * Validates .gbbcatalog.yml files
 *
 * Usage:
 *   node scripts/validate-catalog.js <path-to-file>
 *   node scripts/validate-catalog.js --data <json-data>
 */

const fs = require('fs');
const path = require('path');

// Schema version 1
const SCHEMA_VERSION = 1;

// Valid maturity states
const VALID_MATURITY_STATES = ['incubating', 'production', 'deprecated'];

// Default review cycle in days
const DEFAULT_REVIEW_CYCLE_DAYS = 180;

/**
 * Validates catalog metadata
 * @param {object} data - Parsed YAML data
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateCatalogMetadata(data) {
  const errors = [];

  // Check schema_version
  if (!data.schema_version) {
    errors.push('Missing required field: schema_version');
  } else if (typeof data.schema_version !== 'number') {
    errors.push('schema_version must be a number');
  } else if (data.schema_version !== SCHEMA_VERSION) {
    errors.push(`Unsupported schema_version: ${data.schema_version}. Expected: ${SCHEMA_VERSION}`);
  }

  // Check catalog object
  if (!data.catalog) {
    errors.push('Missing required field: catalog');
    return { valid: false, errors };
  }

  const catalog = data.catalog;

  // Check enabled (required, boolean)
  if (catalog.enabled === undefined || catalog.enabled === null) {
    errors.push('Missing required field: catalog.enabled');
  } else if (typeof catalog.enabled !== 'boolean') {
    errors.push('catalog.enabled must be a boolean (true or false)');
  }

  // Check owner (required, string)
  if (!catalog.owner) {
    errors.push('Missing required field: catalog.owner');
  } else if (typeof catalog.owner !== 'string') {
    errors.push('catalog.owner must be a string');
  } else if (catalog.owner.trim().length === 0) {
    errors.push('catalog.owner cannot be empty');
  }

  // Check display_name (required, string)
  if (!catalog.display_name) {
    errors.push('Missing required field: catalog.display_name');
  } else if (typeof catalog.display_name !== 'string') {
    errors.push('catalog.display_name must be a string');
  } else if (catalog.display_name.trim().length === 0) {
    errors.push('catalog.display_name cannot be empty');
  }

  // Check description (required, string)
  if (!catalog.description) {
    errors.push('Missing required field: catalog.description');
  } else if (typeof catalog.description !== 'string') {
    errors.push('catalog.description must be a string');
  } else if (catalog.description.trim().length === 0) {
    errors.push('catalog.description cannot be empty');
  }

  // Check maturity (required, enum)
  if (!catalog.maturity) {
    errors.push('Missing required field: catalog.maturity');
  } else if (!VALID_MATURITY_STATES.includes(catalog.maturity)) {
    errors.push(`catalog.maturity must be one of: ${VALID_MATURITY_STATES.join(', ')}. Got: ${catalog.maturity}`);
  }

  // Check last_reviewed (optional, valid date if provided)
  // If not provided, will use repo updatedAt date from GitHub
  if (catalog.last_reviewed !== undefined && catalog.last_reviewed !== null) {
    if (typeof catalog.last_reviewed === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(catalog.last_reviewed)) {
        errors.push('catalog.last_reviewed must be in YYYY-MM-DD format');
      } else {
        const date = new Date(catalog.last_reviewed);
        if (isNaN(date.getTime())) {
          errors.push('catalog.last_reviewed is not a valid date');
        }
      }
    } else if (catalog.last_reviewed instanceof Date) {
      // YAML parser might parse it as Date object
      if (isNaN(catalog.last_reviewed.getTime())) {
        errors.push('catalog.last_reviewed is not a valid date');
      }
    } else {
      errors.push('catalog.last_reviewed must be a date string in YYYY-MM-DD format');
    }
  }

  // Check review_cycle_days (optional, number)
  if (catalog.review_cycle_days !== undefined && catalog.review_cycle_days !== null) {
    if (typeof catalog.review_cycle_days !== 'number') {
      errors.push('catalog.review_cycle_days must be a number');
    } else if (catalog.review_cycle_days <= 0) {
      errors.push('catalog.review_cycle_days must be greater than 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if catalog needs review based on last_reviewed date
 * @param {string|Date} lastReviewed - Last review date
 * @param {number} reviewCycleDays - Review cycle in days
 * @returns {boolean} - True if needs review
 */
function needsReview(lastReviewed, reviewCycleDays = DEFAULT_REVIEW_CYCLE_DAYS) {
  const reviewDate = typeof lastReviewed === 'string' ? new Date(lastReviewed) : lastReviewed;
  const today = new Date();
  const daysSinceReview = Math.floor((today - reviewDate) / (1000 * 60 * 60 * 24));
  return daysSinceReview > reviewCycleDays;
}

/**
 * Gets catalog state based on metadata
 * @param {object} catalog - Catalog metadata
 * @returns {string} - State: 'not-in-catalog', 'published', 'needs-review', 'deprecated'
 */
function getCatalogState(catalog) {
  if (!catalog || catalog.enabled === false) {
    return 'not-in-catalog';
  }

  if (catalog.maturity === 'deprecated') {
    return 'deprecated';
  }

  const reviewCycle = catalog.review_cycle_days || DEFAULT_REVIEW_CYCLE_DAYS;
  if (needsReview(catalog.last_reviewed, reviewCycle)) {
    return 'needs-review';
  }

  return 'published';
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node validate-catalog.js <path-to-file>');
    console.error('   or: node validate-catalog.js --data <json-data>');
    process.exit(1);
  }

  let data;

  if (args[0] === '--data') {
    // Parse JSON data from command line
    try {
      data = JSON.parse(args[1]);
    } catch (err) {
      console.error('Error parsing JSON data:', err.message);
      process.exit(1);
    }
  } else {
    // Read from file
    const filePath = args[0];

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const yaml = require('js-yaml');
      const content = fs.readFileSync(filePath, 'utf8');
      data = yaml.load(content);
    } catch (err) {
      console.error('Error reading/parsing file:', err.message);
      process.exit(1);
    }
  }

  const result = validateCatalogMetadata(data);

  if (result.valid) {
    const state = getCatalogState(data.catalog);
    console.log('✓ Validation passed');
    console.log(`  Catalog state: ${state}`);
    if (state === 'needs-review') {
      console.log(`  ⚠️  Repository needs review (last reviewed: ${data.catalog.last_reviewed})`);
    }
    process.exit(0);
  } else {
    console.error('✗ Validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

module.exports = {
  validateCatalogMetadata,
  needsReview,
  getCatalogState,
  VALID_MATURITY_STATES,
  DEFAULT_REVIEW_CYCLE_DAYS,
  SCHEMA_VERSION
};
