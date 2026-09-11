# 📝 Serverless Object Storage Daily Blog Engine

LinkForge features a serverless daily blogging engine that stores posts, drafts, and manifests directly in S3-compatible **Object Storage** (such as Backblaze B2, Cloudflare R2, or AWS S3).

---

## 🌟 Architectural Highlights

1. **Zero Database Bloat**: Long-form blog posts and markdown bodies are stored as standalone objects in your S3/B2 bucket rather than inflating relational database tables.
2. **Dual Manifest Synchronization & Auto-Healing**:
   * Every published post is written to an atomic post file (`blogs/${userSlug}/${postSlug}.json`).
   * The blog index is mirrored to both the user's readable slug path (`blogs/${userSlug}/manifest.json`) and internal profile UUID (`blogs/${profileId}/manifest.json`).
   * If a profile's slug changes or legacy paths are queried, the engine transparently resolves the alternate identifier and repairs the index automatically.
3. **Clean Folder Hierarchy**:
   * Posts are stored under the creator's clean username folder (e.g. `blogs/sudhir-32a7/`) without redundant duplicate subfolders.
4. **Dynamic Zero-Stall Delivery**:
   * Public blog feeds and post viewer routes (`/[slug]/blog` and `/[slug]/blog/[postSlug]`) use `revalidate = 0` and HTTP headers `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`.
   * Newly published articles appear immediately on public profiles without caching delay.

---

## 📂 Object Storage Layout

```
your-storage-bucket/
└── blogs/
    ├── creator-slug-a/
    │   ├── manifest.json              <-- Authoritative blog index
    │   ├── mastering-system-design.json
    │   └── my-first-engineering-post.json
    └── creator-slug-b/
        ├── manifest.json
        └── launching-my-digital-store.json
```

---

## 📄 Manifest & Post Schema

### `manifest.json`
```json
{
  "profileId": "8f3b2024-4f01-4b71-bfa6-e4a87611a93c",
  "slug": "creator-slug",
  "totalPosts": 2,
  "updatedAt": "2026-09-11T12:00:00.000Z",
  "posts": [
    {
      "id": "post-uuid-1",
      "slug": "mastering-system-design",
      "title": "Mastering System Design in 2026",
      "excerpt": "A deep dive into distributed systems and high-throughput architectures.",
      "coverImage": "https://cdn.example.com/cover.jpg",
      "published": true,
      "readingTimeMinutes": 6,
      "tags": ["Engineering", "Architecture"],
      "createdAt": "2026-09-11T12:00:00.000Z"
    }
  ]
}
```

### Post Object (`${postSlug}.json`)
```json
{
  "id": "post-uuid-1",
  "slug": "mastering-system-design",
  "title": "Mastering System Design in 2026",
  "content": "# Full Markdown Body Here...\n\nDetailed breakdown of concepts...",
  "excerpt": "A deep dive into distributed systems...",
  "coverImage": "https://cdn.example.com/cover.jpg",
  "published": true,
  "readingTimeMinutes": 6,
  "tags": ["Engineering", "Architecture"],
  "author": {
    "name": "Sudhir",
    "avatar": "https://cdn.example.com/avatar.jpg"
  },
  "createdAt": "2026-09-11T12:00:00.000Z",
  "updatedAt": "2026-09-11T12:00:00.000Z"
}
```

---

## 🚀 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/blog?slug=username` | `GET` | Retrieve the full post manifest for an author |
| `/api/blog` | `POST` | Create or update a blog post in object storage |
| `/api/blog/[postSlug]?slug=username` | `GET` | Fetch full post markdown and metadata |
| `/api/blog/[postSlug]?slug=username` | `DELETE` | Delete post object and update manifest |
