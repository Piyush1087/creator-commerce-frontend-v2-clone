# C01 I7 frontend dependency-security classification

Date: 2026-09-01

Branch: `c01/i7-joint-runtime-acceptance`

Starting SHA: `dcb79ef351bca13cea9c408084e881050e0259f2`

## Result

```text
FRONTEND_DEPENDENCY_SECURITY =
RELEASE_BLOCKED
```

The production dependency audit reports nine affected packages: eight high and one moderate. The full audit reports eighteen affected packages: one critical, thirteen high, two moderate, and two low. The direct `react-router-dom@6.28.0` chain is runtime-reachable throughout navigation and authentication, includes open-redirect/XSS advisories, and has a non-major fix at `6.30.6`. The authenticated-session fast path also consumes router `location.state.from` directly, while the explicit post-login resolver validates only other login completion paths. This is sufficient to hold the frontend release pending a controlled dependency update and regression run.

The direct `axios@1.7.9` package is also high severity and has a non-major fix at `1.20.0`. Its current application use is narrowly limited to a fixed-origin `/health` request in the browser, which reduces exposure to Node-adapter SSRF and proxy advisories but does not eliminate the package's prototype-pollution and denial-of-service debt. Runtime Socket.IO and PDF-export transitive findings add further inherited risk.

No package, lockfile, or application code was changed in I7. `npm audit fix` was not run.

## Evidence collected

- `npm audit --json`: completed; 18 affected packages.
- `npm audit --omit=dev --json`: completed; 9 affected packages.
- `npm ls`: completed with exit code 0 and no invalid or missing dependency tree entries.
- Production build and typecheck: passed.
- Reachability inspection: React Router is the application router; Axios is used only by the fixed `/health` client; Socket.IO is used by collaboration realtime; jsPDF is used by brand-audit PDF export.

## Per-package classification

| Package / installed version | Dependency / environment | Severity and affected range | Current reachability and deployed relevance | Fix / breaking major | C-01 relevance | Release impact |
|---|---|---|---|---|---|---|
| `@eslint/plugin-kit@0.2.8` | Transitive, dev-only through ESLint | Low; `<0.3.4` | Config-comment ReDoS is limited to linting attacker-controlled configuration text; not shipped to the browser. | ESLint `9.39.5`; no major | Validation tooling only | Nonblocking dev debt |
| `@remix-run/router@1.21.0` | Transitive, runtime through React Router | High; `<=1.23.2` | Core routing is application-wide. Advisories include open redirect and redirect-derived XSS; navigation and auth-return paths are reachable. | React Router DOM `6.30.6`; no major | Directly relevant to Creator Entry/auth return | Blocking |
| `axios@1.7.9` | Direct, runtime | High; `1.0.0–1.17.0` | Used only by the fixed environment-origin `/health` call. Browser use limits Node HTTP/proxy attack paths, but merge/prototype and resource-consumption advisories remain inherited runtime code. | Axios `1.20.0`; no major | Indirect health surface | Blocking dependency debt pending update/regression |
| `brace-expansion@1.1.14` and `2.1.0` | Transitive, dev-only through ESLint/TypeScript ESLint | High; `<=1.1.17` or `2.0.0–2.1.3` | Glob expansion is used by local lint tooling, not by the deployed application; malicious pattern input is not a Creator Shop runtime input. | Available transitively; no major indicated | None at runtime | Nonblocking dev debt |
| `dompurify@3.4.12` | Transitive, runtime through jsPDF | Moderate; `<=3.4.12` | Reachable in client-side brand-audit PDF generation. The cited detached-subtree XSS issue is not exercised by C-01 Creator Entry evidence, but is shipped runtime code. | Available transitively; no major indicated | Outside C-01 journey | Runtime debt; not independently blocking |
| `engine.io-client@6.6.5` | Transitive, runtime through Socket.IO client | High; affected through `6.6.5` | Collaboration realtime is runtime-reachable. The vulnerable `ws` implementation is primarily a non-browser transport path, reducing deployed-browser exploitability. | Available transitively; no major indicated | Outside C-01 entry path | Runtime debt included in release hold |
| `esbuild@0.21.5` | Transitive, dev/build through Vite | Moderate; `<=0.24.2` | Development-server cross-origin request/read issue; the dev server is not the deployed frontend. | Vite `5.4.21`; no major | Build tooling only | Nonblocking dev debt |
| `eslint@9.18.0` | Direct, dev-only | Low; `9.10.0–9.26.0` | Lint runner only; not in production assets. | ESLint `9.39.5`; no major | Validation tooling only | Nonblocking dev debt |
| `form-data@4.0.5` | Transitive, production dependency tree through Axios and dev jsdom | High; `4.0.0–4.0.5` | CRLF injection affects multipart field names in the Node-oriented adapter. Current browser `/health` GET does not construct multipart data. | Available transitively; no major indicated | No current C-01 call path | Runtime-tree debt; not independently blocking |
| `js-yaml@4.1.1` | Transitive, dev-only through ESLint config | High; `4.0.0–4.3.0` | YAML alias complexity affects tooling input, not deployed browser requests. Repository-controlled configs are the current input. | Available transitively; no major indicated | None at runtime | Nonblocking dev debt |
| `nanoid@3.3.12` | Transitive, dev/build through PostCSS/Vite | High; `<=3.3.17` | Vulnerable custom/invalid size APIs are not called by application code and the package is not a production application dependency entry point. | Available transitively; no major indicated | None at runtime | Nonblocking build debt |
| `postcss@8.5.14` | Transitive, dev/build through Vite | High; `<=8.5.22` | Source-map file disclosure/path traversal applies during CSS processing with attacker-controlled source-map references; production serves generated static assets. | Available transitively; no major indicated | Build pipeline only | Nonblocking build debt |
| `react-router@6.28.0` | Transitive, runtime | High; `6.0.0–7.17.0` | Application-wide routing. Open redirect/backslash/protocol-relative and SSR hydration advisories include browser-relevant paths; this SPA does not use React Router SSR hydration, but navigation is heavily reachable. | React Router DOM `6.30.6`; no major | Directly relevant to all C-01 routes | Blocking |
| `react-router-dom@6.28.0` | Direct, runtime | High; `6.0.0-alpha.0–6.30.2` | Primary frontend routing dependency. Auth, callback, recovery, settings, and campaign-return navigation all depend on it. | `6.30.6`; no major | Directly relevant | Blocking |
| `socket.io-parser@4.2.6` | Transitive, runtime through Socket.IO client | High; `4.0.0–4.2.6` | Zero-attachment memory exhaustion is relevant when collaboration realtime processes hostile frames; not used during C-01 Creator Entry. | Available transitively; no major indicated | Outside C-01 journey | Runtime debt included in release hold |
| `vite@5.4.11` | Direct, dev/build | High; `<=6.4.2` | Findings target Vite dev-server file access, path traversal, and launch-editor behavior. The deployed site contains static build output, not a Vite server. | `5.4.21`; no major | Production build tool only | Nonblocking dev debt |
| `vitest@2.1.9` | Direct, dev-only | Critical; `<3.2.6` | UI-server arbitrary file read/execution is not reachable because acceptance uses non-UI `vitest run` and Vitest is not deployed. | `4.1.11`; major required by audit recommendation | Test tooling only | Nonblocking for runtime; controlled major upgrade required |
| `ws@8.20.1` | Transitive, runtime tree through Engine.IO and dev jsdom | High; `8.0.0–8.20.1` | Tiny-fragment memory exhaustion affects `ws`. Browser Socket.IO normally uses the native WebSocket implementation; jsdom use is test-only. | Available transitively; no major indicated | Outside C-01 browser path | Runtime-tree debt included in release hold |

## Required remediation outside I7

1. Upgrade `react-router-dom` to at least `6.30.6`, route every `location.state.from` use through an allowlisted same-origin path resolver, and rerun auth, callback, invite, continuation, and route-guard regressions.
2. Upgrade Axios to at least `1.20.0` or replace the single health call with the shared authenticated-fetch convention, then rerun the production build and health checks.
3. Refresh Socket.IO and jsPDF dependency chains to remove `socket.io-parser`, `engine.io-client`/`ws`, and DOMPurify advisories; validate collaboration and PDF export.
4. Upgrade Vite/ESLint transitive chains using non-major releases where possible. Plan the Vitest major upgrade separately and keep its UI server disabled/unexposed.
5. Rerun both audits and require an explicit security review for any residual high or critical runtime finding.
