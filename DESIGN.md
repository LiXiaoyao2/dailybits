# Design

<!-- impeccable:design-schema 1 -->

## Direction

DailyBits is a user-facing learning website, not an operations console. The interface should feel like a polished daily discovery desk: users find useful material, subscribe to a rhythm, create their own banks, and check progress without reading documentation.

The current visual direction is content-first light tech. It uses clear white work surfaces, ink active states, cobalt focus, restrained environment light, floating navigation, and compact content cards that behave like scheduled learning packets. The home page avoids decorative hero graphics and immediately exposes the channel switcher, search, and live content stream.

## Tokens

- `--primary`, `--accent`: cobalt focus, primary actions, selected tabs, and keyboard rings.
- `--surface-ink`, `--surface-night`: dark editor headers and high-contrast surfaces.
- `--surface-mint`: success, creation, and calm learning accents.
- `--surface-coral`, `--surface-citrine`: digest and warning accents used sparingly.
- `--surface-sky`, `--surface-field`: luminous learning backgrounds and empty states.
- `--radius`: shared radius for panels, cards, forms, and tab controls.

## Components

- `Header`: floating brand chip plus navigation pill, preserving the existing IA while making the app feel lighter.
- `HomeFrame`: compact command bar plus horizontal channel switcher, with real content directly below.
- `PageHeader`: broad page intro surface for creator, dashboard, admin, and preview pages.
- `WorkbenchPanel`: reusable framed work surface for forms, subscriptions, previews, and history.
- `MetricLine`: dashboard and admin summary cells.
- `content-card`, `stream-toolbar`, `empty-slate`: shared classes for discovery cards, search bars, and empty states.

Base controls continue to use the existing shadcn/Base UI stack. Icons use `lucide-react`. No paid service or external account is required.

## Motion

Motion is intentionally small but visible: page entry and card lift only. Reduced motion users get animations disabled through `prefers-reduced-motion`.

## Page Coverage

- Home: compact command bar, my-content action, create menu, horizontal channel tabs, search, content cards, and compact empty states.
- Dashboard: user content center with stats, created content, digest subscription, personal subscriptions, and push history.
- Create question bank and create knowledge bank: form plus live summary panel.
- Detail and edit pages: stronger editor hero surfaces and consistent work panels.
- Digest preview: messaging card stream with paged Markdown examples and a compact advice rail.
- Admin overview and group page: same headers, panels, metrics, and overflow behavior.

## Boundaries

The redesign preserves routes, APIs, Auth Hub behavior, Directory lookup, schedule semantics, card-service integration, and real Chinese copy. Styling should not change push logic or content visibility rules. For future changes, keep desktop first, but avoid page-level horizontal overflow on narrow windows.
