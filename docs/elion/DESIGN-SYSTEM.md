# ELION Design System

**Status:** Active visual standard
**Updated:** 2026-09-12

## Design read

ELION is a trust-first B2B operational intelligence product for founders and operators. Its interface should feel like a diagnosis and delivery workspace, not a generic AI SaaS template.

- **Public mode:** persuade through clarity, evidence, and a single next step.
- **Authenticated mode:** operate through scanable information, quiet chrome, and explicit actions.
- **Design variance:** restrained editorial structure with occasional asymmetric detail.
- **Motion:** purposeful only: feedback, progressive disclosure, workflow sequence, or state change.
- **Density:** airy on public pages; compact but line-led in admin.

## Tokens

The source of truth is `src/app/globals.css`:

- `--color-surface` — primary dark workspace background.
- `--color-surface-raised` — page sections and primary content surfaces.
- `--color-surface-elevated` — controls and secondary emphasis.
- `--color-border` / `--color-border-light` — quiet structural separation.
- `--color-text-primary` / `--color-text-secondary` / `--color-text-muted` — three-level hierarchy.
- `--color-accent` / `--color-accent-bright` — one blue action and focus family.
- `--color-success`, `--color-warning`, `--color-error` — state only, never decoration.

Legacy authenticated pages may use the semantic aliases (`primary`, `card`, `foreground`, `muted`, `ring`, and `destructive`) which map to the same ELION palette. New UI must use the ELION variables directly.

## Shape and spacing

- Controls: `0.625rem` radius.
- Workspace cards: `0.75rem` radius, used only where grouping improves comprehension.
- Public surfaces prefer `border-t`, `border-b`, and `divide-y` over a wall of cards.
- Use the existing Tailwind rhythm: `gap-2/3/4/6/8` and `py-6/8/12/16/24`.
- Mobile layouts collapse to one column below `md`; controls remain reachable without horizontal scrolling.

## Typography

- Headings use self-hosted Space Grotesk.
- Body and controls use self-hosted Inter.
- Headings are tight and brief; body copy is relaxed and capped by readable max widths.
- `workspace-kicker` is reserved for product context and document sections, not every heading.
- Labels sit above inputs. Placeholder text is not a label.

## Shared compositions

- Public primary actions use `.public-primary`; public secondary actions use `.public-secondary`.
- Admin routes use `.workspace-shell`, `.workspace-page`, `.workspace-header`, `.workspace-action-*`, and `.workspace-field` where a page is being refactored.
- `AdminSidebar` owns navigation, grouping, independent scrolling, collapse, mobile overlay, and focus semantics.
- Proposal documents use `.proposal-preview` and are separate from editor chrome when printed.

## Motion rules

- Do not add perpetual movement to static information.
- Keep frequent admin interactions immediate and under 300ms.
- Keep public reveal motion limited to the first impression and meaningful workflow transitions.
- All automatic animation must degrade under `prefers-reduced-motion: reduce`.
- Never animate layout properties or attach scroll listeners that update React state.

## Trust rules

- No fabricated logos, customers, testimonials, metrics, ROI, or outcomes.
- Sample workflows must be labelled as illustrative or simulated.
- Admin metrics are real operational records only.
- Public CTAs follow this hierarchy: **Run Free Business Audit**, **See Interactive Demo**, **Book Discovery Call**.

## Implemented QA decisions

The final polish pass applies these concrete composition decisions:

- Private shells are `display: flex`; the sidebar spacer and fixed sidebar therefore remain aligned on every route.
- Below desktop navigation width, private page content receives a shared top inset so the menu trigger never covers a title or primary action.
- Public primary actions use one restrained blue treatment without a decorative shadow; secondary actions remain outlined.
- The audit input, progress, and report states use a quiet single container rather than layered dashboard panels.
- Proposal preview is a document surface: client contact, diagnosis, solution, technical requirements, implementation, investment, support, assumptions, acceptance, and next steps are visible before print.
- Tables remain horizontally scrollable when data is inherently tabular; forms and two-column content stack at mobile widths.
- “Available”, “Roadmap”, “Illustrative”, “Simulated”, and “Not a forecast” language remains explicit wherever examples could be mistaken for customer proof.

## Review checklist

Before shipping a UI change:

1. Does the screen state its location, purpose, and next action?
2. Is there one primary action rather than competing equal CTAs?
3. Are borders and cards explaining relationships rather than decorating empty space?
4. Does the mobile layout remain readable at 375px and 390px?
5. Are loading, empty, error, focus, and reduced-motion states present?
6. Does the change preserve authentication, tenant boundaries, APIs, payment logic, and evidence truth types?
