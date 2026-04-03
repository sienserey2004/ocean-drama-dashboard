// All fired in parallel with Promise.all()
const [user, recommended, watchHistory, free, trending, comingSoon, purchases, creators] =
  await Promise.all([
    GET /api/users/me                              // header: name, @handle, avatar
    GET /api/videos/recommended?limit=4            // featured slider
    GET /api/users/me/watch-history?limit=5        // continue watching row
    GET /api/videos?is_free=true&limit=10          // free to watch row
    GET /api/videos/trending?limit=10&period=week  // trending ranked row
    GET /api/videos?sort=newest&limit=8            // new & coming soon 2×4 grid
    GET /api/users/me/purchases?limit=10           // my purchased series row
    GET /api/videos?sort=popular&group=creator     // popular creators row
  ])
```

---

## Section-by-section endpoint map

| Section | Endpoint | Key fields used |
|---|---|---|
| Header | `GET /api/users/me` | `name`, `profile_image`, `user_id` → build `@handle` |
| Search bar | `GET /api/videos/search?q=` | fires on type with debounce |
| Category chips | `GET /api/categories` | `category_id`, `name` — filter param passed to videos |
| Featured slider | `GET /api/videos/recommended?limit=4` | `title`, `thumbnail_url`, `categories`, `rating`, `episode_count` |
| Slider dots | count from recommended array length | widget shows how many banners |
| Continue watching | `GET /api/users/me/watch-history?limit=5` | `episode_id`, `video_title`, `watch_duration`, `duration` → progress % |
| Free to watch | `GET /api/videos?is_free=true&limit=10` | `is_free=true`, `title`, `thumbnail_url`, `categories` |
| Trending now | `GET /api/videos/trending?period=week&limit=10` | `rank`, `title`, `view_count` |
| New & coming soon | `GET /api/videos?sort=newest&limit=8` | `created_at`, `status`, shows "NEW" / "SOON" badge |
| Popular creators | `GET /api/users?role=creator&sort=followers&limit=10` | `name`, `profile_image`, `follower_count` |
| My purchased series | `GET /api/users/me/purchases?limit=10` | `video_title`, `episode_count`, `thumbnail_url` |

---

## Badge logic per card
```
thumbnail_url     → MinIO presigned GET URL (or public CDN)
is_free = true    → green "FREE" badge top-left
created_at < 7d   → amber "NEW" badge top-left
status = pending  → gray "SOON" badge bottom-left
video_purchase exists → purple "OWNED" badge top-right
trending rank     → large number overlaid bottom-left