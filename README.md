# NAIMAKE — Video Template Marketplace (prototype)

An interactive prototype of a video template marketplace for NAIMAKE. The flow it covers: **Discover → Preview → Use Template → Customize → Export (demo)**.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (hash routing, deployable anywhere)
```

Stack: React 19, TypeScript, Tailwind CSS v4, React Router (hash routing), lucide-react.

## What's real and what's placeholder

| Area | Status |
| --- | --- |
| 26 templates, 6 creators, collections | **Demo content.** Not NAIMAKE inventory. Creator profiles and stats are fictional samples. |
| Preview media | Unsplash photos (Unsplash License), loaded from `images.unsplash.com`. Images with visible brand logos were left out. |
| Template previews | Animated compositions drawn live by `TemplateStage` (Ken Burns motion, scene cross-fades, text reveals). They are not MP4 files. |
| Export | **Demo only.** The dialog shows the planned resolution, format and fps options and a simulated progress bar. No video is rendered. Users can download their project settings as JSON. |
| Music | Track names only. No audio is bundled. |
| Pricing, plan limits, license terms | **Placeholder proposals**, labelled as such in the UI. No payments. |
| Sign in | Not connected. Saved templates, follows and projects persist in `localStorage` (`naimake.proto.*`). |

## Architecture

- `src/data/` — typed demo data: templates (scenes, media slots, text slots, palette), creators, collections, taxonomy.
- `src/components/stage/TemplateStage.tsx` — one renderer for every preview. Inputs: (template, customization, time). Cards, the detail player and the workspace all use it, so edits appear in the preview the same way everywhere.
- `src/lib/catalog.ts` — search, filter and sort, plus a mock `fetchTemplates` with network-like latency so the loading, empty and error states actually run. Add `?simulate=error` to the Explore URL (e.g. `#/?simulate=error`) to see the error state.
- `src/store/AppStore.tsx` — saved templates, projects (with two seeded demo projects) and follows, persisted locally. Uploaded images are downscaled to data URLs so they persist. Uploaded video clips are session-only.
- `src/i18n/` — every piece of UI copy is in `en.ts`. To add Vietnamese, fill in `vi` in `i18n/index.tsx` with the same keys; missing keys fall back to English.

## Performance and accessibility

- Previews play only while hovered, focused or tapped (touch). They pause when off-screen (IntersectionObserver), and only one plays at a time on touch devices.
- Images are lazy-loaded with skeleton placeholders. Each card renders just its poster scene until it plays.
- `prefers-reduced-motion` turns off autoplay, Ken Burns motion and text movement.
- Visible focus rings, labelled controls, focus-trapped dialogs and sheets, Escape to close.

## Swapping in real content

- To use real MP4 previews, add a video field to `Template` and render it in `TemplateCard` when present. `StageMedia` already plays video sources.
- Replace the `PHOTOS` ids in `src/lib/media.ts` with real NAIMAKE assets.
