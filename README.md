# IP Atlas

Sitio Astro para catalogar y compartir contenidos de propiedad intelectual del equipo.

## 🚀 Stack
- Astro ^5
- Node.js 22 + pnpm
- Dev Container: `.devcontainer/devcontainer.json`

## 📂 Estructura clave
```text
src/
  content/
    config.ts         # esquema colección `ip`
    ip/*.md           # contenidos
  pages/
    index.astro       # listado de contenidos
    ip/[slug].astro   # página de detalle
```

## 🧩 Contenido (`collections.ip`)
Frontmatter recomendado:
```yaml
---
title: "Título"
summary: "Resumen breve (<=280 caracteres)"
category: "Categoría"
tags: ["tag1", "tag2"]
published: true
date: 2026-02-04
author: "Equipo"
link: "https://enlace-opcional"
---
```

## 🧞 Comandos
| Comando              | Acción                               |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Levanta servidor en `localhost:4321` |
| `pnpm astro check`   | Valida tipos y contenido             |
| `pnpm build`         | Genera `dist/` estático              |
| `pnpm preview`       | Previsualiza build                   |

## 💡 Notas
- Añade nuevos `.md` en `src/content/ip/` y Astro los publicará automáticamente.
- Usa `pnpm astro check` para validar el esquema de contenido.
- En Codespaces/Dev Container, el entorno queda listo con Node 22 y pnpm.
- Si el Dev Container falla resolviendo `ghcr.io/devcontainers/features/pnpm:1`, reconstruye; usamos `packageManager: pnpm` + `corepack` en `postCreateCommand`.
