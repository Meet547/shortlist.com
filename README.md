<p align="center">
  <img src="docs/assets/shortlist-banner.svg" alt="Shortlist. Resume review for everyone. Read, understand, improve." width="100%">
</p>

# Shortlist

**Understand what your resume actually says to a parser—and what to improve next.**

[![Checks](https://github.com/Meet547/shortlist.com/actions/workflows/ci.yml/badge.svg)](https://github.com/Meet547/shortlist.com/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-111111.svg)](LICENSE)
[![Processing: in your browser](https://img.shields.io/badge/Processing-In%20your%20browser-ffffff?labelColor=111111&color=eeeeee)](#privacy)

[Get started](#get-started) · [Take the tour](#take-the-tour) · [Explore the features](#what-you-can-inspect) · [Understand the score](#where-the-100-points-come-from) · [Build on it](#contribute)

A resume can look excellent on a page and still lose its structure when parsed. A list of tools can look impressive and still leave a recruiter asking where you used them. Shortlist makes those gaps visible, with source text, dated evidence and a clear next action.

Upload a resume, compare it with a role, inspect the findings, and improve a working draft. The interface stays simple: white pages, black buttons, readable typography and three steps.

> **Current scope:** the interface welcomes everyone. The curated skill library, sample roles and eligibility defaults currently focus on Indian mechanical engineering candidates across aerospace, EV, UAV and robotics. Other disciplines need human review of skill coverage and scenario settings.

## Get started

Use **Node.js 24** and npm. No API key, backend, database or `.env` file is needed.

```sh
git clone https://github.com/Meet547/shortlist.com.git
cd shortlist.com
npm ci
npm run dev
```

Open the local address Vite prints. To build and inspect the production version:

```sh
npm test
npm run build
npm run preview
```

The build lives in `dist/` and can be served by a static host. See [deployment options](docs/DEPLOYMENT.md).

<details>
<summary><strong>See the workspace before installing</strong></summary>

![The three-step resume workspace, with empty resume and role inputs](docs/assets/resume-workspace.png)

The screenshot contains no personal resume. The [existing hosted workspace](https://shortlist-engineering-lab.finetrout4096.chatgpt.site/) is access-restricted; running locally gives you your own copy.

</details>

## Take the tour

1. **Resume & role.** Choose **Try a structured example** to load a real PDF with a fictional candidate. Or upload your own PDF, DOCX or UTF-8 TXT and paste a vacancy.
2. **Review findings.** Start with the recommended actions. Open **Skill evidence** to see which mentions have dated project evidence, then **Parsed text** to inspect the actual extraction.
3. **Test an application scenario.** In **ATS simulator**, choose the system named on a portal—or use **General review**. Replace the example answers and select **Check application answers**. Read the outcome, rule and evidence.
4. **Inspect document integrity.** Open **AI Detector**. **Inspect test PDF** loads a fictional document containing hidden text and evaluator instructions; **Undo** restores the previous draft.
5. **Improve & export.** Apply a supported edit, look for the success tick, and select **Update review**. Export the reviewed text, audit JSON or candidate profile, or print the audit to PDF.

**A changed draft needs a fresh review.** Editing the resume, job description, criteria, application answers or analysis date marks the results out of date and blocks exports until they match again.

## What you can inspect

### The original page and its parser stream

PDFs are actually extracted and rendered. Select an overlay box to inspect its exact text, source offsets, font height, position and visibility evidence.

- **Green — extracted.** The selectable text is present in the raw stream.
- **Amber — review.** Contrast, small text, margins or reading order need attention.
- **Red — explicitly labelled omission or exclusion.** A missing reference passage differs from text that was extracted but excluded from scoring.

Paste an independent reference to identify missing passages and words. Word headers and footers omitted from the main-body stream appear separately. Missing words are never assigned invented page coordinates.

![The live PDF inspector showing extracted runs and an excluded non-painting instruction in a fictional test document](docs/assets/parser-inspector.png)

### Skills with evidence, dates and context

A skill mention and demonstrated experience answer different questions. Shortlist groups project and internship bullets, normalizes month ranges, unions overlapping intervals, and attaches verbatim evidence to matched skills. A flat skills list receives zero months of experience and an unknown last-use date.

Recruiter search supports Boolean expressions, parentheses, negation, exact phrases, wildcards and field scopes. Full-phrase/acronym checks expose cases such as `Finite Element Analysis` and `FEA`.

### Eight ATS workflow models

Choose Workday + HiredScore, Greenhouse, Lever, Ashby, Zoho Recruit, Workable, Darwinbox / Keka, or Freshteam / Kula. Each view exposes the local checks evaluated, their inputs, evidence and assumptions. Unconfirmed answers display **not-run**.

These are educational workflow models. Their weights, thresholds and grades are local approximations; no proprietary ATS is queried and vendor-equivalence accuracy has not been measured. Documentation-backed workflow concepts are separated from scenario assumptions. [Read the sources and fidelity notes →](docs/SOURCES.md)

### AI Detector and document integrity

The audit inspects supported evaluator instructions, selected encoded payloads, invisible Unicode, template residue, PDF non-painting/transparent text, Word hidden styles, suspicious links and active-content indicators.

Confirmed mapped hidden content and recognized evaluator instructions remain inspectable in the raw stream and are masked before local scoring. White font and low contrast require context. Legitimate Indic/Arabic joiners remain intact during optional separator cleanup.

**AI authorship stays “Undetermined.”** This feature does not provide an AI-writing probability, universal watermark detection, a legal judgment or exhaustive malware analysis. [Coverage and limits →](docs/ARCHITECTURE.md#document-integrity)

### A working draft you can trust

Edit alongside the findings, apply supported replacements with visible success feedback, and keep the analyzed version separate from unsaved changes. The three exports are:

- `resume-reviewed.txt` — the current reviewed text.
- `shortlist-audit.json` — score breakdown, criteria, application checks and integrity/execution traces.
- `candidate-hr-profile.json` — structured candidate fields, skills, dated evidence and diagnostics.

Printing uses your browser's print/save-PDF dialog. Text edits require re-uploading the final PDF to verify its new layout.

## Where the 100 points come from

**No AI model calculates the score.** Nineteen deterministic subchecks contribute to five pillars:

- **20 points · Parser integrity:** reading flow, contact information, sections, dates and supported layout traps.
- **25 points · Skill anchoring:** required-skill coverage, dated context and quantified impact.
- **25 points · Searchability:** Boolean matching, full phrases/acronyms and role mirroring.
- **15 points · Recruiter rubric:** app-defined qualification, criteria-evidence and alignment models.
- **15 points · Application readiness:** five action checks, subject to the configured application gate.

Open **Which AI gives the score?** in Findings to inspect every subcheck and the recomputed sum. A failed configured form gate withholds the readiness pillar. Unsupported natural-language criteria require manual review.

The score is a diagnostic for the selected inputs. It is not a hiring probability, ATS certification or guarantee of an interview. Employers configure their own systems and make their own decisions.

<details>
<summary><strong>Why can two similar-looking resumes receive different results?</strong></summary>

A tool inside a dated project bullet can establish experience; the same tool in a standalone skills list cannot. Native PDF reading order, recognized headings, explicit date ranges, the selected job description and application settings also affect the result.

The calculation date is explicit so `Present` can be evaluated repeatably. Overlapping dates are unioned instead of added twice. The separate alignment proxy uses app-defined 45/25/20/10 weights; those are not claimed as a vendor's formula.

</details>

## How it works

```mermaid
flowchart LR
    A["PDF / DOCX / TXT<br/>or pasted text"] --> B["Native extraction"]
    B --> C["Preserved raw text"]
    B --> D["Document and page evidence"]
    C --> E["Integrity scan and mapped exclusions"]
    E --> F["Dated skills, search and 19 score checks"]
    C --> G["Guided review"]
    D --> G
    F --> G
    G --> H["Working draft"]
    H -->|Update review| E
    F --> I["Snapshot-checked exports"]
```

**Stack:** React 19, Vite 6, PDF.js, fflate and Lucide. Plain JavaScript modules handle the analysis; PDF.js uses a bundled worker. System Helvetica/Arial fonts avoid external font requests. Node's built-in test runner and native canvas support the regression suite.

For module responsibilities, source-position mapping, score execution and state boundaries, see [Architecture](docs/ARCHITECTURE.md).

## Privacy

The application processes resume content in your browser. Its code makes no remote parsing, AI-model or vendor-ATS requests. It fetches its own sample documents when you choose an example.

Draft text, extraction data, previews and the last analyzed input are stored in **this tab's `sessionStorage`**. This is browser storage, not encrypted document storage; browser session restoration may retain it. **Start over** clears the active workspace and offers a brief Undo. Exports stay under your control.

External documentation links open only when selected. Hosting providers have their own access and request-logging policies. See [Security](SECURITY.md) for handling untrusted files and reporting a problem.

## Quality and reproducibility

The current suite contains **70 tests**, including actual PDF extraction/rendering, hidden-text evidence, score accounting, Boolean syntax, interval unions, criteria duration, workflow restoration and stale-export rejection.

GitHub Actions runs a clean install, a high-severity dependency-advisory check, all tests, documentation checks and a production build on pushes and pull requests. [View the latest run →](https://github.com/Meet547/shortlist.com/actions/workflows/ci.yml)

```sh
npm run check:docs
npm test
npm run build
```

The repository includes the fictional PDF/DOCX/TXT fixtures, their generators, a dependency lockfile and captured UI evidence. Python is optional and only needed to regenerate document fixtures. [Fixture instructions →](docs/DEVELOPMENT.md#regenerate-fixtures)

[QA notes](QA.md) distinguish automated assertions, browser observations and verification limits. In particular, native download handoff in an embedded browser may need to be completed in a regular browser.

## Repository map

```text
src/                 React interface, parsers, scoring, search and state
public/samples/      Fictional normal, layout-trap and integrity fixtures
tests/               Engine, integrity, workflow and export regression tests
scripts/             Fixture generation and documentation checks
docs/                Architecture, development, deployment, sources and previews
.github/             Automated checks, issue forms and pull-request guidance
```

Start with [src/main.jsx](src/main.jsx) for the UI, [src/engine.js](src/engine.js) for analysis, or [src/security.js](src/security.js) for integrity rules. Everything needed to run the application is in this repository. Installed dependencies and generated builds are recreated from the lockfile; private hosting identifiers and personal documents are excluded.

## Boundaries worth knowing

- PDF input needs selectable text. OCR, reliable recovery of outlined glyphs and exhaustive reconstruction of visual tables are not included.
- DOCX is inspected as OOXML; it is not rendered like Microsoft Word. Plain text and DOCX geometry remain provisional.
- Input is limited to 15 MB, PDFs to 30 pages, extracted text to 250,000 characters, and DOCX expansion to 50 MB.
- The curated engineering taxonomy has coverage gaps and possible alias ambiguity. Unusual prose, negation and nuanced criteria may need human review.
- Contact and eligibility defaults are India-focused. Adjust scenario settings to the actual role and use truthful answers.
- Portfolio links are recognized but their destinations are not visited or verified. Candidate JSON uses app-owned `ENG:` taxonomy identifiers and is not certified against a commercial HR schema.

## Contribute

Useful contributions include broader domain coverage, better parser evidence, internationalized contact handling, accessibility improvements and regression fixtures for real edge cases.

Read [CONTRIBUTING.md](CONTRIBUTING.md), [development instructions](docs/DEVELOPMENT.md) and the [security policy](SECURITY.md). Use fictional or thoroughly anonymized documents in issues and pull requests.

Ideas still to explore: OCR, more disciplines, broader localization, stronger document rendering and empirical vendor comparisons using authorized benchmark data. These are directions for contribution, not shipped features.

Built by [Meet Pardeshi](https://github.com/Meet547). Licensed under [MIT](LICENSE). Third-party packages retain their own licenses; see [acknowledgments](docs/ACKNOWLEDGMENTS.md).

[↑ Back to the top](#shortlist)
