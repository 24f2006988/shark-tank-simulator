#!/bin/sh
# Blocks commits/pushes that would take the GitHub repo past the hackathon's 10 MB limit.
# Fails at 8 MB total (safety margin) or on any single staged file over 1 MB.
LIMIT_KB=8192
FILE_LIMIT_KB=1024
fail=0

# Single large files staged for commit
big=$(git -c core.quotepath=off diff --cached --name-only --diff-filter=AM 2>/dev/null | while IFS= read -r f; do
  [ -f "$f" ] || continue
  kb=$(( $(wc -c < "$f") / 1024 ))
  [ "$kb" -gt "$FILE_LIMIT_KB" ] && echo "BLOCKED: $f is ${kb} KB (max ${FILE_LIMIT_KB} KB per file)."
done)
if [ -n "$big" ]; then echo "$big"; fail=1; fi

# Size of every file in the index (tracked + staged)
tracked_kb=$(( $(git -c core.quotepath=off ls-files 2>/dev/null | while IFS= read -r f; do
  [ -f "$f" ] && wc -c < "$f"
done | awk '{s+=$1} END {print s+0}') / 1024 ))

# Git history size (what GitHub actually stores)
git gc --quiet --auto 2>/dev/null
history_kb=$(git count-objects -v 2>/dev/null | awk '/^size:|^size-pack:/ {s+=$2} END {print s+0}')

echo "Repo size check: tracked files ${tracked_kb} KB, git history ${history_kb} KB (limit ${LIMIT_KB} KB, hard cap 10240 KB)."
if [ "$tracked_kb" -gt "$LIMIT_KB" ] || [ "$history_kb" -gt "$LIMIT_KB" ]; then
  echo "BLOCKED: repo is over the 8 MB working limit. Remove large files (and purge them from history) before committing."
  fail=1
fi
exit $fail
