#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
RUN_SINGLE="$SCRIPT_DIR/run_isolated_trigger_eval.sh"
DEFAULT_CANDIDATE_FILE="$SKILL_DIR/evals/description_candidates.md"
DEFAULT_OUTPUT_BASE="$SKILL_DIR/evals/sweeps"

CANDIDATE_FILE="$DEFAULT_CANDIDATE_FILE"
OUTPUT_DIR=""
SELECTED_IDS=""
EVAL_SET=""
SOURCE_CODEX_HOME=""
LIST_ONLY=0
DRY_RUN=0
PASSTHROUGH_ARGS=()

usage() {
  cat <<'EOF'
Usage:
  sweep_trigger_descriptions.sh [options] [-- <extra run_eval.py args>]

Options:
  --candidate-file <path>   Candidate markdown file (default: ./evals/description_candidates.md)
  --ids <id1,id2>           Only evaluate selected candidate ids
  --output-dir <path>       Output directory (default: ./evals/sweeps/<timestamp>)
  --eval-set <path>         Eval set JSON path passed to isolated runner
  --source-codex-home <dir> Source CODEX_HOME passed to isolated runner
  --list                    Print parsed candidates and exit
  --dry-run                 Print planned commands without executing
  -h, --help                Show this help

Candidate file format (one candidate per line):
  - `candidate_id`: description text...
  - `candidate_id` (optional label): description text...
  - use "@CURRENT" as description to evaluate current SKILL.md description

Examples:
  ./scripts/sweep_trigger_descriptions.sh --list
  ./scripts/sweep_trigger_descriptions.sh --ids baseline_v1,cn_real_page -- --runs-per-query 1 --num-workers 4
  ./scripts/sweep_trigger_descriptions.sh --eval-set ./evals/trigger_evals.json --source-codex-home ~/.codex
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

parse_candidates() {
  python3 - "$CANDIDATE_FILE" "$SELECTED_IDS" <<'PY'
import re
import sys
from pathlib import Path

candidate_file = Path(sys.argv[1])
selected_ids_raw = sys.argv[2].strip()
selected_ids = set()
if selected_ids_raw:
    selected_ids = {value.strip() for value in selected_ids_raw.split(",") if value.strip()}

pattern = re.compile(r"^\s*-\s*`([^`]+)`(?:\s*\(([^)]+)\))?\s*:\s*(.+?)\s*$")
rows = []
for line_no, line in enumerate(candidate_file.read_text(encoding="utf-8").splitlines(), start=1):
    match = pattern.match(line)
    if not match:
        continue
    candidate_id = match.group(1).strip()
    label = (match.group(2) or candidate_id).strip()
    description = match.group(3).strip()
    if selected_ids and candidate_id not in selected_ids:
        continue
    rows.append((line_no, candidate_id, label, description))

if selected_ids:
    parsed_ids = {item[1] for item in rows}
    missing = sorted(selected_ids - parsed_ids)
    if missing:
        print(f"ERROR\tmissing_ids\t{','.join(missing)}", file=sys.stderr)
        sys.exit(2)

if not rows:
    print("ERROR\tno_candidates\tNo candidate descriptions parsed from markdown.", file=sys.stderr)
    sys.exit(3)

for _, candidate_id, label, description in rows:
    print(f"{candidate_id}\t{label}\t{description}")
PY
}

extract_eval_json() {
  local log_file="$1"
  local output_json="$2"
  local candidate_id="$3"
  local candidate_label="$4"
  local candidate_description="$5"

  CANDIDATE_ID="$candidate_id" \
  CANDIDATE_LABEL="$candidate_label" \
  CANDIDATE_DESCRIPTION="$candidate_description" \
  python3 - "$log_file" "$output_json" <<'PY'
import json
import os
import sys
from pathlib import Path

log_path = Path(sys.argv[1])
json_path = Path(sys.argv[2])
text = log_path.read_text(encoding="utf-8")

decoder = json.JSONDecoder()
best = None

for index, char in enumerate(text):
    if char != "{":
        continue
    try:
        obj, end = decoder.raw_decode(text[index:])
    except json.JSONDecodeError:
        continue
    if isinstance(obj, dict) and "summary" in obj and "results" in obj:
        best = obj

if best is None:
    raise SystemExit(f"Failed to locate eval JSON in log: {log_path}")

summary = best.get("summary", {})
results = best.get("results", [])
false_negatives = sum(1 for item in results if item.get("should_trigger") and not item.get("pass"))
false_positives = sum(1 for item in results if not item.get("should_trigger") and not item.get("pass"))

enriched = {
    "candidate_id": os.environ["CANDIDATE_ID"],
    "candidate_label": os.environ["CANDIDATE_LABEL"],
    "candidate_description": os.environ["CANDIDATE_DESCRIPTION"],
    "summary": summary,
    "false_negatives": false_negatives,
    "false_positives": false_positives,
    "raw": best,
}

json_path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(enriched, ensure_ascii=False))
PY
}

write_aggregate_reports() {
  local jsonl_file="$1"
  local output_dir="$2"
  python3 - "$jsonl_file" "$output_dir" <<'PY'
import json
import sys
from pathlib import Path

jsonl_path = Path(sys.argv[1])
output_dir = Path(sys.argv[2])
rows = [json.loads(line) for line in jsonl_path.read_text(encoding="utf-8").splitlines() if line.strip()]

def sort_key(item):
    summary = item.get("summary", {})
    passed = int(summary.get("passed", 0))
    total = int(summary.get("total", 0))
    return (-passed, total, item.get("false_positives", 0), item.get("false_negatives", 0), item.get("candidate_id", ""))

rows_sorted = sorted(rows, key=sort_key)

summary_json = {
    "generated_at": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    "candidate_count": len(rows_sorted),
    "ranking": rows_sorted,
}
(output_dir / "summary.json").write_text(json.dumps(summary_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

lines = []
lines.append("# Trigger Description Sweep Summary")
lines.append("")
lines.append(f"- Candidates: {len(rows_sorted)}")
lines.append(f"- Output dir: {output_dir}")
lines.append("")
lines.append("| Rank | Candidate | Passed | Pass Rate | FN | FP |")
lines.append("| --- | --- | --- | --- | --- | --- |")
for index, row in enumerate(rows_sorted, start=1):
    summary = row.get("summary", {})
    passed = int(summary.get("passed", 0))
    total = int(summary.get("total", 0))
    rate = (passed / total * 100.0) if total else 0.0
    lines.append(
        f"| {index} | `{row.get('candidate_id')}` | {passed}/{total} | {rate:.1f}% | {row.get('false_negatives', 0)} | {row.get('false_positives', 0)} |"
    )

lines.append("")
if rows_sorted:
    best = rows_sorted[0]
    lines.append("## Best Candidate")
    lines.append("")
    lines.append(f"- id: `{best.get('candidate_id')}`")
    lines.append(f"- label: {best.get('candidate_label')}")
    lines.append(f"- description: {best.get('candidate_description')}")

(output_dir / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
PY
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --candidate-file)
      [[ $# -ge 2 ]] || { printf 'Error: --candidate-file requires a value.\n' >&2; exit 1; }
      CANDIDATE_FILE="$2"
      shift 2
      ;;
    --ids)
      [[ $# -ge 2 ]] || { printf 'Error: --ids requires a value.\n' >&2; exit 1; }
      SELECTED_IDS="$2"
      shift 2
      ;;
    --output-dir)
      [[ $# -ge 2 ]] || { printf 'Error: --output-dir requires a value.\n' >&2; exit 1; }
      OUTPUT_DIR="$2"
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
      shift 2
      ;;
    --list)
      LIST_ONLY=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
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
      printf 'Error: unknown argument: %s\n' "$1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -x "$RUN_SINGLE" ]]; then
  printf 'Error: required script not executable: %s\n' "$RUN_SINGLE" >&2
  exit 1
fi

if ! CANDIDATE_FILE="$(resolve_existing_path "$CANDIDATE_FILE")"; then
  printf 'Error: candidate file not found: %s\n' "$CANDIDATE_FILE" >&2
  exit 1
fi

if [[ -n "$EVAL_SET" ]]; then
  if ! EVAL_SET="$(resolve_existing_path "$EVAL_SET")"; then
    printf 'Error: eval set file not found: %s\n' "$EVAL_SET" >&2
    exit 1
  fi
fi

CANDIDATES=()
while IFS= read -r row; do
  CANDIDATES+=("$row")
done < <(parse_candidates)

if [[ "$LIST_ONLY" -eq 1 ]]; then
  printf 'Parsed %d candidates from %s\n' "${#CANDIDATES[@]}" "$CANDIDATE_FILE"
  for row in "${CANDIDATES[@]}"; do
    IFS=$'\t' read -r candidate_id candidate_label candidate_description <<<"$row"
    printf '  - %s (%s): %s\n' "$candidate_id" "$candidate_label" "$candidate_description"
  done
  exit 0
fi

if [[ -z "$OUTPUT_DIR" ]]; then
  timestamp="$(date '+%Y%m%d-%H%M%S')"
  OUTPUT_DIR="$DEFAULT_OUTPUT_BASE/$timestamp"
fi
mkdir -p "$OUTPUT_DIR"

JSONL_FILE="$(mktemp "${TMPDIR:-/tmp}/description-sweep.XXXXXX")"
cleanup() {
  rm -f "$JSONL_FILE"
}
trap cleanup EXIT

total="${#CANDIDATES[@]}"
index=0

printf 'Starting description sweep\n'
printf '  candidate file: %s\n' "$CANDIDATE_FILE"
printf '  output dir: %s\n' "$OUTPUT_DIR"
printf '  candidates: %s\n' "$total"

for row in "${CANDIDATES[@]}"; do
  index=$((index + 1))
  IFS=$'\t' read -r candidate_id candidate_label candidate_description <<<"$row"
  printf '\n[%d/%d] Evaluating %s (%s)\n' "$index" "$total" "$candidate_id" "$candidate_label"

  run_log="$OUTPUT_DIR/${candidate_id}.log"
  result_json="$OUTPUT_DIR/${candidate_id}.json"

  cmd=(bash "$RUN_SINGLE")
  if [[ "$candidate_description" != "@CURRENT" ]]; then
    cmd+=(--description "$candidate_description")
  fi
  if [[ -n "$EVAL_SET" ]]; then
    cmd+=(--eval-set "$EVAL_SET")
  fi
  if [[ -n "$SOURCE_CODEX_HOME" ]]; then
    cmd+=(--source-codex-home "$SOURCE_CODEX_HOME")
  fi
  if [[ ${#PASSTHROUGH_ARGS[@]} -gt 0 ]]; then
    cmd+=(-- "${PASSTHROUGH_ARGS[@]}")
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf 'DRY RUN: %s\n' "${cmd[*]}"
    continue
  fi

  "${cmd[@]}" | tee "$run_log"
  extract_eval_json "$run_log" "$result_json" "$candidate_id" "$candidate_label" "$candidate_description" >> "$JSONL_FILE"
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  printf '\nDry run complete. No evals executed.\n'
  exit 0
fi

write_aggregate_reports "$JSONL_FILE" "$OUTPUT_DIR"
printf '\nSweep complete. Summary:\n'
printf '  - %s\n' "$OUTPUT_DIR/summary.md"
printf '  - %s\n' "$OUTPUT_DIR/summary.json"
