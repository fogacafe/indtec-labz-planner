# INDTEC LABZ / 003 — Planner

Interactive planning lab built with React and TypeScript, exploring timeline visualization, inline editing, drag-and-drop, filtering and client-side persistence.

## Mission

Turn workload, ownership and delivery windows into an interactive annual planning surface without requiring a backend.

The grid is the editor. Changes are persisted directly in the browser and immediately reflected in the timeline.

## What this lab explores

- React + TypeScript + Vite
- quarter / month / week annual timeline
- inline grid editing
- drag-and-drop planning changes
- calculated end date and sprint count
- filters by owner, priority, type and area
- visual priority / status / leave signals
- LocalStorage behind a `PlannerStorage` abstraction
- CSV export for spreadsheet consumption
- a demo dataset that can be reset at any time

## Persistence decision

This lab intentionally has no backend. Each visitor gets an isolated workspace in LocalStorage, making the application instantly usable and deployable as a static site.

The application depends on a small `PlannerStorage` contract rather than LocalStorage directly, leaving room for a future API adapter without coupling the UI to persistence.

## Drag behavior

Rows are always presented as `Responsible → StartDate`. Dragging one demand over another exchanges their planning positions (owner/start date), after which the canonical ordering is recalculated.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

---

Part of **INDTEC LABZ** — small, focused engineering experiments where architectural decisions are meant to be inspected.
