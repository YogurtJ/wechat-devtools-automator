#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
DEFAULT_EVAL_SET="$SKILL_DIR/evals/trigger_evals.json"

SOURCE_CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
SOURCE_CODEX_HOME_INPUT="$SOURCE_CODEX_HOME"
EVAL_SET="$DEFAULT_EVAL_SET"
DESCRIPTION_OVERRIDE=""
KEEP_ISOLATED_HOME=0
PASSTHROUGH_ARGS=()

usage() {
  cat <<'EOF'
Usage:
  run_isolated_trigger_eval.sh [options] [-- <extra run_eval.py args>]

Options:
  --description <text>      Override SKILL.md description for this eval run
  --eval-set <path>         Eval set JSON path (default: ./evals/trigger_evals.json)
  --source-codex-home <dir> Source CODEX_HOME to copy auth/config from
  --keep-home               Keep temporary isolated CODEX_HOME for debugging
  -h, --help                Show this help

Examples:
  ./scripts/run_isolated_trigger_eval.sh
  ./scripts/run_isolated_trigger_eval.sh --description "Use when ..."
  ./scripts/run_isolated_trigger_eval.sh --eval-set ./evals/trigger_evals.json -- --num-workers 4 --runs-per-query 1 --verbose
EOF
}

resolve_existing_path() {
  local input="$1"
  if [[ "$input" = /* ]]; then
    [[ -e "$input" ]] || return 1
    printf '%s\n' "$input"
    return 0
  fi

  if [[ -e "$input" ]]; then
    (cd -- "$(dirname -- "$input")" && printf '%s/%s\n' "$(pwd)" "$(basename -- "$input")")
    return 0
  fi

  if [[ -e "$SKILL_DIR/$input" ]]; then
    (cd -- "$(dirname -- "$SKILL_DIR/$input")" && printf '%s/%s\n' "$(pwd)" "$(basename -- "$input")")
    return 0
  fi

  return 1
}

find_run_eval() {
  local source_home="$1"
  local candidates=(
    "$source_home/skills/skill-creator/scripts/run_eval.py"
    "$HOME/.cc-switch/skills/skill-creator/scripts/run_eval.py"
    "$HOME/.codex/skills/skill-creator/scripts/run_eval.py"
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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --description)
      [[ $# -ge 2 ]] || { printf 'Error: --description requires a value.\n' >&2; exit 1; }
      DESCRIPTION_OVERRIDE="$2"
      shift 2
      ;;
    --eval-set)
      [[ $# -ge 2 ]] || { printf 'Error: --eval-set requires a value.\n' >&2; exit 1; }
      EVAL_SET="$2"
      shift 2
      ;;
    --source-codex-home)
      [[ $# -ge 2 ]] || { printf 'Error: --source-codex-home requires a value.\n' >&2; exit 1; }
      SOURCE_CODEX_HOME="$2"
      SOURCE_CODEX_HOME_INPUT="$2"
      shift 2
      ;;
    --keep-home)
      KEEP_ISOLATED_HOME=1
      shift
      ;;
    --)
      shift
      PASSTHROUGH_ARGS+=("$@")
      break
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      PASSTHROUGH_ARGS+=("$1")
      shift
      ;;
  esac
done

SOURCE_CODEX_HOME="$(cd -- "$SOURCE_CODEX_HOME" 2>/dev/null && pwd || true)"
if [[ -z "$SOURCE_CODEX_HOME" ]]; then
  printf 'Error: source CODEX_HOME does not exist: %s\n' "$SOURCE_CODEX_HOME_INPUT" >&2
  exit 1
fi

if ! EVAL_SET="$(resolve_existing_path "$EVAL_SET")"; then
  printf 'Error: eval set file not found: %s\n' "$EVAL_SET" >&2
  exit 1
fi

AUTH_FILE="$SOURCE_CODEX_HOME/auth.json"
CONFIG_FILE="$SOURCE_CODEX_HOME/config.toml"
missing=()
[[ -f "$AUTH_FILE" ]] || missing+=("$AUTH_FILE")
[[ -f "$CONFIG_FILE" ]] || missing+=("$CONFIG_FILE")
if [[ ${#missing[@]} -gt 0 ]]; then
  printf 'Error: missing required Codex auth/config file(s):\n' >&2
  local_path=""
  for local_path in "${missing[@]}"; do
    printf '  - %s\n' "$local_path" >&2
  done
  printf 'Please make sure both auth.json and config.toml exist in SOURCE CODEX_HOME before running eval.\n' >&2
  printf 'Tip: use --source-codex-home <dir> if your active profile is elsewhere.\n' >&2
  exit 1
fi

RUN_EVAL_PY=""
if ! RUN_EVAL_PY="$(find_run_eval "$SOURCE_CODEX_HOME")"; then
  printf 'Error: could not find run_eval.py (skill-creator script).\n' >&2
  exit 1
fi

ISOLATED_CODEX_HOME="$(mktemp -d "${TMPDIR:-/tmp}/codex-home-isolated.XXXXXX")"
cleanup() {
  if [[ "$KEEP_ISOLATED_HOME" -eq 1 ]]; then
    printf 'Keeping isolated CODEX_HOME for debugging: %s\n' "$ISOLATED_CODEX_HOME" >&2
    return
  fi
  rm -rf "$ISOLATED_CODEX_HOME"
}
trap cleanup EXIT

install -m 600 "$AUTH_FILE" "$ISOLATED_CODEX_HOME/auth.json"
install -m 600 "$CONFIG_FILE" "$ISOLATED_CODEX_HOME/config.toml"

CMD=(python3 "$RUN_EVAL_PY" --skill-path "$SKILL_DIR" --eval-set "$EVAL_SET")
if [[ -n "$DESCRIPTION_OVERRIDE" ]]; then
  CMD+=(--description "$DESCRIPTION_OVERRIDE")
fi
if [[ ${#PASSTHROUGH_ARGS[@]} -gt 0 ]]; then
  CMD+=("${PASSTHROUGH_ARGS[@]}")
fi

printf 'Running isolated trigger eval\n'
printf '  source CODEX_HOME: %s\n' "$SOURCE_CODEX_HOME"
printf '  isolated CODEX_HOME: %s\n' "$ISOLATED_CODEX_HOME"
printf '  skill path: %s\n' "$SKILL_DIR"
printf '  eval set: %s\n' "$EVAL_SET"

CODEX_HOME="$ISOLATED_CODEX_HOME" "${CMD[@]}"
