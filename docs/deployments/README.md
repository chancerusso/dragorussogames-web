# Drago Russo Games Deployment Records

Create one Markdown record after every staging or production deployment. Use an
ISO date, environment, and a short distinguishing suffix when needed:

```text
2026-07-22-staging.md
2026-07-22-production.md
2026-07-22-production-02.md
```

Start from `TEMPLATE.md`. Record the previous and deployed full commit SHAs,
branch, backup evidence, migration revision, build result, affected services,
health checks, smoke tests, operator/approver, and rollback result.

Never record credentials, tokens, cookies, private keys, secret environment
values, or database URLs containing credentials.
