# 📝 Backblaze B2-Backed Daily Blog & Micro-Journal

LinkForge includes a built-in WordPress-grade micro-blogging and journaling engine with **zero relational database bloat**.

## 🚀 Architecture Highlights
- **100% Object Storage Backed**: Every post is written as a static file (`.md`, `.html`, or `.txt`) directly into Backblaze B2 / S3 / Object Storage.
- **Neon PostgreSQL Remains Clean**: Relational database is reserved strictly for core auth and short link metadata. Post content is loaded on-demand via streaming/fetch.
- **Manifest Architecture**: An index manifest (`blogs/${profileId}/manifest.json`) keeps track of published slugs, reading times, publication timestamps, and tags.

## 🛠️ Dashboard & Public Endpoints
- **Creator Studio**: `/dashboard/blog` (Write, Preview, Tag, Estimate Reading Time, 1-Click B2 Publish)
- **Public Feed**: `/[slug]/blog` (Author card, tags, chronological entries)
- **Article Reader**: `/[slug]/blog/[postSlug]` (Clean typography, syntax highlighting, share buttons, dark mode)

## 📡 API Endpoints
- `GET /api/blog?profileId=...` - Fetch blog manifest
- `POST /api/blog` - Publish or update daily blog to B2 storage
- `DELETE /api/blog?slug=...` - Delete post and update manifest
- `GET /api/blog/[postSlug]?profileId=...` - Fetch post body from B2
