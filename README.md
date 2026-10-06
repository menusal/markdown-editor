# Markdown Editor

> A local-first markdown editor to review plans and SDD docs — or edit any markdown on your machine.

A focused, browser-based editor for markdown documents. Open a folder — or individual files — browse the `.md` tree, review plans, specs and **Spec-Driven Development (SDD)** docs, edit with a live formatted preview and save your changes **in place** — no backend, no sync, nothing ever uploaded anywhere. Manage several projects at once and switch between them.

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
- **Open individual files** — edit loose markdown files without opening a whole folder; they collect under an "Opened files" project.
- **Multiple projects** — keep several folders and file collections open and switch between them from the sidebar; each project remembers its own tabs.
- **Formatted preview** with GFM support — tables, task lists, code blocks and more.
- **Split view** with a draggable divider and synchronized scrolling, plus editor-only and preview-only modes.
- **Edit & save** — write changes back to disk in place. `Cmd/Ctrl + S` or the **Save** button.
- **Undo / redo / reset** per document (in editor and split modes) — the edit history is kept per file, with rapid typing coalesced into single steps. Reset reverts to the last saved version.
- **Interactive task lists** — click a checkbox in the preview to toggle `- [ ]` ↔ `- [x]` in the source.
- **Tabs** for multiple open documents with dirty-state indicators, scoped to the active project.
- **Light & dark themes** with a toggle (system / light / dark), synced with your OS preference and remembered across visits.
- **URL state** — the active project, file, view mode and sidebar are mirrored in the URL.
- **Remembers your projects** across reloads (the browser asks you to re-grant access).

## Getting started

```bash
pnpm install
pnpm dev
```

1. Click **Open folder** (or **Open files** for individual markdown files).
2. Browse the tree on the left; only `.md` files are listed.
3. Edit on the left, preview on the right.
4. Save with `Cmd/Ctrl + S` or the **Save** button.
5. Use the project switcher at the top of the sidebar to move between projects.

After a reload, the browser will ask you to confirm access to the project you reopen (a security requirement of the File System Access API).

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + S` | Save the active file |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + B` | Toggle the sidebar |
| `Cmd/Ctrl + O` | Open a folder |
| `Cmd/Ctrl + Shift + O` | Open individual files |

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
- `documents.test.ts` — per-document undo/redo history and reset (coalescing, redo clearing, save baseline, project namespacing, per-project tabs).
- `workspace.test.ts` — projects: open a folder, avoid duplicates, switch, accumulate loose files with dedupe, remove.
- `components.test.tsx` — interactive task-list checkboxes in the preview (enabled inputs, correct source line/state on toggle).
- `picker.test.ts` — browser compatibility detection (Chromium picker + writable handles).
- `WorkspaceGate.test.tsx` — the home shows a notice on unsupported browsers.
- `EditorPane.test.tsx` — regression guard: the CodeMirror container must keep a definite height so the editor can scroll.
- `theme.test.ts` — theme-mode resolution and persistence.

## Tech stack

- **Vite** + **React 19** + **TypeScript**
- **zustand** — global state (workspace/projects, documents, UI)
- **nuqs** — URL state (`project`, `file`, `view`, `sidebar`)
- **motion** — animations
- **CodeMirror 6** (`@uiw/react-codemirror`) — editor
- **react-markdown** + **remark-gfm** — preview
- **Tailwind CSS v4** — styling
- **@fontsource** — Inter
- **idb-keyval** — persist open projects (directory + file handles)

## Architecture

```
src/
├─ lib/fs/         picker · directory · file · permissions · persist
├─ lib/markdown/   components.tsx (render) · tasks.ts (checkboxes) · codemirror-theme.ts
├─ store/          workspace (projects) · documents · ui
├─ hooks/          useDocumentRouting · useProjectActions · useKeyboardShortcuts · useUnsavedGuard · useSaveActive
└─ components/     layout · toolbar · sidebar (ProjectSwitcher) · editor · ui (Menu)
```

Design tokens live in `src/styles/theme.css` (Tailwind v4 `@theme`) and `src/styles/tokens.css` (CSS variables). Inter is the only typeface; hierarchy comes from size and weight rather than color.

## Known limitations

- Chromium browsers only (see [Browser compatibility](#-browser-compatibility)).
- Access to a project must be re-granted after a reload.
- Very large markdown files can feel sluggish in live preview.

## License

[MIT](./LICENSE) © menusal
