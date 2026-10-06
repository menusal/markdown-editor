# Markdown Editor

> A local-first web app to read, edit and save markdown files straight from your disk.

A focused browser-based editor for markdown documents — reading plans, specs and SDD-style docs. Open a folder, browse its `.md` tree, edit with a live formatted preview and save changes **in place**, without a backend or uploading anything anywhere.

<!-- TODO: replace with the deployed URL once it's live on Vercel -->
## Preview

[![Live demo](https://img.shields.io/badge/demo-preview%20on%20Vercel-000000?style=flat-square&logo=vercel)](https://REPLACE-ME.vercel.app)

> 🚧 **Live demo coming soon** — deployed on [Vercel](https://vercel.com). Replace the badge/link above with the deployed URL.

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
- **Split view** with a draggable divider, plus editor-only and preview-only modes.
- **Edit & save** — write changes back to disk in place. `Cmd/Ctrl + S` or the **Save** button.
- **Interactive task lists** — click a checkbox in the preview to toggle `- [ ]` ↔ `- [x]` in the source.
- **Tabs** for multiple open documents with dirty-state indicators.
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
pnpm dev      # start the dev server
pnpm build    # type-check (tsc -b) + production build
pnpm preview  # serve the production build
pnpm lint     # run oxlint
```

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
