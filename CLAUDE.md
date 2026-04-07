# Project Agent Instructions

## 🧪 TDD Superpower — MANDATORY WORKFLOW

Every code change MUST follow this exact cycle:

### Step 1: THINK (Plan)
- Read the task specification completely
- Identify the interfaces, edge cases, and acceptance criteria
- Write a brief plan as comments before coding

### Step 2: RED (Write Failing Tests First)
- Write test(s) that define the desired behavior
- Run the tests — they MUST fail
- If tests pass without implementation, your tests are wrong — rewrite them
- Commit: `git add -A && git commit -m "test: [RED] <description>"`

### Step 3: GREEN (Minimal Implementation)
- Write the MINIMUM code to make tests pass
- Do not add features not covered by tests
- Run tests — they MUST pass
- Commit: `git add -A && git commit -m "feat: [GREEN] <description>"`

### Step 4: REFACTOR (Clean Up)
- Improve code quality without changing behavior
- Run tests — they MUST still pass
- Commit: `git add -A && git commit -m "refactor: [REFACTOR] <description>"`

### Step 5: REPORT
- Write status to `.orchestra/status/<your-agent-id>.json`
- Write results summary to `.orchestra/results/<your-agent-id>.md`

## ⚠️ CRITICAL RULES
1. **NEVER skip tests.** No implementation without a failing test first.
2. **Run tests after every change.** If tests break, fix before continuing.
3. **Small commits.** Each RED/GREEN/REFACTOR is a separate commit.
4. **Update status.** Write to `.orchestra/status/` after each phase.
5. **Stay in scope.** Only work on your assigned task. Don't modify files owned by other agents.

## Status Reporting

After each TDD phase, update your status file:
```bash
cat > .orchestra/status/${AGENT_ID}.json << EOF
{
  "state": "testing",
  "task": "implement auth module",
  "progress": "60",
  "tdd_phase": "GREEN",
  "tests_passing": "3/3",
  "last_update": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "error": null
}
EOF
```

## File Ownership
Each agent works in designated directories only. Check your task file for scope.

## Testing Commands
- JavaScript/TypeScript: `npm test` or `npx vitest run`
- Python: `pytest -xvs`
- Go: `go test ./...`
- Rust: `cargo test`
