# Deployment

Shortlist builds to static assets. Any host capable of serving the contents of `dist/` can run it; no application server, database, model service or runtime secret is required.

## Build and preview

```sh
npm ci
npm run check:docs
npm test
npm run build
npm run preview
```

Publish the generated `dist/` directory using your host's normal static-site flow. Configure its build command as `npm run build`, output directory as `dist`, and Node version as 24. Keep the PDF.js worker and all emitted assets together. Serve over HTTP(S); opening `index.html` directly with `file://` is not supported.

## Hosting path

The app fetches sample files from `/samples/`, so the current build expects the root of an origin. For a project subpath such as `example.com/shortlist/`, update the Vite base and the sample-fetch paths before deployment, then test the resulting URLs and PDF worker. A root custom domain or root static deployment works with the current configuration. A GitHub repository alone does not publish a live website.

## Existing private Site

The maintainer's existing [hosted workspace](https://shortlist-engineering-lab.finetrout4096.chatgpt.site/) has restricted access. Its private Site identity/configuration is intentionally not distributed in this repository. The local runnable application and its assets are complete without it. Configure a new deployment with your own host/account; do not reuse somebody else's hosting identity.

This repository's CI verifies builds; it does not automatically publish or change any audience settings.

## Operational notes

Use HTTPS for clipboard APIs and normal browser security behavior. Apply suitable security headers through the host and test PDF workers, previews and downloads with those headers. Keep dependencies current and review browser/hosting access on shared devices.

Processing remains client-side, but your static host can still log asset requests according to its policy. Candidate data in session storage is not encrypted. [Privacy details](../README.md#privacy) and [security policy](../SECURITY.md) describe the relevant limits.
