**Frontend — React + TypeScript + Vite (MUI, Konva)**

- **Why it’s used:** Provides the user interface, canvas editing (Konva), and communicates with the backend via Axios.

- **Core concepts to learn:**
  - React functional components and hooks
  - TypeScript types and `tsx` components
  - Routing with `react-router-dom`
  - UI with MUI (components, theming)
  - Canvas drawing with `react-konva` / Konva
  - Vite dev server, build pipeline, and Vitest for tests

- **Hands-on micro-tasks:**
  1. Start the frontend dev server and open the app (`npm run dev` in `frontend`).
  2. Add a new route/page and link it in the app header.
  3. Build a tiny Konva component that draws a rectangle and add a button to toggle its color.

- **Files to inspect:**
  - [frontend/package.json](frontend/package.json)
  - [frontend/src/main.tsx](frontend/src/main.tsx) (or `src/main.tsx` in `frontend`) — app entry
  - `frontend/src/components` — UI components

- **Recommended resources:**
  - React docs: https://reactjs.org/
  - TypeScript + React: https://www.typescriptlang.org/docs/handbook/react.html
  - Vite: https://vitejs.dev/guide/
  - Konva + react-konva: https://konvajs.org/docs/react/Introduction.html

- **Quick checks:**

```bash
cd frontend
npm ci
npm run dev
# type-check
npm run type-check
# build
npm run build
```
