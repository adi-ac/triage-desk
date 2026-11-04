@AGENTS.md

## UI

Before building any UI, read `DESIGN.md` and `docs/brief.md`.

## Worktrees

A fresh worktree has no `node_modules` and no generated route types. Run `pnpm install` and `npx next typegen` before `npx tsc --noEmit`, or `app/layout.tsx` fails on `LayoutProps`.

## Git

When a step is finished and type checks (`npx tsc --noEmit`) and lint (`pnpm lint`) pass, don't ask: commit on a branch, merge it into `main`, push `main`, and delete the branch.

- Still ask before anything destructive: force-pushing, rewriting pushed history, `reset --hard`, deleting files or a branch with unmerged work, discarding uncommitted changes.
- Never commit `.claude/skills/`. It's a paid course and must not be published; it's in `.gitignore`, so never force-add it.
