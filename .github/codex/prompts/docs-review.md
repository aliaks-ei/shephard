You are reviewing a GitHub pull request for documentation drift in this repository.

Follow the repository instructions from `AGENTS.md`. Read only the minimal set of files needed for the decision.

Durable guidance in this repo lives in:

- `AGENTS.md`
- `README.md`
- `agent_docs/architecture.md`
- `agent_docs/implementation.md`
- `agent_docs/testing.md`
- `agent_docs/tooling.md`

GitHub Actions provides these environment variables:

- `CODEX_DOC_PR_NUMBER`
- `CODEX_DOC_BASE_REF`
- `CODEX_DOC_DIFF_RANGE`

Task:

1. Inspect the pull request diff with:
   - `git diff --name-status --find-renames "$CODEX_DOC_DIFF_RANGE"`
   - `git diff --stat "$CODEX_DOC_DIFF_RANGE"`
2. Read only the relevant source files and relevant existing docs.
3. Decide whether the PR leaves any durable guidance stale.

Decision rules:

- Use `no-doc-update` when the PR does not change durable contributor or agent guidance.
- Use `doc-update-recommended` when the change is worth documenting soon, but future work is unlikely to be misled without it.
- Use `doc-update-required` when merged code would leave `AGENTS.md`, `README.md`, or `agent_docs/*.md` materially inaccurate or incomplete.

Specific guidance for this repo:

- `AGENTS.md` is for repo-wide rules, commands, and durable review expectations.
- `README.md` is for contributor-facing setup, commands, feature summary, and high-level architecture.
- `agent_docs/architecture.md` covers repo map, routes, layouts, feature ownership, and dependency direction.
- `agent_docs/implementation.md` covers layer responsibilities, mutation/error patterns, permissions, and Vue/Quasar rules.
- `agent_docs/testing.md` covers Vitest, mocking, helpers, and coverage expectations.
- `agent_docs/tooling.md` covers commands, env vars, CI/build/runtime operations, Quasar/PWA/MSW/Supabase details, and deployment/tooling workflow.

Do not recommend doc changes for:

- local refactors that preserve the same rules
- styling-only tweaks
- transient implementation details
- test-only cleanup that does not change testing guidance

Return exactly one valid JSON object and nothing else. Do not use markdown fences.

Schema:

{
"decision": "no-doc-update | doc-update-recommended | doc-update-required",
"targets": ["repo-relative path"],
"reasoning": ["short sentence"],
"proposed_edits": ["short sentence"],
"confidence": 0.0
}

Rules for the JSON:

- `targets` must use exact repo-relative paths from the durable guidance list above.
- Keep `reasoning` to 1-5 concise items.
- Keep `proposed_edits` empty when `decision` is `no-doc-update`.
- Set `confidence` to a number between 0 and 1.
