# Finance Tracker

Full-stack finance tracker with an AI-powered statement parser and a React dashboard.

## Tech Stack

- Frontend: React (Vite), React Router, Tailwind CSS v4, Recharts
- Backend: Node.js, Express, Multer, pdf-parse, csv-parse
- AI: OpenAI (optional, via `OPENAI_API_KEY`), with a heuristic fallback
- DB: MongoDB (coming next)

## Monorepo Layout

```
Finance Tracker/
  frontend/   # Vite React app
  backend/    # Express API server
```

## Prerequisites

- Node.js 18+
- npm 10+

## Backend Setup

1. Create `.env` in `backend/` (optional but recommended for AI):

```
OPENAI_API_KEY=your_key_here
PORT=4000
```

2. Install and run:

```
cd backend
npm install
npm run dev
```

- API health: `GET http://localhost:4000/health`

## Frontend Setup

1. Install and run:

```
cd frontend
npm install
npm run dev
```

2. App runs at `http://localhost:5173`.

If you see a PostCSS/Tailwind overlay error, ensure `frontend/postcss.config.js` contains:

```
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

## Using the App

- Dashboard: summary cards, editable/searchable transactions table, category pie chart, Download PDF button.
- Upload page: select PDF/CSV/TXT and click "Upload & Parse".
  - If `OPENAI_API_KEY` is set, the backend uses AI to extract and categorize transactions.
  - If not, a heuristic parser extracts basic rows where possible.
  - Parsed JSON preview is shown on the Upload page.

## API

- `POST /api/parse`
  - Form field: `files` (one or many). Allowed: `.pdf`, `.csv`, `.txt`.
  - Response shape:

```
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": -86.42,
      "description": "Grocery Store",
      "merchant": "Fresh Mart",
      "category": "Groceries"
    }
  ]
}
```

## Scripts

Backend (`/backend`):

- `npm run dev` – start API with nodemon
- `npm start` – start API (node)

Frontend (`/frontend`):

- `npm run dev` – start Vite
- `npm run build` – production build
- `npm run preview` – preview build

## Troubleshooting

- Run commands in the correct folder (`frontend` vs `backend`). If you see `ENOENT package.json`, you are in the wrong directory.
- Tailwind v4 requires `@tailwindcss/postcss` in PostCSS plugins.
- CORS: Backend enables CORS by default for local dev.
- PDF parsing quality depends on the source; AI mode yields better normalization.

