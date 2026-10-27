# Architecture

Shortlist is a static React application. Browser-side extraction produces inspectable evidence; deterministic rules turn that evidence into diagnostics. No application server or model inference service is required.

## Module guide

- `src/main.jsx` orchestrates input, the three-step workflow and exports.
- `src/ui.jsx`, `src/styles.css` provide shared controls, feedback, focus states and responsive layouts.
- `src/parsers.js` validates input formats and connects PDF.js/OOXML parsing to the browser.
- `src/pdf-core.js` extracts native PDF runs and operator evidence; rendering is supplied by the browser or integration-test canvas.
- `src/docx-core.js` inspects body XML, styles, relationships and omitted document regions.
- `src/geometry.js` evaluates supported coordinate/layout heuristics.
- `src/security.js` scans text and structural findings, maps supported exclusions and preserves positions.
- `src/extraction-audit.js` compares raw/source runs and independent reference passages.
- `src/engine.js` handles zoning, date scopes, skill mapping, score pillars and evidence criteria.
- `src/boolean.js` tokenizes and evaluates recruiter queries and produces safe text highlights.
- `src/data.js` contains the curated ontology, role presets and fictional sample generator.
- `src/recruiter.js`, `src/recruiter-view.jsx`, `src/platform-details.jsx` explain configured application scenarios.
- `src/check-audit.js` exposes score execution and platform rules, observations and fidelity notes.
- `src/inspection-views.jsx`, `src/detail-views.jsx` render the evidence inspectors and improvement tools.
- `src/workflow.js` validates/migrates state and detects stale analyses.
- `src/exports.js` creates snapshot-based export payloads and requests browser downloads.

## Extraction and source positions

PDF.js reads selectable text in native item order. Each run records page coordinates, font height and raw start/end offsets. Rendered page previews provide independent pixel evidence; overlays show where selectable runs were found. Previews are bounded before storage. Layout/contrast checks remain heuristic, especially for rotated text, clipping, overlapping content and visual tables.

Word documents are ZIP/OOXML-inspected using fflate and the browser XML parser. Body text is preserved with source ranges. Hidden run/style properties can be mapped to exclusions. Header/footer text appears as a separate source region when omitted from the body stream. Word page appearance is not rendered.

A supplied text reference can establish that a passage is absent or partially present. This comparison uses normalization and whole-word boundaries. It cannot locate a missing passage on a page without independent coordinates. No OCR is provided.

## Document integrity

`scanSecurity` returns findings, coverage, merged exclusions and a position-preserving scoring string. Known hidden formatting and supported high-confidence evaluator instructions can be masked. Newlines and character positions remain stable, and the original raw stream remains inspectable.

The scanner inspects supported instruction patterns, selected Base64 payloads, Unicode controls, drafting residue and structural parser findings. It does not execute embedded content. Context matters: quoted attack research is reviewed rather than automatically removed; low contrast and white font alone do not prove concealment. Optional separator cleanup preserves ZWJ/ZWNJ used in scripts and emoji.

Authorship is always `Undetermined` with a null probability. Proprietary watermark identification, arbitrary steganography, exhaustive malware analysis and a legal verdict are outside the implemented coverage. Inspect the per-category coverage labels before interpreting a clean result.

## Analysis and scoring

Analysis uses the scoring text after mapped exclusions. Canonical headings zone the document; role/project date scopes attach context to bullet evidence. Overlapping intervals are unioned; end month minus start month defines duration. `Present` uses the supplied analysis date.

Nineteen subchecks form five pillars: 20 parser, 25 anchoring, 25 searchability, 15 rubric and 15 readiness. `scoreExecutionAudit` recomputes the pillar total. The 45/25/20/10 alignment calculation is a separate local proxy, not a commercial ATS formula.

Supported simple criteria use actual skill/degree evidence. Explicit minimum skill duration checks dated intervals. Unsupported natural-language or mixed logic requirements are marked for manual review. Quotes are taken verbatim from the source.

The normalized profile has app-owned `ENG:` taxonomy identifiers. It is HR-JSON-inspired and is not a certified vendor schema. Alias ambiguity and incomplete taxonomy coverage remain known bounds.

## State and exports

Workspace version 2 separates `draft` from `analysisInputs`. Tab `sessionStorage` saves the workspace; restoration validates supported values and migrates older drafts without manufacturing a new analysis.

A fingerprint covers the resume, job description, application answers, criteria, date and relevant extraction metadata. Display-only segment data does not itself invalidate a review. Changed inputs block UI exports and are also rejected defensively by the export function.

Text edits do not establish new PDF geometry. Re-uploading the final file is necessary to review the revised document layout. Session storage may be limited by browser quota or session-restoration behavior; export important work.

## Platform scenarios

There are eight selectable vendor/grouped models plus General review. Shared form checks use explicit scenario settings. Vendor-specific views add local evidence/rubric logic and disclose its basis. Unconfirmed or stale answers are not labelled evaluated. Lever fast-forward requires an explicit enabled scenario.

There are zero external vendor calls. The suite validates local behavior; it does not measure agreement with a proprietary ATS or predict an employer's decision. [Source references](SOURCES.md) document those distinctions.

## Verification boundaries

The 70-test suite covers pure rules, state, exports and actual PDF extraction/rendering. Word formatting helpers are unit-tested and the production Word parser has browser-fixture observations in [QA.md](../QA.md). No end-to-end commercial-ATS comparison, OCR validation or universal AI-authorship benchmark is claimed.
