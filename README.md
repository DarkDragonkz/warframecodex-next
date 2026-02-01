# WarframeCodex Next

Codex/Tracker interface for Warframe built with Next.js. Designed to browse large datasets quickly with advanced filters, detail modals, and local collection tracking.

## Contents
- [English](#warframecodex-next)
- [Italiano](#warframecodex-next-italiano)

## What it does
- Catalogs for Warframes, weapons, companions, mods, arcanes, relics, and more.
- Hub navigation (macro categories) plus list pages for micro categories.
- Search, Base/Prime filters, Owned/Missing, and Vaulted toggles where available.
- Completion stats with collection state saved in localStorage.
- Rich detail views: components, drop sources, related relics, farming strategy.
- Virtualized grids for smooth performance with thousands of items.

## Tech stack
- Next.js (App Router) + React
- Tailwind CSS v4 (utilities) + custom CSS for the HUD layout
- React Virtuoso for grid virtualization

## Data & sources
- JSON files live in `public/database_api`.
- Sync scripts:
  - `node scripts/update-db.js` pulls JSON from `WFCD/warframe-items` and generates `RelicLookup.json`.
  - `node scripts/update-arcanes.js` updates `Arcanes.json` by merging `api.warframestat.us/items` and `api.warframestat.us/arcanes`.
- Images are loaded from the official CDN: `https://cdn.warframestat.us/img`.
- Some optional drop info is fetched client-side from `https://api.warframestat.us/drops/search/...`.

## Local setup
1) Install dependencies:
```bash
npm install
```

2) (Optional) Refresh local databases:
```bash
node scripts/update-db.js
node scripts/update-arcanes.js
```

3) Run dev server:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Build & static export (GitHub Pages)
- This project uses `output: "export"` in `next.config.mjs`.
- Build with:
```bash
npm run build
```
- Static output is generated in `out/`. Publish that folder on GitHub Pages.

Base path:
- In production it uses `NEXT_PUBLIC_BASE_PATH` (default: `/warframecodex-next`).
- If the repo name changes, update `NEXT_PUBLIC_BASE_PATH` or the value in `next.config.mjs`.

## Project structure (high level)
- `src/app` App Router pages (hub, lists, special pages).
- `src/components` shared cards, modals, layout.
- `src/utils` category config, data fetch, base-path constants.
- `public/database_api` local JSON datasets.
- `scripts/` dataset update utilities.

## Notes
- Owned/Missing state and progress are stored in localStorage (per browser).
- Not affiliated with Digital Extremes. Warframe and related assets are trademarks of their respective owners.

---

# WarframeCodex Next (Italiano)

Interfaccia Codex/Tracker per Warframe basata su Next.js. Pensata per consultare grandi dataset in modo rapido, con filtri avanzati, modal di dettaglio e tracking della collezione in locale.

## Cosa fa
- Cataloghi per Warframe, armi, companions, mods, arcanes, relics e altro.
- Navigazione a hub (macro categorie) e pagine lista per micro categorie.
- Ricerca, filtri Base/Prime, Owned/Missing, e toggle Vaulted dove disponibile.
- Statistiche di completamento e stato collezione salvato in localStorage.
- Dettagli ricchi per item: componenti, fonti drop, reliquie collegate, strategie farming.
- Liste virtualizzate per prestazioni stabili anche con migliaia di voci.

## Tech stack
- Next.js (App Router) + React
- Tailwind CSS v4 (utility) + CSS custom per layout HUD
- React Virtuoso per virtualizzazione griglie

## Dati e fonti
- I JSON sono in `public/database_api`.
- Script di sync:
  - `node scripts/update-db.js` scarica i JSON da `WFCD/warframe-items` e genera `RelicLookup.json`.
  - `node scripts/update-arcanes.js` aggiorna `Arcanes.json` unendo `api.warframestat.us/items` e `api.warframestat.us/arcanes`.
- Le immagini arrivano dalla CDN ufficiale: `https://cdn.warframestat.us/img`.
- Alcune info drop opzionali sono recuperate lato client da `https://api.warframestat.us/drops/search/...`.

## Setup locale
1) Installa dipendenze:
```bash
npm install
```

2) (Opzionale) Aggiorna i database locali:
```bash
node scripts/update-db.js
node scripts/update-arcanes.js
```

3) Avvia in dev:
```bash
npm run dev
```

Apri `http://localhost:3000`.

## Build ed export statico (GitHub Pages)
- Questo progetto usa `output: "export"` in `next.config.mjs`.
- Per buildare:
```bash
npm run build
```
- L'output statico viene generato in `out/`. Pubblica quella cartella su GitHub Pages.

Base path:
- In produzione usa `NEXT_PUBLIC_BASE_PATH` (default: `/warframecodex-next`).
- Se il nome repo cambia, aggiorna `NEXT_PUBLIC_BASE_PATH` o il valore in `next.config.mjs`.

## Struttura progetto (alto livello)
- `src/app` pagine App Router (hub, liste, special pages).
- `src/components` card, modal e layout condivisi.
- `src/utils` config categorie, fetch data, costanti base path.
- `public/database_api` dataset JSON locali.
- `scripts/` utility per aggiornare i dataset.

## Note
- Lo stato "Owned/Missing" e i progressi sono salvati in localStorage (per browser).
- Non affiliato a Digital Extremes. Warframe e i relativi asset sono trademark dei rispettivi proprietari.
