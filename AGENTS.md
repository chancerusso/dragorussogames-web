# Drago Russo Games Working Agreement

These rules apply to every coding and deployment session in this repository.

## Before writing code

1. Read `docs/work-log/PROGRESS.md`.
2. Read the most recent dated file in `docs/work-log/`.
3. Read the relevant architecture, feature, and decision notes.
4. Run `git fetch origin --prune` and compare the current branch with its
   upstream branch.
5. Inspect `git status` and record pre-existing changes. Never overwrite or
   silently absorb unrelated work.
6. Create or update today's `docs/work-log/YYYY-MM-DD.md` entry before changing
   application code.
7. Record the objective, intended scope, baseline commit, branch, upstream
   state, pre-existing changes, and planned verification.

Update the daily log while work is happening. Record decisions, files changed,
tests, defects, commits, pushes, and next actions. Do not wait until the end and
attempt to reconstruct the session from memory.

## Before deploying

1. Read `docs/deployment.md` from the beginning.
2. Read `docs/deployment-inventory.md` and confirm that every live identity is
   still verified.
3. Read the most recent record in `docs/deployments/`.
4. Confirm the exact commit to deploy is pushed to the approved remote branch.
5. Confirm the local and server worktrees are clean and no private source PDF is
   present in a frontend build.
6. Complete the required tests, backup, migration review, health check, and
   smoke tests described by the deployment runbook.
7. Create a deployment record from `docs/deployments/TEMPLATE.md` and update it
   as the deployment proceeds.

A push is not a deployment. A build is not a deployment. Record repository and
production state separately. If the live server identity, active service,
source checkout, database, web root, or previous commit cannot be verified,
stop before deployment.

## Recordkeeping safety

- Never write passwords, tokens, cookies, private keys, database credentials,
  or secret environment values into logs.
- Record full commit SHAs for deployments.
- Record failed checks and rollbacks as carefully as successful work.
- Carry unfinished items forward explicitly.
- Private rulebook PDFs remain only in `private-reference/sources/` and must
  never enter a public build, web root, API response, commit, or deployment.
