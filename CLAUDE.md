# Claude Team Rules

## Purpose
This repository uses a multi-agent workflow.
The goal is to separate planning, review, design interpretation, execution, and verification.

## Mandatory workflow
1. `task-planner` creates `reports/task-plan.md` for medium or large tasks.
2. Review agents create their reports.
3. For UI tasks:
   - if official design exists, use `FIGMA_CONTEXT.md` and Figma as the source of truth
   - if no official design exists, produce UI direction first before coding
4. Stop and summarize the plan for the user.
5. Only `master-executor` may edit production code.
6. `test-checker` verifies changes.
7. Write `reports/execution-report.md`.

## Roles
- Codex is used for planning only.
- MiniMax is used for code review, execution, and verification.
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
- If context is missing, write it into a report instead of guessing.

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
Every report should be easy to scan and include:
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
- `master-executor` must not expand scope on its own.
- If a requested change likely affects multiple areas, mention the risk in the report first.
- After edits, always run verification appropriate to the workspace.

## Auto-routing — task classification and agent dispatch

When the user gives a task WITHOUT specifying which agents to use, classify the task automatically and follow the matching workflow. Use `tmux-bridge` to communicate with other agents if they are available in adjacent panes.

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

### Step 2: Execute the matching workflow

#### `QUICK_FIX`
Skip planning. Apply change directly → test-checker verify.

#### `BUG_BACKEND`
1. Send to **codex**: "Analyze this bug, identify root cause, list affected files, and create an execution plan."
2. Run **code-reviewer** locally on affected files.
3. Write reports → **STOP and show summary to user**.
4. After user confirms → **master-executor** fixes → **test-checker** verifies.

#### `BUG_UI`
1. Send to **codex**: "Analyze this UI bug and create a plan."
2. Send to **gemini**: "Review the UX of the affected screen. Read DESIGN.md."
3. If `FIGMA_CONTEXT.md` exists → read Figma MCP for design reference.
4. Write reports → **STOP and show summary to user**.
5. After user confirms → **master-executor** fixes → **test-checker** verifies.

#### `FEATURE`
1. Send to **codex**: "Break down this feature into steps, identify all affected files and risks."
2. Run **code-reviewer** on related existing code.
3. If feature has UI → send to **gemini** for UX review.
4. Write reports → **STOP and show summary to user**.
5. After user confirms → **master-executor** implements → **test-checker** verifies.

#### `UI_NEW_NO_DESIGN`
1. Send to **gemini**: "Write a UI brief for this screen. Read DESIGN.md for visual direction."
2. Run **design-finder** to create structured Stitch prompt.
3. Use **Stitch MCP** to generate 2-4 UI directions.
4. **STOP and present options to user**.
5. After user picks a direction → update DESIGN.md → **master-executor** codes → **test-checker** verifies.

#### `UI_NEW_WITH_DESIGN`
1. Read `FIGMA_CONTEXT.md` → use **Figma MCP** to fetch design data.
2. Run **design-finder** to create implementation notes from Figma.
3. Send to **gemini**: "Compare current code with Figma design, note differences."
4. Write reports → **STOP and show summary to user**.
5. After user confirms → **master-executor** codes to match Figma → **test-checker** verifies.

#### `REVIEW`
1. Run **code-reviewer** on specified files.
2. Send to **gemini**: "Review UX quality of specified screens."
3. Write reports → **present to user**. Do NOT edit any code.

#### `REFACTOR`
1. Send to **codex**: "Analyze refactoring scope, risks, and create a safe plan."
2. Run **code-reviewer** on current code.
3. Write reports → **STOP and show summary to user**.
4. After user confirms → **master-executor** refactors → **test-checker** verifies.

### Step 3: Always apply these rules
- **NEVER skip the confirmation step** (except QUICK_FIX).
- **ALWAYS check for tmux-bridge panes** before trying to message codex/gemini. If panes not available, run the agent role locally.
- **ALWAYS write reports** to `reports/` folder.
- **ALWAYS run test-checker** after any code change.
