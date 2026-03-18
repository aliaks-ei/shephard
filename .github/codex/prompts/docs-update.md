You are updating durable repository documentation for a GitHub pull request.

Follow the repository instructions from `AGENTS.md`. Read only the minimal set of files needed for the update.

Only edit these files:

- `AGENTS.md`
- `README.md`
- `agent_docs/*.md`

Do not edit source code, tests, workflows, or prompt files.

GitHub Actions provides these environment variables:

- `CODEX_DOC_PR_NUMBER`
- `CODEX_DOC_BASE_REF`
- `CODEX_DOC_DIFF_RANGE`
- `CODEX_DOC_UPDATE_REQUEST`

Task:

1. Inspect the pull request diff with:
   - `git diff --name-status --find-renames "$CODEX_DOC_DIFF_RANGE"`
   - `git diff --stat "$CODEX_DOC_DIFF_RANGE"`
2. Read only the relevant source files and the relevant existing docs.
3. Update only the documentation needed to keep durable guidance accurate.

Repo-specific expectations:

- Keep `AGENTS.md` compact and focused on repo-wide rules.
- Keep `agent_docs/*.md` focused and routed by topic instead of repeating the same guidance.
- Update `README.md` only for contributor-facing setup, commands, architecture summary, or externally visible app behavior.
- Prefer targeted edits over broad rewrites.
- Preserve the current voice and structure.

If `CODEX_DOC_UPDATE_REQUEST` is non-empty, treat it as a maintainer hint, but still verify it against the actual diff before editing.

If no documentation updates are necessary, make no file changes.

Your final response must be plain text. Keep it brief and summarize either:

- which docs you updated and why, or
- that no documentation changes were necessary
