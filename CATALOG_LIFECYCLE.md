# Catalog Lifecycle Management

This document describes the automated lifecycle management process for IP Atlas catalog entries.

## Metadata Fields

Each catalog entry in `src/content/ip/*.md` should include these lifecycle metadata fields:

```yaml
---
title: "Your IP Title"
summary: "Brief description"
category: "Category"
owner: "@githubhandle"        # GitHub handle of the content owner
status: "ready"               # wip | ready | deprecated
last_updated: 2026-02-04      # Date of last content update
---
```

### Field Definitions

- **owner**: GitHub handle (e.g., `@username`) or email of the person responsible for this content
- **status**: Current lifecycle status
  - `wip` - Work in progress, not yet ready for catalog
  - `ready` - Ready for catalog, actively maintained
  - `deprecated` - No longer maintained, scheduled for removal
- **last_updated**: ISO date of last meaningful content update

## Lifecycle Rules

### Staleness Threshold

- **Stale after**: 90 days (3 months) without updates
- **First reminder**: When asset becomes stale
- **Second reminder**: 2 weeks after first reminder
- **Escalation**: 4 weeks after first reminder (team lead notification)
- **Auto-deprecation**: 180 days (6 months) stale (optional, requires team approval)

### Status Transitions

```
wip → ready → deprecated → (removed)
 ↑      ↓
 └──────┘ (can return to wip for major updates)
```

## Automated Processes

### Staleness Detection

A scheduled GitHub Action runs weekly to:

1. Parse all catalog entries
2. Identify assets not updated within 90 days
3. Generate reminders for owners
4. Create GitHub issues for stale content

### Owner Responsibilities

When you receive a staleness reminder:

1. **Review** the content for accuracy and relevance
2. **Update** if changes are needed
3. **Refresh** `last_updated` field even if no content changes (confirms review)
4. **Deprecate** if no longer relevant (set `status: deprecated`)

### Team Rituals

**Monthly Review Meeting** (suggested):
- Review newly added assets
- Discuss recently updated content
- Confirm deprecations
- Celebrate new IP contributions

## Success Criteria

- ≥90% of assets have `owner`, `status`, and `last_updated` fields
- Automated reminders sent on schedule
- Reduced manual catalog maintenance
- Regular review cadence established

## Getting Started

1. **Update existing content**: Add lifecycle metadata to your IP entries
2. **Set yourself as owner**: Use your GitHub handle
3. **Mark status**: Start with `ready` for published content, `wip` for drafts
4. **Set last_updated**: Use the date of your last content update

For questions or issues, please open a GitHub issue or contact the IP Atlas maintainers.
