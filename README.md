# StackOverbid

Auction marketplace frontend: browse listings, bid in real time against a closing clock, manage your own auctions, and check out a won item.

**Live demo:** [stackoverbid.vercel.app](https://stackoverbid.vercel.app)  
**API:** [TheVicBro/stackoverbid-be](https://github.com/TheVicBro/stackoverbid-be)

Team course project. Checkout records an order in the app (shipping choice, receipt) — it is not a card processor.

## Stack

React 19, TypeScript, Vite, Tailwind, React Router. Talks to the FastAPI backend (JWT cookie + `/api` proxy in local dev). Listing images go through Cloudinary unsigned upload when those env vars are set.

## What it does

- Catalogue home (ending soon / newest / most active) and search
- Auction detail with live countdown, gallery, and bid form
- Create / edit listings, including image reorder
- Auth, profile, notifications
- Buyer dashboard (auctions you bid on) and seller listings
- Checkout + unpaid-order follow-up after you win

## Local setup

```bash
npm install
cp .env.example .env
```

`.env` (see `.env.example`):

```
VITE_API_BASE_URL=http://localhost:8000
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Run the [backend](https://github.com/TheVicBro/stackoverbid-be) on port 8000, then:

```bash
npm run dev
```

Vite is on [http://localhost:3000](http://localhost:3000) and proxies `/api` to the API so cookies work in development.
