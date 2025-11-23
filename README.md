# TinyLink – URL Shortener (Take-Home Assignment)

TinyLink is a minimal URL shortener, similar to bit.ly, built as a take-home assignment.  
Users can create short links, view click statistics, and manage (delete) links via a clean web interface.

Live URL: **https://tinylink-77ax.onrender.com**  
GitHub: **https://github.com/Harry1678/tinylink**

> Note: This project uses AI (ChatGPT) as an assistant for debugging and polishing,  
> but all design and implementation choices are understood and owned by the author.

---

## ✨ Features

- Create short URLs from long URLs
- Optional custom shortcode (`[A-Za-z0-9]{6,8}`)
- HTTP 302 redirection via `/:code`
- Click tracking: total clicks + last clicked timestamp
- Delete links from dashboard
- Stats page per code at `/code/:code`
- Healthcheck endpoint at `/healthz`
- Clean, responsive UI with gradient background and card layout
- Truncated long URLs with full URL on hover

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Neon)
- **Hosting:** Render (Web Service) + Neon Postgres
- **Frontend:** Plain HTML + CSS + vanilla JavaScript
- **DB Client:** `pg` (node-postgres)

---

## 📐 Architecture Overview

- `server/index.js` – Express app with:
  - healthcheck, API endpoints, redirect route, stats page route
  - PostgreSQL connection pool
  - static hosting for the frontend from `public/`
- `public/index.html` – Dashboard page:
  - Create short link form
  - Table of all links with actions (open, stats, delete)
- `public/stats.html` – Stats page:
  - Shows details for a single code
- `public/style.css` – Shared UI styling

### Database Schema (links table)

Example schema (actual migration may vary):

```sql
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  last_clicked TIMESTAMPTZ,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
