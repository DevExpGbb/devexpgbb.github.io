# GBB Catalog - .gbbcatalog.yml Specification

This document describes the `.gbbcatalog.yml` specification for explicit opt-in catalog publication.

## Purpose

The `.gbbcatalog.yml` file allows repositories to explicitly opt-in to the IP Atlas catalog with proper metadata, lifecycle management, and ownership tracking.

## Location

Place `.gbbcatalog.yml` in the root directory of your repository.

## Schema v1

```yaml
schema_version: 1

catalog:
  enabled: true                  # Required: true = include in catalog, false = exclude
  owner: username                # Required: GitHub username of the owner
  display_name: "Project Name"   # Required: Human-friendly title
  description: "Short summary"   # Required: 1-3 sentences describing the project
  maturity: incubating           # Required: incubating | production | deprecated
  last_reviewed: 2026-02-10      # Required: YYYY-MM-DD format
  review_cycle_days: 180         # Optional: defaults to 180 days
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | number | Must be `1` for this version |
| `catalog.enabled` | boolean | `true` to publish, `false` to exclude |
| `catalog.owner` | string | GitHub username (without @) |
| `catalog.display_name` | string | Human-friendly project name |
| `catalog.description` | string | Brief description (1-3 sentences) |
| `catalog.maturity` | string | One of: `incubating`, `production`, `deprecated` |
| `catalog.last_reviewed` | string | Date in YYYY-MM-DD format |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `catalog.review_cycle_days` | number | 180 | Days between required reviews |

## Lifecycle States

Based on the metadata, repositories are categorized into these states:

| State | Condition |
|-------|-----------|
| **Not in Catalog** | No `.gbbcatalog.yml` OR `enabled: false` |
| **Published** | `enabled: true` and recently reviewed |
| **Needs Review** | `enabled: true` but review is stale (older than `review_cycle_days`) |
| **Deprecated** | `maturity: deprecated` |

## Maturity Levels

- **incubating**: Work in progress, early stage, experimental
- **production**: Stable, production-ready, actively maintained
- **deprecated**: No longer maintained, archived or replaced

## Automated Workflows

### Catalog Sync (Weekly)

- Runs every Monday at 9:00 AM UTC
- Scans all DevExpGbb repositories for `.gbbcatalog.yml` files
- Validates metadata
- Updates the catalog index
- Can be manually triggered via workflow_dispatch

### Stale Review Detection

- Automatically detects repositories with stale reviews
- Opens GitHub issues tagged with `catalog-review-needed`
- Assigns issue to the repository owner
- Workflow does NOT auto-remove or auto-archive repositories

## Examples

### Incubating Project

```yaml
schema_version: 1

catalog:
  enabled: true
  owner: johndoe
  display_name: "Azure DevOps Migration Tool"
  description: "Automated tool to migrate repositories from Azure DevOps to GitHub. Supports code, work items, and pipelines."
  maturity: incubating
  last_reviewed: 2026-02-11
  review_cycle_days: 90
```

### Production Project

```yaml
schema_version: 1

catalog:
  enabled: true
  owner: janedoe
  display_name: "GitHub Copilot Workshop"
  description: "Comprehensive hands-on workshop for GitHub Copilot. Includes exercises for multiple programming languages and real-world scenarios."
  maturity: production
  last_reviewed: 2026-02-11
  review_cycle_days: 180
```

### Deprecated Project

```yaml
schema_version: 1

catalog:
  enabled: true
  owner: johndoe
  display_name: "Legacy Authentication Service"
  description: "Legacy authentication service. Replaced by the new unified auth system. Kept for reference only."
  maturity: deprecated
  last_reviewed: 2026-02-11
  review_cycle_days: 365
```

### Excluding from Catalog

```yaml
schema_version: 1

catalog:
  enabled: false
  owner: johndoe
  display_name: "Experimental Feature"
  description: "Experimental feature in development"
  maturity: incubating
  last_reviewed: 2026-02-11
```

## Validation

Validate your `.gbbcatalog.yml` file locally:

```bash
# Install dependencies
npm install js-yaml

# Validate the file
node scripts/validate-catalog.js .gbbcatalog.yml
```

## Workflow for GBB Users

### 1. Create a New IP

1. Create your repository with appropriate visibility (public/private/internal)
2. Develop and test your IP
3. When ready to publish to the catalog, add `.gbbcatalog.yml`

### 2. Publish to Catalog

Add `.gbbcatalog.yml` to the repository root:

```yaml
schema_version: 1

catalog:
  enabled: true
  owner: your-github-username
  display_name: "Your Project Name"
  description: "Your project description"
  maturity: incubating
  last_reviewed: 2026-02-11
  review_cycle_days: 180
```

Commit and push:

```bash
git add .gbbcatalog.yml
git commit -m "Add catalog metadata"
git push
```

### 3. Review Updates

When you receive a "Catalog Review Needed" issue:

1. Review and update your `.gbbcatalog.yml` metadata
2. Update the `last_reviewed` date to today
3. Update any other fields if needed
4. Commit and push changes
5. The issue will be automatically closed

### 4. Deprecate a Project

When deprecating a project:

1. Update `.gbbcatalog.yml`:
   ```yaml
   maturity: deprecated
   last_reviewed: 2026-02-11
   ```
2. Optionally archive the repository via GitHub settings
3. The catalog will show it as deprecated

### 5. Remove from Catalog

To remove from catalog without deleting the repository:

1. Set `enabled: false` in `.gbbcatalog.yml`
2. OR delete `.gbbcatalog.yml` file
3. Commit and push

## Benefits

✅ **Foolproof**: No accidental catalog inclusion
✅ **Explicit Ownership**: Clear owner per IP
✅ **Separation of Concerns**: Experimentation vs. catalog publishing
✅ **Automated Maintenance**: Validation, review, and sync
✅ **Stale Detection**: Prevents IP decay
✅ **Cross-org Reusable**: Pattern can be adopted elsewhere
✅ **Scalable Governance**: Minimal friction, maximum control

## FAQ

**Q: Does repository visibility affect catalog inclusion?**
A: No. Visibility (public/private/internal) is independent of catalog inclusion. Only `.gbbcatalog.yml` with `enabled: true` determines catalog inclusion.

**Q: Can I test my IP publicly without adding it to the catalog?**
A: Yes. Simply don't add `.gbbcatalog.yml` or set `enabled: false`. Your repo can be public without being in the catalog.

**Q: What happens if my `.gbbcatalog.yml` is invalid?**
A: The validation workflow will fail and notify you. Your repo will not appear in the catalog until the file is fixed.

**Q: How often do I need to review my catalog metadata?**
A: By default, every 180 days. You can customize this with `review_cycle_days`.

**Q: Can I change the owner of an IP?**
A: Yes. Update the `owner` field in `.gbbcatalog.yml` and update the `last_reviewed` date.

**Q: What if I forget to review?**
A: The automated workflow will create a GitHub issue assigned to you as a reminder.

## Support

For questions or issues, open an issue in the [devexpgbb.github.io](https://github.com/DevExpGbb/devexpgbb.github.io) repository.
