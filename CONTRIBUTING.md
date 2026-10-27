# Contributing to Shortlist

Thank you for helping make resume review clearer and more inspectable. A focused fix with a reproducible example is a useful contribution.

## Start here

1. Read the [README](README.md) and [architecture](docs/ARCHITECTURE.md).
2. Use Node.js 24, run `npm ci`, then `npm run dev`.
3. Open an issue for a substantial change so its scope and verification are clear.
4. Create a branch, make the change, and open a pull request describing what the user will experience.

## Keep these product guarantees

- Preserve raw evidence and exact quote/source offsets. Show uncertainty when information cannot be established.
- Keep the working draft separate from the analyzed inputs. Changed inputs must invalidate exports.
- Describe vendor behavior as documented concepts or explicit local assumptions. Do not invent vendor accuracy, formulas or certified equivalence.
- Keep AI authorship undetermined unless a future method has a defensible, reviewed validation basis. Invisible Unicode alone does not establish misconduct.
- Do not add network transmission of candidate data silently. Explain any proposed data flow and make the privacy implications reviewable.
- Do not generate experience, measurements or eligibility answers a candidate has not supplied.

## Verify the change

```sh
npm run check:docs
npm test
npm run build
```

Add meaningful regression coverage for parser/scoring/state changes. For UI work, inspect the affected flow on desktop and mobile, test keyboard interaction and reduced motion where relevant, and include a screenshot. Use the smallest useful test fixture.

Keep larger work in batches of at most 10 logical changes with a test/build checkpoint after each batch. [QA.md](QA.md) records the current verification history.

## Use safe examples

Use fictional candidates and `example.com` addresses. Remove names, phone numbers, private URLs, metadata and other identifying details from real documents before sharing. Do not attach malicious executables or live attack payloads. The included integrity fixtures contain inert test strings and hidden formatting for inspection.

## Pull requests

Explain the problem, resulting behavior, validation and remaining limits. Keep unrelated refactors separate. Update documentation when a user-facing behavior or setup step changes. Contributions are made under the repository's [MIT license](LICENSE).
