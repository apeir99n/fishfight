# Agent Guidelines

## Workflows

### Version Control (Github)
This project uses **Github** for version control.
- **Initialize**: initialize git if not already 

### Task Management (Kanban)
Use `docs/KANBAN.md` to track tasks (create if not already).
- **Structure**:
  - `## Backlog`
  - `## In Progress`
  - `## Done`
- **Process**: Move tasks from Backlog to In Progress, then Done. Update the file at each step.

### Development Methodology (TDD)
Follow **Red-Green-Refactor** where possible.
1.  **Red**: Write a failing test for the new feature or bug fix.
2.  **Green**: Write the minimal code to make the test pass.
3.  **Refactor**: Improve the code while keeping tests passing.
4.  **Verify**: Run `cargo test` and `cargo check`.
