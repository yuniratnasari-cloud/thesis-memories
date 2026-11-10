# Thesis Memories

### Four Frames, One Story.

Thesis Memories is a photobooth and digital memory app for university students documenting the milestones of their thesis journey—from advising sessions and revisions to seminars and graduation. Capture four photos, turn them into a themed photostrip, and keep each moment in a browser-based diary.

## Overview

Create a memory by adding a title, date, and academic milestone, then capture and review four photos before saving. Each saved entry includes its original photos and a rendered photostrip. The app is a client-side MVP; it does not require an account or a backend.

## Features

### Implemented

- Four-shot camera flow with a three-second countdown, individual retakes, and session restart.
- Four photostrip themes: Minimalist, Cute, Masculine, and Dreamy.
- Adjustable natural photo effects and customizable photostrip decorations.
- Diary entries with titles, dates, and academic milestones, including a custom milestone option.
- Local diary browsing, memory details, and deletion.
- Browser-local storage: original photos, rendered photostrips, and diary records are saved in IndexedDB. The selected theme preference uses `localStorage`.
- Camera access is requested only after the user chooses to open the camera.

### Not implemented or not verified

- Backup/export and restore are not implemented; archive format and restore behavior are still undecided.
- No cloud synchronization, user accounts, or backend services are part of the current app.
- Browser/device compatibility beyond the checks described in `docs/TESTING_PLAN.md` has not been established.

## Screenshots

Screenshots are not currently available in the repository.

> **Screenshot placeholder — Main photobooth:** Add an application screenshot here.
>
> **Screenshot placeholder — Diary and saved memory:** Add an application screenshot here.

## Technology

- Vanilla JavaScript with native browser APIs
- Vite 8 for local development and production builds
- IndexedDB for photo Blobs and diary records
- `localStorage` for the selected theme preference
- `MediaDevices.getUserMedia` for camera preview and capture; Canvas for photostrip rendering

## Installation and local development

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Camera access requires a browser-supported secure context, such as `localhost`, and user permission.

Available package scripts:

```bash
npm run build
npm run preview
```

`npm run build` creates a production build; `npm run preview` serves that build locally. An optional `npm run dev:https` script is also defined. It requires both `THESIS_HTTPS_CERT` and `THESIS_HTTPS_KEY` to point to local certificate and key files; see `docs/TESTING_PLAN.md`. Never commit or share private keys.

## Project structure

```text
.
├── docs/                 # System design, security, and testing plans
├── public/               # Static icons and favicon
├── src/
│   ├── assets/           # App assets
│   ├── main.js           # App interface and photobooth flow
│   ├── storage.js        # IndexedDB persistence
│   └── style.css         # App styles
├── index.html            # Vite HTML entry point
├── package.json          # Dependencies and npm scripts
├── SECURITY.md           # Security policy
└── vite.config.js        # Vite configuration
```

## Privacy and security

Photos and diary entries are stored locally in the current browser's IndexedDB; they are not uploaded by an implemented app feature. `localStorage` holds only the selected theme preference. Camera access is requested after an explicit action and does not request microphone access.

Local browser storage is not encrypted by the app and is not a backup. Clearing browser data, losing access to the browser profile, or device failure may make entries unavailable. Deleting a memory removes its records from this browser, but cannot remove copies saved elsewhere. Review [SECURITY.md](SECURITY.md) and [docs/SECURITY_PLAN.md](docs/SECURITY_PLAN.md) for security scope and reporting status.

## Development status

Thesis Memories is an in-progress MVP. The core capture, themed photostrip, and local diary flows are implemented. The testing plan records a successful production build and selected browser smoke checks; camera denial, physical mobile devices, and broader browser compatibility remain untested. `package.json` does not define automated test, lint, or type-check scripts. Backup/export and restore remain planned, not available.

See [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) for product and storage decisions and [docs/TESTING_PLAN.md](docs/TESTING_PLAN.md) for recorded checks and open test scenarios.
