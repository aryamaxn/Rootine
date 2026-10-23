# Rootine

A calm, gentle habit tracker where each habit grows into a little plant as you keep showing up. Rootine is designed to reward consistency without guilt when life gets busy.

## Pages

- `/` — landing page and interactive compounding demo
- `/garden` — personal habit garden and tracker
- `/why` — the science and ideas behind small habits
- `/about` — how Rootine works and its technology
- Unknown paths show a friendly 404 page

## Features

- Create, edit, complete and remove habits with a curated emoji and garden color.
- See each habit's current streak, weekly check-ins, growth stage and 30-day completion heatmap.
- Filter habits by today's progress, celebrate a fully tended garden, and switch between light and dark themes.
- Responsive, keyboard-accessible interface with inline validation, loading and error states, and gentle feedback.

## Tech stack

Vanilla HTML, CSS and JavaScript ES modules; Node.js and Express; MongoDB Atlas with Mongoose; dotenv; nodemon for development.

## Setup

1. Install Node.js 20 or newer and create a MongoDB Atlas database.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` to your Atlas connection string. `PORT` defaults to `3000`.

## Run

- Development with automatic restarts: `npm run dev`
- Production-style local run: `npm start`
- Streak utility checks: `npm run test:utils`
- Browser smoke test (requires Google Chrome): `npm run test:browser`
- Plant responsive screenshots at 360px, 768px, and 1280px in both themes: `npm run test:visual`
- All-page responsive checks and screenshots: `npm run test:site`
- Landing hero and page-curtain checks, with screenshots at 390px, 1024px and 1440px in both themes: `npm run test:hero`

Open [http://localhost:3000](http://localhost:3000) (or the port set in `.env`). The API is served from the same origin under `/api/habits`.

## Live demo

Coming soon.

## Planned features

- Authentication and personal accounts
- Gentle reminders
- Progressive Web App support
