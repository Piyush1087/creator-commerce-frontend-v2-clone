# Brand Centre — final visual reconciliation

Branch: `phase-g/brand-centre-brand-reconciliation`.
Original baseline: `cbef201c571c6493c0a83ca4a6be12963faa959d`.
Stage 2 was reviewed PASS before this stage. Its 29-file uncommitted inventory and
SHA-256 hashes were recorded outside the repository before editing. No reset,
re-ingestion, backend modification, semantic redesign or Stitch invocation occurred.

## Frozen inputs

- Consumer: `GET /api/v1/brand-centre/brand`, backend `884eed094706f091d5de494d1b72bcf36754a1cd`.
- FE authority: `62f88e3722226b23b20f017a9b69a63d2ca6db99`.
- UX authority: `b2340be42deb713c0cef696f1e0b477c945df8ca`.
- Systems authority: `a6bed1f28564c002f7d76931de0b4dd960ea5ae1`.
- Previously ingested 14-pair accepted visual registry, Visual State Map and UI Copy
  & Layout Blueprint. Product, runtime semantics and accepted UX take precedence.

## Owned visual regions

| Region | Accepted source |
| --- | --- |
| Desktop rail/header/navigation/bounds | `3ba35b0428de49bcb08b55b6efd8355e` |
| Mobile shell | `f490c6c2d0104032a860052b5345ae90`, M01 structural hierarchy |
| Identity and Initial Learning | D01 `e24870acc3154f6fa9941f23ac261408`, M01 `eac16569b87c4feeb4be818e0a873ddc` |
| Story and Communication | D02 `abbc50c8e9144aab9c2a5108f70afd30`, M02 content only `f2146f16c3f449e4b2f3cafaae79aacf` |
| Audience | C1 `14514017d4b147aa98bbb5b8f9e64616`, mobile `db97338edc84498aad14b4cfa8db3ce5` |
| Visual assets / interpretation | C2 `0bbdbdc2978b47e2a7e98b71aaf79b29`, mobile `1b6d75a2924e44ef925321eb6ec23a2d` |
| Locations, once | C3 `7e5a906978c4497c896458076af7b5f7` owned HTML region |
| Serviceability | C4 `f48b42c943134c1c9eb44304691d12e7` owned HTML region |
| Local Positioning conflict | D04 `0afe51ab9f77465aa63c4471b9c81c6a`, M04 `73c88437c8124e4ba17e64e517a852b2` |

No monolithic D03 was copied. Cropped PNGs, duplicate sections and later shell
mutations do not override the ownership registry.

## Implementation boundary

Presentation components compose the existing mapped nodes; Stage 2 adapters,
contracts, schemas, client and query/cache files remain byte-identical. Learning
groups require every included node's existing presentation to be LEARNING and no
candidate notice. Current values, evaluated null, evaluated empty, omitted,
not-owned, stale and unavailable cases are not recategorized to obtain a layout.

Aurora surfaces/tokens provide the identity region, open section headings,
dominant narrative, paired supporting Story regions, wrapped traits, structured
Communication, 2+1 desktop Personas and naturally stacked mobile cards. Persona
headings use current labels, while React identity remains the durable semantic ID.
Canonical assets precede a separate derived interpretation on every viewport.
Safe hex swatches supplement, never replace, canonical palette text.

The shell variant is limited to the Brand workspace: fixed 80px desktop rail,
72px desktop / 56px mobile header, 1152px content bounds, compact mobile selector,
bottom-navigation clearance and reduced-motion overrides. Fixed positioning avoids
the existing root overflow container defeating sticky positioning. Other routes
retain their shell layout. Shared drawer accessibility uses inert closed content,
a named dialog, initial focus, Tab boundary containment and Escape focus return.
The covered background is inert while the drawer is open.
Final repeated-opening checks caught inherited visibility being animated by the
shared header button's `transition: all`. The Brand drawer limits that transition
to colour properties so initial focus transfers synchronously, including with
reduced motion. Five consecutive openings passed after the bounded correction.

## Intentional differences from generated references

- Existing authenticated application destinations, labels, glyphs and app mark
  remain authoritative under the accepted UX's unchanged-shell rule. Mobile retains
  Home / Campaigns / Brand Centre / Chat; no invented Brands or Collabs destinations.
  The existing menu remains available instead of adding a nonfunctional account control.
- Backend current text and FE labels remain unchanged. No invented editing,
  candidate actions, maps, addresses, verification badges or extra locations.
- Missing canonical typography says “Not established yet”; Aurora Satoshi and
  Source Sans 3 are application fonts, never asserted as approved Brand typefaces.
- Conflict follows the protected current value and confirmation, with a quieter
  neutral surface than Stitch. Candidate content is not present in the DOM.
- Test-only fixtures use an explicitly named canonical fixture mark, not an
  extracted or invented real Northstar logo. They are never a production fallback.

## Review and validation

Deterministic Initial Learning, Progressive Understanding, Mature and Conflict
fixtures run through the strict parser and production route. Screenshots and Axe
4.10.3 tooling remain outside the repository; production dependencies are unchanged.
Review uses viewport captures because the local browser's full-page compositor
produced stitching artifacts. Actual DOM section counts/order were independently
checked. Desktop 1440, mobile 390×844 and an 820px tablet sanity breakpoint are covered.

Focused regression suite: 81 tests (original 72 plus nine composition checks).
Full suite: 300 tests (original 291 plus nine). Typecheck, production build,
changed-file ESLint, diff check and browser/Axe checks are required at handoff;
the accompanying final reconciliation record contains the final execution results.
The existing build chunk-size warning and React Router static-render test warnings
are not suppressed. No assertions or lint rules were relaxed.

Browser keyboard checks cover explicit drawer initial focus, first/last Tab
containment, Escape return, selector disclosure and visible focus. The local browser
does not synthesize native Enter/Tab defaults consistently; these native controls
retain standard HTML behavior, with handler boundaries verified directly through
supported browser key events. This is not a screen-reader certification.

Backend database/auth-runtime recertification remains outside this visual stage.
No merge to development is authorized by this reconciliation.
