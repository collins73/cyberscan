# GitHub Sync Skill

Checks for changes in local AutoDoctor AI project files and automatically commits/pushes to GitHub.

## Usage

```
run_skill github_sync autodoctor
```

## Behavior

- Checks git status for uncommitted changes
- If changes found: commits with timestamp, pushes to origin
- If no changes: logs that repo is up to date
- Uses AUTODOCTOR env var for GitHub auth token
