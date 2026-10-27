# Redesign verification — 27 October 2026

Keep future implementation batches to a maximum of 10 logical changes. Run relevant tests and a production build at each checkpoint, then inspect the affected browser flow before publication.

## Checkpoint 1 — workflow foundations (8 changes)

1. Replace eight equal navigation destinations with three user steps.
2. Start new workspaces with empty resume input; make examples deliberate.
3. Separate draft inputs from the analyzed snapshot.
4. Restore existing sessions without silently treating unreviewed edits as analyzed.
5. Prioritize findings and route each recommendation to a specific tool.
6. Connect the working draft to the five fix tools.
7. Block stale exports and provide a clear update action.
8. Move simulator selection into an explained, sequential workflow.

Result: original 28 engine/PDF tests passed; production build passed.

## Checkpoint 2 — design and user-state safeguards (9 changes)

1. Replace the green dashboard and decorative hero with a white interface and black primary buttons.
2. Use system Helvetica/Arial fonts; remove external font requests.
3. Increase readable text and simplify responsive layouts.
4. Require confirmation of example application answers before showing outcomes.
5. Make platform evidence and advanced rules expandable.
6. Preserve custom JDs when changing domains; update preset JDs appropriately.
7. Validate restored values and recover malformed session input safely.
8. Add keyboard tab navigation, copy feedback and reset/undo.
9. Add workflow and simulator regression checks.

Result: 44 tests passed; production build passed.

## Checkpoint 3 — consistency and final polish (8 changes)

1. Explain a distinct result for each vendor workflow.
2. Keep Workday's graduate-requisition exception consistent between outcome and detail.
3. Replace checklist jargon with direct labels.
4. Collapse repeated scoring details; preserve access to calculations.
5. Extract export payload generation and reject stale requests defensively.
6. Use attached browser download links, delayed URL cleanup and explicit download-request feedback.
7. Improve mobile input sizes and keep long text within the layout.
8. Open the first incomplete fix, mark stale print reports, and update usage documentation.

Result: 50 automated tests passed. Final source is built again by the Site packaging workflow.

## Observed browser checks

- First visit shows Resume & role without an invented score.
- Real structured sample PDF parses and moves to Review findings with 92.6/100.
- General review and all eight vendor choices render; no JavaScript console errors observed.
- Workable scenario with relocation No explains the disqualification and its reason.
- Changing the answer back to Yes and confirming updates the outcome.
- Workday graduate checkbox updates both the main outcome and the detailed model to Not graded.
- Editing the headline and a dated project bullet blocks exports until review is updated.
- Reloading preserves those edits while retaining the previous 92.6 analysis and stale-state notice.
- Updating produces 100/100 for the edited example and re-enables exports; geometry remains explicitly provisional after text edits.
- Export payload tests verify exact resume text, actual score, evidence, confirmation metadata and stale-request rejection.
- Browser download buttons were exercised. The in-app browser did not expose immediately inspectable files in Downloads during this run, so local file handoff is a verification limit; the UI acknowledges requests and provides browser-download guidance.
- Desktop viewport 1280: document width equals viewport width.
- Mobile viewport 390: Findings, Skill evidence, ATS simulator and Parsed text all have document width 390, with no horizontal overflow.
- ArrowRight moves keyboard focus/selection from Findings to Skill evidence.
- Start over followed by Undo restores the previous workspace.

The parsing/scoring engine is preserved. Platform modes remain deterministic teaching models, with their assumptions explained in the interface.


# Integrity and ATS execution verification

## Checkpoint 4 — source evidence and safe scoring (9 changes)

1. Extract source-positioned PDF runs and render the original page.
2. Inspect non-painting/transparent operators, raster contrast, small text and bounds.
3. Map Word hidden styles and omitted header/footer regions.
4. Scan Unicode, prompt patterns, encoded instructions and drafting residue.
5. Preserve raw input while masking confirmed mapped scoring exclusions.
6. Add green/red/amber parser overlays, selected-run details and reference comparison.
7. Add AI Detector with evidence and explicit authorship/coverage limits.
8. Expose actual score and platform execution traces with vendor-source limitations.
9. Add known adversarial PDF/DOCX fixtures and production-PDF integration checks.

Result: 68 tests and production build passed after the checkpoint fixes.

## Checkpoint 5 — criteria, feedback and consistency (8 changes)

1. Require manual review for unsupported natural-language criteria.
2. Check explicit minimum skill duration against dated intervals.
3. Make Lever fast-forward an explicit form scenario.
4. Animate successful draft changes with a tick and live announcement.
5. Keep completed bullet actions mounted; disable unsupported replacements.
6. Expose PDF overlay rectangles as keyboard-operable controls.
7. Include security, score and platform traces in audit exports.
8. Add small-font evidence, mobile layouts and everyone tagline.

Result: 70 tests and production build passed.

## Checkpoint 6 — final verification (4 changes)

1. Compare reference words at whole-word boundaries and name missing words.
2. Display a disabled optional scenario neutrally.
3. Document capabilities, assumptions and limits.
4. Repeat the affected browser flows and package the verified source.

Observed browser checks:

- Real PDF test fixture: 8 extracted, 2 needing review and 2 excluded runs. A selected non-painting instruction displays not-visible, original offsets and exact source text over the actual original-page render.
- Word fixture: hidden run and instruction lines excluded; white font flagged for context; U+200B reviewed; legitimate Devanagari joiner informational. Header-only email appears under regions omitted from the body stream.
- Reference comparison distinguishes an exact passage, a partially found passage with named missing words, and a missing passage without invented coordinates.
- Score audit displays 19 checks, no AI model and a recomputed total matching the visible score.
- Before confirmation, platform trace reads not-run. Confirming Lever yields 8 evaluated local checks and Standard review queue when fast-forward is disabled.
- Apply to draft displays a tick, Applied to draft and an accessible live success announcement. The draft changes and exports become stale until review is updated.
- At 390 px, AI Detector, parser/reference view and simulator have document width 390; all five tabs remain visible. At 1280 px, original-page overlay and details render side by side.
- No browser console warnings/errors observed in the affected flows.

Limits: these tests validate local algorithms and synthetic fixtures, not proprietary ATS equivalence, AI authorship, exhaustive steganography, OCR or malware detection. Download payloads are tested; native browser file handoff retains the previously documented limitation.

# GitHub distribution checkpoint — 28 October 2026

- Imported the complete runnable application, fictional fixtures, source generators and tests into the public repository; excluded private hosting identity, personal documents, installed dependencies and generated builds.
- Added a visual README, linked architecture/development/deployment/source documentation, MIT license, security/contribution policies, issue forms and pull-request guidance.
- Pinned CI actions to verified release commits and added clean-install, dependency-advisory, documentation, test and build checks.
- Made native canvas an explicit test dependency and removed the fixture generator's machine-specific temporary-file requirement.
- Updated PDF.js to 6.2.108 for GHSA-hq66-cqwq-w95j. Adapted document cleanup to the loading-task API and converted link rectangles using the viewport transform.
- Strengthened the eight sample-PDF integration cases to use the production extraction core and assert real link/header-link evidence.
- Verified a clean npm installation, 70 passing tests, 34 local documentation links/assets and a production build. The registry audit reports zero known vulnerabilities at this checkpoint.
- Regenerated the fixtures from checked-in source and visually checked the normal aerospace and integrity PDF renders.
- Browser-tested the upgraded PDF.js with a structured sample and the integrity fixture: actual preview rendering, two mapped hidden-text exclusions, prompt evidence and white-font/small-text review flags were observed.

The existing private hosted Site is a separate deployment. This checkpoint verifies the GitHub source distribution; its dependency update requires a separate Site publication to appear there.
