#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"
VISUAL_CHECK_JS="$SCRIPT_DIR/visual_check.js"
DOCTOR_JS="$SCRIPT_DIR/doctor.js"
SCRIPT_NAME="$(basename "$0")"

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

slugify() {
  local raw="${1:-artifact}"
  local slug
  slug="$(printf '%s' "$raw" | tr '/:[:space:]' '-' | tr -cd '[:alnum:]_.-')"
  slug="$(printf '%s' "$slug" | sed -E 's/-+/-/g; s/^-+//; s/-+$//')"
  if [[ -z "$slug" ]]; then
    slug="artifact"
  fi
  printf '%s\n' "$slug"
}

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

has_flag() {
  local target="$1"
  shift
  local token
  for token in "$@"; do
    if [[ "$token" == "$target" ]]; then
      return 0
    fi
  done
  return 1
}

default_artifact_dir() {
  local project_path="$1"
  local mode="${2:-shot}"
  local route="${3:-home}"
  local suffix
  suffix="$(timestamp)-$(slugify "$mode")-$(slugify "$route")-$$"
  if [[ -d "$project_path" ]]; then
    echo "$(cd "$project_path" && pwd)/output/wechat-devtools-automator/$suffix"
  else
    echo "$(pwd)/output/wechat-devtools-automator/$suffix"
  fi
}

usage() {
  cat <<EOF
Usage:
  $SCRIPT_NAME <command> [args...]

Commands:
  doctor         Run environment preflight checks
  routes         List routes discovered from app.json
  shot           Open a route and capture page screenshot
  scroll-shot    Capture multiple screenshots while scrolling
  gui-shot       Capture page screenshot and DevTools GUI screenshot
  open           Open a route, capture once, keep DevTools open
  click-shot     Alias of shot; typically used with --tap / --action
  raw            Pass all arguments directly to visual_check.js
  help           Show this help

Examples:
  $SCRIPT_NAME doctor --project "$(pwd)"
  $SCRIPT_NAME routes --project "$(pwd)"
  $SCRIPT_NAME shot --project "$(pwd)" --route pages/index/index
  $SCRIPT_NAME shot --project "$(pwd)" --route pages/store/index --tap ".coupon-card"
  $SCRIPT_NAME scroll-shot --project "$(pwd)" --route pages/list/index
  $SCRIPT_NAME gui-shot --project "$(pwd)" --route pages/home/index
EOF
}

run_routes() {
  local args=("$@")
  if ! has_flag "--project" "${args[@]}"; then
    args=(--project "$(pwd)" "${args[@]}")
  fi
  exec "$NODE_BIN" "$VISUAL_CHECK_JS" --list-pages "${args[@]}"
}

run_route_mode() {
  local mode="$1"
  shift
  local passthrough=("$@")
  local route=""
  local project="$(pwd)"
  local has_project=0
  local has_output=0
  local has_gui_output=0
  local has_scroll_options=0

  local index=0
  while (( index < ${#passthrough[@]} )); do
    local token="${passthrough[$index]}"
    case "$token" in
      --project)
        (( index + 1 < ${#passthrough[@]} )) || die "--project requires a value"
        project="${passthrough[$((index + 1))]}"
        has_project=1
        index=$((index + 2))
        ;;
      --route)
        (( index + 1 < ${#passthrough[@]} )) || die "--route requires a value"
        route="${passthrough[$((index + 1))]}"
        index=$((index + 2))
        ;;
      --output)
        has_output=1
        index=$((index + 2))
        ;;
      --gui-output)
        has_gui_output=1
        index=$((index + 2))
        ;;
      --scroll-y|--scroll-step|--scroll-captures|--scroll-target|--scroll-selector|--scroll-debug)
        has_scroll_options=1
        if [[ "$token" == "--scroll-debug" ]]; then
          index=$((index + 1))
        else
          index=$((index + 2))
        fi
        ;;
      *)
        index=$((index + 1))
        ;;
    esac
  done

  [[ -n "$route" ]] || die "`$mode` requires --route <route-or-alias>"

  local output_dir
  output_dir="$(default_artifact_dir "$project" "$mode" "$route")"
  local extra=()
  if [[ "$has_output" -eq 0 ]]; then
    extra+=(--output "$output_dir/page.png")
  fi

  if [[ "$mode" == "scroll-shot" && "$has_scroll_options" -eq 0 ]]; then
    extra+=(--scroll-step 900 --scroll-captures 3)
  fi

  if [[ "$mode" == "gui-shot" ]]; then
    if ! has_flag "--gui" "${passthrough[@]}"; then
      extra+=(--gui)
    fi
    if [[ "$has_gui_output" -eq 0 ]]; then
      extra+=(--gui-output "$output_dir/gui.png")
    fi
  fi

  if [[ "$mode" == "open" ]]; then
    if ! has_flag "--keep-open" "${passthrough[@]}"; then
      extra+=(--keep-open)
    fi
  fi

  if [[ "$has_project" -eq 0 ]]; then
    extra=(--project "$(pwd)" "${extra[@]}")
  fi

  exec "$NODE_BIN" "$VISUAL_CHECK_JS" "${passthrough[@]}" "${extra[@]}"
}

main() {
  if [[ $# -lt 1 ]]; then
    usage
    exit 1
  fi

  local command="$1"
  shift

  case "$command" in
    doctor)
      exec "$NODE_BIN" "$DOCTOR_JS" "$@"
      ;;
    routes)
      run_routes "$@"
      ;;
    shot|scroll-shot|gui-shot|open|click-shot)
      if [[ "$command" == "click-shot" ]]; then
        command="shot"
      fi
      run_route_mode "$command" "$@"
      ;;
    raw)
      exec "$NODE_BIN" "$VISUAL_CHECK_JS" "$@"
      ;;
    help|-h|--help)
      usage
      ;;
    *)
      die "Unknown command: $command (run: $SCRIPT_NAME help)"
      ;;
  esac
}

main "$@"
