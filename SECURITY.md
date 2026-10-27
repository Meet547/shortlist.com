# Security policy

Shortlist parses untrusted resume files in the browser. The AI Detector is an evidence-oriented integrity audit; it is not antivirus, exhaustive prompt-injection protection or an authorship certification service.

## Report a sensitive problem

If GitHub shows **Security → Report a vulnerability** for this repository, use that private channel. Availability depends on repository settings. If it is unavailable, open a minimal issue asking the maintainer to arrange private contact. Do not post exploit instructions, private candidate files, credentials or personal information publicly.

A useful report states the affected commit, browser, input format, observed behavior and expected result. Use fictional input where possible. There is no guaranteed response time or bug-bounty program.

## Scope and safeguards

- Parsing and scoring code make no remote resume/AI/ATS requests.
- The lockfile pins PDF.js 6.2.108, the patched release for [GHSA-hq66-cqwq-w95j](https://github.com/advisories/GHSA-hq66-cqwq-w95j). Detected document actions, encoded instructions and suspicious links are treated as data.
- Uploaded file size is bounded; PDF page/text and DOCX expansion limits are enforced.
- Confirmed mapped hidden runs and supported evaluator instructions are excluded from local scoring while raw evidence is preserved.
- Candidate state uses tab session storage. It is not encrypted storage and can be exposed to browser extensions, shared-device users or a compromised origin.
- A static host should use HTTPS, current dependencies and appropriate HTTP security headers. See [deployment](docs/DEPLOYMENT.md).

Only the current `main` branch is maintained. Package vulnerabilities and newly discovered file-format behaviors may require updates. A passing test suite does not certify arbitrary documents safe to open.
