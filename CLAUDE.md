@AGENTS.md

## Git

When a step is finished and type checks (`npx tsc --noEmit`) and lint (`pnpm lint`) pass, don't ask: commit on a branch, merge it into `main`, push `main`, and delete the branch.

- Still ask before anything destructive: force-pushing, rewriting pushed history, `reset --hard`, deleting files or a branch with unmerged work, discarding uncommitted changes.
- Never commit `.claude/skills/`. It's a paid course and must not be published; it's in `.gitignore`, so never force-add it.
