# Markdown Editor

> A local-first markdown editor to review plans and SDD docs — or edit any markdown on your machine.

A focused, browser-based editor for markdown documents. Open a folder, browse its `.md` tree, review plans, specs and **Spec-Driven Development (SDD)** docs, edit with a live formatted preview and save your changes **in place** — no backend, no sync, nothing ever uploaded anywhere.

## Preview

[![Live demo](https://img.shields.io/badge/demo-preview%20on%20Vercel-000000?style=flat-square&logo=vercel)](https://markdown-editor-murex-five.vercel.app/)

🔗 **Live demo:** https://markdown-editor-murex-five.vercel.app/ — deployed on [Vercel](https://vercel.com).

## ⚠️ Browser compatibility

This app relies on the [**File System Access API**](https://developer.mozilla.org/docs/Web/API/File_System_Access_API) to read and write files directly on your disk.

| Browser | Support |
|---|---|
| Chrome / Edge / Brave / Opera (Chromium) | ✅ Full support (read + write) |
| Safari | ❌ No directory write access |
| Firefox | ❌ Not supported |

> Use a **Chromium-based browser** (Chrome or Edge recommended). Everything runs client-side; your files never leave your machine.

## Features

- **Open a folder** and get a recursive treeview of its `.md` files (directories without markdown are pruned).
- **Formatted preview** with GFM support — tables, task lists, code blocks and more.
- **Split view** with a draggable divider and synchronized scrolling, plus editor-only and preview-only modes.
- **Edit & save** — write changes back to disk in place. `Cmd/Ctrl + S` or the **Save** button.
- **Interactive task lists** — click a checkbox in the preview to toggle `- [ ]` ↔ `- [x]` in the source.
- **Tabs** for multiple open documents with dirty-state indicators.
- **Light & dark themes** with a toggle (system / light / dark), synced with your OS preference and remembered across visits.
- **URL state** — the active file, view mode and sidebar are mirrored in the URL.
- **Remembers your folder** across reloads (the browser asks you to re-grant access).

## Getting started

```bash
pnpm install
pnpm dev
```

1. Click **Open folder** and pick a directory containing markdown files.
2. Browse the tree on the left; only `.md` files are listed.
3. Edit on the left, preview on the right.
4. Save with `Cmd/Ctrl + S` or the **Save** button.

After a reload, the browser will ask you to confirm access to the previously opened folder (a security requirement of the File System Access API).

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + S` | Save the active file |
| `Cmd/Ctrl + B` | Toggle the sidebar |
| `Cmd/Ctrl + O` | Open a folder |

## Scripts

```bash
pnpm dev         # start the dev server
pnpm build       # type-check (tsc -b) + production build
pnpm test        # run unit tests (vitest)
pnpm test:watch  # run tests in watch mode
pnpm lint        # run oxlint
pnpm preview     # serve the production build
```

### Tests

Unit tests run with [Vitest](https://vitest.dev) + jsdom:

- `scroll-sync.test.ts` — the editor/preview proportional scroll sync (ratio mapping both directions, echo suppression, non-scrollable and unregistered panes, teardown).
- `EditorPane.test.tsx` — regression guard: the CodeMirror container must keep a definite height so the editor can scroll.
- `theme.test.ts` — theme-mode resolution and persistence.

## Tech stack

- **Vite** + **React 19** + **TypeScript**
- **zustand** — global state (workspace, documents, UI)
- **nuqs** — URL state (`file`, `view`, `sidebar`)
- **motion** — animations
- **CodeMirror 6** (`@uiw/react-codemirror`) — editor
- **react-markdown** + **remark-gfm** — preview
- **Tailwind CSS v4** — styling
- **@fontsource** — Inter
- **idb-keyval** — persist the directory handle

## Architecture

```
src/
├─ lib/fs/         picker · directory · file · permissions · persist
├─ lib/markdown/   components.tsx (render) · tasks.ts (checkboxes) · codemirror-theme.ts
├─ store/          workspace · documents · ui
├─ hooks/          useDocumentRouting · useKeyboardShortcuts · useUnsavedGuard · useSaveActive
└─ components/     layout · toolbar · sidebar · editor · ui
```

Design tokens live in `src/styles/theme.css` (Tailwind v4 `@theme`) and `src/styles/tokens.css` (CSS variables). Inter is the only typeface; hierarchy comes from size and weight rather than color.

## Known limitations

- Chromium browsers only (see [Browser compatibility](#-browser-compatibility)).
- Access to the previously opened folder must be re-granted after a reload.
- Very large markdown files can feel sluggish in live preview.

## License

[MIT](./LICENSE) © menusal
