#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
SKILL_DIR_BASENAME="$(basename "$SKILL_DIR")"
DIST_DIR="$SKILL_DIR/dist"
SKILL_NAME="$(node -p "try { require('${SKILL_DIR}/package.json').name || '${SKILL_DIR_BASENAME}' } catch { '${SKILL_DIR_BASENAME}' }")"
OUTPUT_SKILL="$DIST_DIR/${SKILL_NAME}.skill"
STAGING_ROOT=""
STAGING_SKILL_DIR=""
TEMP_OUTPUT_DIR=""

cleanup() {
  [[ -n "$STAGING_ROOT" && -d "$STAGING_ROOT" ]] && rm -rf "$STAGING_ROOT"
  [[ -n "$TEMP_OUTPUT_DIR" && -d "$TEMP_OUTPUT_DIR" ]] && rm -rf "$TEMP_OUTPUT_DIR"
}

trap cleanup EXIT

find_packager() {
  local candidates=(
    "${CODEX_HOME:-$HOME/.codex}/skills/skill-creator/scripts/package_skill.py"
    "$HOME/.cc-switch/skills/skill-creator/scripts/package_skill.py"
    "$HOME/.codex/skills/skill-creator/scripts/package_skill.py"
  )
  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

prepare_staging_copy() {
  STAGING_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/${SKILL_NAME}.staging.XXXXXX")"
  STAGING_SKILL_DIR="$STAGING_ROOT/$SKILL_DIR_BASENAME"
  mkdir -p "$STAGING_SKILL_DIR"

  rsync -a \
    --exclude '.git/' \
    --exclude 'dist/' \
    --exclude 'node_modules/' \
    --exclude '__pycache__/' \
    --exclude '.DS_Store' \
    --exclude 'evals/sweeps/' \
    --exclude 'task_plan.md' \
    --exclude 'findings.md' \
    --exclude 'progress.md' \
    "$SKILL_DIR/" "$STAGING_SKILL_DIR/"
}

verify_packaged_skill() {
  local packaged_skill="$1"
  if unzip -Z1 "$packaged_skill" | grep -q "^${SKILL_DIR_BASENAME}/dist/"; then
    printf 'Error: packaged artifact still contains %s/dist entries.\n' "$SKILL_DIR_BASENAME" >&2
    exit 1
  fi
  if unzip -Z1 "$packaged_skill" | grep -q "^${SKILL_DIR_BASENAME}/.git/"; then
    printf 'Error: packaged artifact still contains %s/.git entries.\n' "$SKILL_DIR_BASENAME" >&2
    exit 1
  fi
}

main() {
  mkdir -p "$DIST_DIR"
  rm -f "$OUTPUT_SKILL"
  prepare_staging_copy
  TEMP_OUTPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${SKILL_NAME}.pkg.XXXXXX")"

  local packager
  if ! packager="$(find_packager)"; then
    printf 'Error: could not find skill packager script (package_skill.py).\n' >&2
    exit 1
  fi

  printf 'Using packager: %s\n' "$packager"
  if ! python3 "$packager" "$STAGING_SKILL_DIR" "$TEMP_OUTPUT_DIR"; then
    printf 'Packager validation failed, falling back to direct zip packaging.\n' >&2
    command -v zip >/dev/null 2>&1 || {
      printf 'Error: zip command is not available for fallback packaging.\n' >&2
      exit 1
    }
    (
      cd "$STAGING_ROOT"
      zip -qr "$TEMP_OUTPUT_DIR/${SKILL_NAME}.skill" "$SKILL_DIR_BASENAME" \
        -x "$SKILL_DIR_BASENAME/.git/*" \
        -x "$SKILL_DIR_BASENAME/node_modules/*" \
        -x "$SKILL_DIR_BASENAME/**/node_modules/*" \
        -x "$SKILL_DIR_BASENAME/**/__pycache__/*" \
        -x "$SKILL_DIR_BASENAME/.DS_Store" \
        -x "$SKILL_DIR_BASENAME/evals/sweeps/*" \
        -x "$SKILL_DIR_BASENAME/dist/*" \
        -x "$SKILL_DIR_BASENAME/task_plan.md" \
        -x "$SKILL_DIR_BASENAME/findings.md" \
        -x "$SKILL_DIR_BASENAME/progress.md"
    )
  fi

  local generated="$TEMP_OUTPUT_DIR/${SKILL_NAME}.skill"
  if [[ ! -f "$generated" ]]; then
    local legacy_generated="$TEMP_OUTPUT_DIR/${SKILL_DIR_BASENAME}.skill"
    if [[ -f "$legacy_generated" ]]; then
      generated="$legacy_generated"
    else
      printf 'Error: packager did not generate expected file: %s\n' "$generated" >&2
      exit 1
    fi
  fi

  verify_packaged_skill "$generated"

  if [[ "$generated" != "$OUTPUT_SKILL" ]]; then
    mv -f "$generated" "$OUTPUT_SKILL"
  fi

  printf 'PACKAGED_SKILL %s\n' "$OUTPUT_SKILL"
}

main "$@"
