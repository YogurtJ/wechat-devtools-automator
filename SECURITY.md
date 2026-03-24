# Security Policy

## Scope

Please report:

- credential leaks in commands, screenshots, or `report.json`
- unsafe handling of query parameters, tokens, or local DevTools data
- bugs that can expose local project files or unintended console data

## Reporting

- Do not post active secrets or private tokens in a public issue.
- Prefer a private GitHub security advisory if the repository enables it.
- If advisories are unavailable, contact the repository owner privately through GitHub before publishing details.

## Reporter checklist

Before sending a report:

1. Revoke or rotate any exposed secret first.
2. Redact screenshots and `report.json`.
3. Include the exact command, platform, Node version, and WeChat DevTools version.
4. Include the smallest reproduction you can share safely.

## Response expectations

This is a beta project and no formal SLA is promised yet, but high-impact leaks and artifact-handling bugs should be prioritized ahead of feature work.
