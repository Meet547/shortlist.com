# Development

## Requirements

Use Node.js 24 (`.nvmrc`) and npm. The declared minimum is Node 22.13; Node 24 is the documented and CI target. Python 3 and ReportLab are optional fixture-generation tools.

```sh
npm ci
npm run dev
```

Use the URL printed by Vite. The dev server binds to `127.0.0.1`. If its default port is occupied, use the alternate printed address or `npm run dev -- --port 5174`.

## Commands

- `npm run dev` — local development and hot reload.
- `npm test` — all 70 Node regression tests, including real PDF rendering.
- `npm run check:docs` — validate repository Markdown paths, images and local heading links.
- `npm run build` — compile the static production application into `dist/`.
- `npm run preview` — serve the built application locally.
- `npm run fixtures` — regenerate the fictional document fixtures; requires the Python environment below.

`@napi-rs/canvas` is an explicit development dependency because integrity tests render PDFs. Do not install with optional packages omitted: the native canvas package needs the binary for the running platform. No paid service or API key is required.

## Regenerate fixtures

The checked-in samples are sufficient to run the app and tests. Regeneration is optional and can change PDF metadata/binary hashes even if visible content is unchanged.

Create a Python virtual environment and install the pinned generator dependency:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
npm run fixtures
npm test
```

On Windows, activate with `.venv\Scripts\Activate.ps1` in PowerShell instead. The generator's default input comes directly from `src/data.js` via `scripts/export_fixture_data.mjs`; it needs no machine-specific temporary file. To use custom fictional JSON input:

```sh
python scripts/generate_fixtures.py --input path/to/fictional-samples.json
```

Each domain key maps to an object containing `strong` and `weak` resume text. `scripts/generate_integrity_fixtures.py` creates the inert hidden-text/prompt-pattern fixtures. It uses Python's ZIP tools for DOCX, not python-docx.

## Manual UI verification

Use fictional input. Check a structured and two-column PDF, then inspect the parser boxes and raw stream. Exercise a confirmed application pass/fail, draft edits, the Applied tick, stale export blocking, re-analysis, reset/Undo and reload recovery.

For integrity changes, load the test PDF and DOCX and verify hidden runs, prompt evidence, white-font warnings, the legitimate script joiner and omitted header text. Check a 390 px mobile viewport and a desktop viewport for overflow. Navigate tabs with arrow keys, Home and End; activate page boxes with Enter/Space. Check reduced-motion behavior for animation changes.

## Troubleshooting

**Unsupported Node version:** switch to the version in `.nvmrc`, remove the old installation using your normal package-manager workflow and run `npm ci` again.

**Native canvas cannot load:** install dependencies on the machine/container that runs the tests; avoid copying `node_modules` between operating systems. Keep optional dependencies enabled.

**PDF contains no extracted text:** a scanned image or outlined glyphs may need OCR in another tool. Shortlist does not invent text from pixels.

**Word content is missing:** inspect the omitted header/footer regions and the original source document. Word visual layout is not reproduced.

**A download is acknowledged but no file appears:** inspect browser downloads and permissions, or open the app in a regular browser. Export payload tests do not guarantee every embedded browser's native file handoff.

**A draft is out of date:** select Update review. Re-upload the final PDF if you need to verify revised page geometry.
