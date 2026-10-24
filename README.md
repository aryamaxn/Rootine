# Rootine

**Small habits. Remarkable growth.**

Rootine is a gentle habit tracker that turns daily check-ins into a garden of growing plants. Start with one small habit, tend it at your own pace, and watch your progress take shape.

**Live demo:** _coming soon_ · **Screenshots:** _add images to `/screenshots` and link them here_

## Pages

| Route | Description |
| --- | --- |
| `/` | Landing page with an interactive habit-compounding demo |
| `/garden` | The habit tracker |
| `/why` | Ideas and science behind small habits, inspired by *Atomic Habits* |
| `/about` | About Rootine and how it works |
| Unknown routes | Friendly 404 page |

## Features

- Create, edit, complete, filter and delete habits
- Five plant growth stages that advance as completed days add up
- Current streak, longest streak, weekly check-in strip and a 30-day activity heatmap
- Missed days are shown softly, never in red, so the app doesn't guilt-trip you
- Light and dark themes, remembered across pages
- Responsive layout, shared navigation, smooth page transitions and reduced-motion support
- Optimistic UI updates with rollback and friendly error messages

## Tech stack

- **Frontend:** vanilla HTML, CSS and JavaScript (ES modules, no frameworks)
- **Backend:** Node.js and Express
- **Database:** MongoDB Atlas with Mongoose
- **Testing:** Node scripts and Playwright browser checks

## Getting started

**Requirements:** Node.js 20+ and a MongoDB database (a free MongoDB Atlas cluster works well).

```bash
git clone <repository-url>
cd Rootine
npm install
cp .env.example .env
```

Open `.env` and set your values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/rootine?retryWrites=true&w=majority
PORT=3000
```

`PORT` is optional and defaults to `3000`. Never commit your real `.env`; it is listed in `.gitignore`.

Start the app:

```bash
npm start        # production-style run
npm run dev      # development with automatic restarts
```

Then open http://localhost:3000.

## API

The API is served from the same origin, so the whole app runs from one URL.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/habits` | List all habits |
| `POST` | `/api/habits` | Create a habit |
| `PUT` | `/api/habits/:id` | Edit name, emoji or color |
| `DELETE` | `/api/habits/:id` | Delete a habit |
| `PATCH` | `/api/habits/:id/toggle` | Mark a date done or undone (`{ "date": "YYYY-MM-DD" }`) |

**Habit model**

| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | Required, trimmed, max 40 characters |
| `emoji` | String | Defaults to 🌱 |
| `color` | String | One of the palette accent keys |
| `createdAt` | Date | Set automatically |
| `completedDates` | String[] | `"YYYY-MM-DD"` entries, no duplicates |

Streaks and stats are computed in `utils/streaks.js`, not stored in the database.

## Checks

```bash
npm run test:utils     # streak and date utilities
npm run test:browser   # end-to-end browser checks
npm run test:visual    # responsive and theme screenshots
npm run test:site      # every route, both themes
npm run test:hero      # landing page hero layout
```

The browser checks use Playwright. Install its browser once with:

```bash
npx playwright install chromium
```

## Project structure

```
public/
  index.html        Landing page
  garden.html       Habit tracker
  why.html          Small habits guide
  about.html        About page
  404.html          Friendly not-found page
  css/              Shared and page styles
  js/               Layout, plants and page modules
  assets/           Images and SVGs
server.js           Express server and page routes
config/db.js        Database connection
models/Habit.js     Mongoose model
routes/             API routes
controllers/        Request handlers
middleware/         Error handling
utils/              Shared streak utilities
scripts/            Browser and responsive checks
screenshots/        Test screenshots
```

## Deployment

Rootine is a single Node service, so it runs on platforms like Render, Railway or Fly.io.

1. Push the repo to GitHub.
2. Create a new web service from the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add `MONGODB_URI` as an environment variable (the platform provides `PORT`).
5. In MongoDB Atlas, allow the platform's network access (`0.0.0.0/0` is the simplest for a hobby project).

## Roadmap

- [ ] User accounts and per-user gardens
- [ ] Gentle reminders
- [ ] Installable PWA
- [ ] Habit categories and notes
- [ ] Shareable garden snapshots

## Acknowledgements

The ideas on the `/why` page are inspired by *Atomic Habits* by James Clear. All copy is original; read the book for the full story.

## License

MIT © [Aryaman Sharma (aryamaxn)](https://github.com/aryamaxn)
