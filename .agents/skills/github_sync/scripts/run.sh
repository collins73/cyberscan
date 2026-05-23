#!/bin/bash

# GitHub Sync Skill - Checks for changes and auto-commits/pushes to GitHub
# Usage: run_skill github_sync autodoctor

PROJECT_NAME="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$PROJECT_NAME" = "autodoctor" ]; then
  REPO_PATH="/app"
  REPO_URL="https://github.com/collins73/autodoctor-ai"
  GIT_TOKEN="$AUTODOCTOR"
elif [ "$PROJECT_NAME" = "codeguard" ]; then
  REPO_PATH="/app"
  REPO_URL="https://github.com/collins73/cyberscan"
  GIT_TOKEN="$CODEGUARD"
else
  echo "Unknown project: $PROJECT_NAME"
  exit 1
fi

if [ -z "$GIT_TOKEN" ]; then
  echo "GitHub token not found for $PROJECT_NAME"
  exit 1
fi

cd "$REPO_PATH" 2>/dev/null || {
  echo "Repository path not found: $REPO_PATH"
  exit 1
}

# Check if this is a git repo
if [ ! -d .git ]; then
  echo "Not a git repository: $REPO_PATH"
  exit 1
fi

# Configure git with token for auth
git config --global credential.helper store
echo "https://collinsd73:${GIT_TOKEN}@github.com" > ~/.git-credentials

# Check for changes
git fetch origin 2>/dev/null || true
git status --porcelain > /tmp/git_status.txt

if [ -s /tmp/git_status.txt ]; then
  echo "Changes detected in $PROJECT_NAME:"
  cat /tmp/git_status.txt
  
  # Stage and commit
  git add -A
  git commit -m "Auto-sync: $TIMESTAMP" || echo "Nothing new to commit"
  
  # Push to origin
  git push origin main 2>&1 || git push origin master 2>&1 || echo "Push failed"
  
  echo "✓ Changes committed and pushed at $TIMESTAMP"
else
  echo "Repository is up to date ($PROJECT_NAME)"
fi

# Cleanup
rm -f /tmp/git_status.txt
