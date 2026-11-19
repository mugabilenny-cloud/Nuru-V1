# Nuru Job Connect

Static site. Every listing comes from `data/jobs.xlsx` (columns: `path`, `title`, `url`, `details`).

- `path` is `Jobs/<Category>` or `Scholarships/<Group>`.
- For jobs, put `Closes 29 Oct 2026` in `details`; the site marks the job closed automatically after that day.

## Update listings
1. Edit `data/jobs.xlsx`, save, commit, push to `main`.
2. Vercel rebuilds and publishes in about a minute.

## Run locally
    npm install
    npm run dev

## Deploy
Push to GitHub, then in Vercel choose Add New > Project, import the repo, and press Deploy. No settings to change (`vercel.json` has them).
