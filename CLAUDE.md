# Claude Team Rules

## Purpose
This repository uses a multi-agent workflow.
The goal is to separate planning, review, design interpretation, execution, and verification.

## Mandatory workflow
1. `gsd-planner` creates `.planning/phases/[task-slug]/02-PLAN.md` for medium or large tasks. If options need discussion, write to `01-DISCUSSION-LOG.md` first.
2. Review agents create their audit logs inside the same folder (e.g. `05-CODE-REVIEW.md` or `05-UX-REVIEW.md`).
3. For UI tasks:
   - if official design exists, use `FIGMA_CONTEXT.md` and Figma as the source of truth.
   - if no official design exists, use `gsd-ui-researcher` to produce UI direction first before coding.
4. Stop and summarize the plan for the user.
5. `gsd-executor` edits production code and writes `03-IMPLEMENTATION.md`.
6. `gsd-verifier` verifies changes and writes `04-VERIFICATION.md`.

## Roles
- Codex is used for planning and adversarial review natively.
- MiniMax is used for execution and verification.
- Gemini is used for UX critique and design reasoning.
- Figma is the official design source when available.
- Stitch is only for UI exploration when there is no official design.

## Priority order
1. Critical bug
2. Security issue
3. Broken UX on main flow
4. Reliability / maintainability problem
5. Minor cleanup

## Editing rules
- Make the smallest safe change.
- Do not refactor broadly unless explicitly requested.
- Do not rename public routes or public APIs unless clearly justified.
- Do not change business rules silently.
- If context is missing, write it into a GSD log instead of guessing.

## Monorepo awareness
This is a monorepo with 3 workspaces:
- `backend/` — NestJS + Prisma + Supabase (PostgreSQL)
- `web/` — Next.js 16 + TailwindCSS v4 + React Query
- `mobile/` — Expo 55 + React Native + BLE RFID scanning

When editing, always confirm which workspace is affected. Do not mix changes across workspaces without stating it clearly.

## Real-time awareness (Socket.IO)
This project uses Socket.IO for real-time updates:
- Rooms: `scan:live` (all auth users), `admin:dashboard` (ADMIN only)
- Events: `tagsUpdated`, `liveScan`, `scanDetected`, `inventoryUpdate`, `sessionCreated`, `orderUpdate`, `transferUpdate`
- Mobile app is REST-only, no Socket.IO
- When editing real-time logic, maintain room security (never put sensitive data in `scan:live`)

## Reporting rules
Every GSD log should be easy to scan and include:
- Summary
- Critical or major issues
- Warnings
- Suggestions
- Files checked or changed

## UI rules
- If Figma design exists, do not redesign the screen from scratch.
- If no official design exists, create direction first, confirm it, then implement.
- Use `DESIGN.md` as the UI/UX baseline.
- Web dashboard uses Bento Grid design system with dark theme.

## Execution safety
- `gsd-executor` must not expand scope on its own.
- If a requested change likely affects multiple areas, mention the risk in the plan first.
- After edits, always run verification appropriate to the workspace.

## Auto-routing — task classification and Agent Teams dispatch

When the user gives a task WITHOUT specifying which agents to use, classify the task automatically and spawn the appropriate Agent Team. Codex Review Gate runs as an in-process plugin and will automatically validate all code output. All agent outputs MUST go to `.planning/phases/[task-slug]/`.

### Step 1: Classify the task

| Signal in user request | Task type |
|------------------------|-----------|
| "fix bug", "error", "crash", "broken", "failing" | `BUG_BACKEND` |
| "UI bug", "layout broken", "style issue", "visual" | `BUG_UI` |
| "add feature", "implement", "create endpoint", "new API" | `FEATURE` |
| "new page", "new screen", "dashboard", "form", "modal" + NO Figma | `UI_NEW_NO_DESIGN` |
| "new page", "new screen" + Figma exists or user mentions design | `UI_NEW_WITH_DESIGN` |
| "review", "audit", "check quality" | `REVIEW` |
| "refactor", "cleanup", "improve" | `REFACTOR` |
| Small scope: "rename", "typo", "add comment", "change color" | `QUICK_FIX` |

### Step 2: Spawn the matching Agent Team

#### `QUICK_FIX`
Skip planning. Apply change directly → run `gsd-verifier` verify.

#### `BUG_BACKEND`
Spawn Agent Team with 3 subagents:
1. **Subagent Planner** (role: gsd-planner): "Analyze this bug, identify root cause. Write plan to `.planning/phases/[task-slug]/02-PLAN.md`."
2. **Subagent Reviewer** (role: code-reviewer): "Review affected files for logic errors and security. Write to `.planning/phases/[task-slug]/05-CODE-REVIEW.md`."
3. Wait for both → **STOP and show summary to user**.
4. After user confirms → **Subagent Executor** (role: gsd-executor): "Fix the bug following the plan. Write to `.planning/phases/[task-slug]/03-IMPLEMENTATION.md`." → **Subagent Tester** (role: gsd-verifier): "Verify changes. Write to `.planning/phases/[task-slug]/04-VERIFICATION.md`."

#### `BUG_UI`
Spawn Agent Team with 3 subagents:
1. **Subagent Planner** (role: gsd-planner): "Analyze this UI bug. Write plan to `02-PLAN.md`."
2. **Subagent UX** (role: gsd-ui-auditor): "Review the UX of the affected screen. Write to `05-UX-REVIEW.md`."
3. If `FIGMA_CONTEXT.md` exists → read Figma MCP for design reference.
4. Wait for both → **STOP and show summary to user**.
5. After user confirms → **Subagent Executor** fixes (`03-IMPLEMENTATION.md`) → **Subagent Tester** verifies (`04-VERIFICATION.md`).

#### `FEATURE`
Spawn Agent Team with 3 subagents:
1. **Subagent Planner** (role: gsd-planner): "Break down this feature into steps, identify all affected files. Write to `02-PLAN.md`."
2. **Subagent Reviewer** (role: code-reviewer): "Review related existing code. Write to `05-CODE-REVIEW.md`."
3. Wait for all → **STOP and show summary to user**.
4. After user confirms → **Subagent Executor** implements (`03-IMPLEMENTATION.md`) → **Subagent Tester** verifies (`04-VERIFICATION.md`).

#### `UI_NEW_NO_DESIGN`
1. **Subagent Designer** (role: gsd-ui-researcher): "Write a UI brief for this screen. Create structured Stitch prompt. Write to `.planning/phases/[task-slug]/01-UI-DIRECTION.md`."
2. Use **Stitch MCP** to generate 2-4 UI directions.
3. **STOP and present options to user**.
4. After user picks a direction → **Subagent Executor** codes (`03-IMPLEMENTATION.md`) → **Subagent Tester** verifies (`04-VERIFICATION.md`).

#### `REFACTOR`
Spawn Agent Team with 2 subagents:
1. **Subagent Planner** (role: gsd-planner): "Analyze refactoring scope, risks, and create a safe plan. Write to `02-PLAN.md`."
2. **Subagent Reviewer** (role: code-reviewer): "Review current code. Write to `05-CODE-REVIEW.md`."
3. Wait for both → **STOP and show summary to user**.
4. After user confirms → **Subagent Executor** refactors (`03-IMPLEMENTATION.md`) → **Subagent Tester** verifies (`04-VERIFICATION.md`).

### Step 3: Always apply these rules
- **MANDATORY CODING GUIDELINES**: Before writing any code, you MUST adhere strictly to the rules defined in `docs/DEV_CODING_GUIDELINES.md`. This is the single source of truth for architecture, naming conventions, and file boundaries across the `web`, `mobile`, and `backend` workspaces.
- **NEVER skip the confirmation step** (except QUICK_FIX).
- **ALWAYS spawn subagents using Agent Teams** for medium/large tasks.
- **MANDATORY CODEX AUDIT FOR AGENT TEAMS**: Because subagents spawned in `--teammate-mode tmux` bypass the Master's automatic Codex Review Gate hook, the **Master Agent MUST AUTOMATICALLY** use the available Codex MCP tools to audit all files modified by the subagents *immediately after they finish*. Do NOT wait for the user to ask for a Codex review.
- **GSD METHODOLOGY (NO REPORTS FOLDER)**: Do NOT use the `reports/` folder anymore. All planning, execution, and verification logs must go cleanly into `.planning/phases/[task-slug]/` using standard GSD prefixes (`01-DISCUSSION-LOG.md`, `02-PLAN.md`, `03-IMPLEMENTATION.md`, `04-VERIFICATION.md`, `05-CODE-REVIEW.md`, etc.). Always overwrite files unless you are appending chronological steps.
