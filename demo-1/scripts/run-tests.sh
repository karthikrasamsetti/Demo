#!/bin/sh
# Managed by PerfAgent - regenerated on every export, edit environments/ instead.
#
# Usage:  sh scripts/run-tests.sh [test-name|all] [environment]
#   sh scripts/run-tests.sh all dev
#   sh scripts/run-tests.sh checkout-peak uat
#
# Exit code: 0 = every test passed its thresholds, 1 = a test failed or errored,
# 2 = bad arguments. CI uses this exit code to pass or fail the build.
set -u
cd "$(dirname "$0")/.." || exit 2

TEST="${1:-all}"
ENVIRONMENT="${2:-dev}"
case "$TEST$ENVIRONMENT" in */*|*..*|*\\*) echo "Invalid test or environment name" >&2; exit 2 ;; esac

ENV_FILE="environments/${ENVIRONMENT}.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 2
fi

# Load KEY=VALUE lines. Values already set (e.g. CI secrets) are not overridden.
while IFS= read -r line || [ -n "$line" ]; do
  line=$(printf '%s' "$line" | tr -d '\r')
  case "$line" in ''|'#'*) continue ;; esac
  key=${line%%=*}
  value=${line#*=}
  case "$key" in ''|[0-9]*|*[!A-Za-z0-9_]*) echo "Skipping invalid line in $ENV_FILE" >&2; continue ;; esac
  eval "current=\${$key:-}"
  if [ -z "$current" ]; then export "$key=$value"; fi
done < "$ENV_FILE"

command -v k6 >/dev/null 2>&1 || { echo "k6 is not on PATH" >&2; exit 2; }
mkdir -p results

if [ "$TEST" = "all" ]; then
  TESTS=$(ls tests)
else
  TESTS=$TEST
fi

status=0
for t in $TESTS; do
  if [ ! -f "tests/$t/loadtest.js" ]; then
    echo "No such test: $t" >&2
    status=1
    continue
  fi
  echo "=== $t (environment: $ENVIRONMENT) ==="
  k6 run --summary-export "results/$t-summary.json" "tests/$t/loadtest.js"
  rc=$?
  case $rc in
    0)  echo "PASS   $t" ;;
    99) echo "FAIL   $t - thresholds breached"; status=1 ;;
    *)  echo "ERROR  $t - k6 exited with code $rc"; status=1 ;;
  esac
done
exit $status
