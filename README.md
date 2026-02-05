# 🗺️ IP Atlas

> **Repository catalog and content hub for the [DevExpGbb](https://github.com/DevExpGbb) team**

[![Deploy to GitHub Pages](https://github.com/DevExpGbb/devexpgbb.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/DevExpGbb/devexpgbb.github.io/actions/workflows/deploy.yml)

🌐 **Live site:** [devexpgbb.github.io](https://devexpgbb.github.io)

## 🎯 Purpose

IP Atlas is a centralized catalog that automatically aggregates and displays all repositories from the DevExpGbb organization. It helps team members and the community discover:

- 🎪 **Demos** — Showcase applications and proof of concepts
- 🎓 **Workshops** — Hands-on learning materials
- 🛠️ **Tools** — Utilities and developer tools
- 📚 **Documentation** — Guides and reference materials

## 🚀 Stack

- Astro ^5
- Node.js 22 + pnpm
- Dev Container: `.devcontainer/devcontainer.json`

## 📂 Key Structure

```text
src/
  content/
    config.ts         # `ip` collection schema
    ip/*.md           # content files
  pages/
    index.astro       # content listing
    ip/[slug].astro   # detail page
```

## 🧩 Content (`collections.ip`)

Recommended frontmatter:

```yaml
---
title: "Title"
summary: "Brief summary (<=280 characters)"
category: "Category"
tags: ["tag1", "tag2"]
published: true
date: 2026-02-04
author: "Team"
link: "https://optional-link"
# Lifecycle metadata (for automated maintenance)
owner: "@githubhandle"    # Your GitHub handle
status: "ready"           # wip | ready | deprecated
last_updated: 2026-02-04  # Last content update date
---
```

### Automated Catalog Maintenance

IP Atlas includes automated lifecycle management to keep content fresh and relevant:

- **Staleness Detection**: Runs weekly to identify content not updated in 90+ days
- **Owner Notifications**: Creates GitHub issues to remind owners to review stale content
- **Lifecycle Tracking**: Uses `status` field to track content state (wip/ready/deprecated)

See [CATALOG_LIFECYCLE.md](CATALOG_LIFECYCLE.md) for complete details on the automated maintenance process.

## 🧞 Commands

| Command            | Action                           |
| ------------------ | -------------------------------- |
| `pnpm dev`         | Start server at `localhost:4321` |
| `pnpm astro check` | Validate types and content       |
| `pnpm build`       | Generate static `dist/`          |
| `pnpm preview`     | Preview build                    |

## 💡 Notes

- Add new `.md` files in `src/content/ip/` and Astro will publish them automatically.
- Use `pnpm astro check` to validate the content schema.
- In Codespaces/Dev Container, the environment is ready with Node 22 and pnpm.
- If the Dev Container fails resolving `ghcr.io/devcontainers/features/pnpm:1`, rebuild; we use `packageManager: pnpm` + `corepack` in `postCreateCommand`.
