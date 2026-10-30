#!/bin/bash
# Runs the whole suite against a local server. Statements are generated on the fly (see gen-statement.js); no real statement is ever read.
# Usage: from the repo root, `python3 -m http.server 8765 &` then `bash tests/run-all.sh`
cd "$(dirname "$0")" || exit 1
fail=0
run() { # name, command
  out=$(timeout 300 $2 2>&1); code=$?
  bad=$(echo "$out" | grep -cE '^FAIL|PAGEERROR|crashed|ERRORS [^n]|ERR [^n]|errors: [^n]| ERR [A-Z]')
  pass=$(echo "$out" | grep -c '^PASS')
  if [ $code -ne 0 ] || [ "$bad" -ne 0 ]; then echo "FAILED  $1 ($pass passed, $bad problems)"; echo "$out" | grep -E '^FAIL|PAGEERROR|crashed|ERRORS [^n]|ERR [^n]|errors: [^n]| ERR [A-Z]' | head -5 | cut -c1-200; fail=1; else echo "ok      $1 ($pass checks)"; fi
}
# No bank statement may be tracked by git.
if git ls-files | grep -qiE "\.(xlsx|xls|xlsm|csv)$"; then echo "FAILED  a statement-like file is tracked by git"; git ls-files | grep -iE "\.(xlsx|xls|xlsm|csv)$"; fail=1; else echo "ok      no statement files tracked"; fi
for f in storage statement imports s10 s12 s13 s16 s19 t15 t16 t17 t18 t19 t20 t21 t22 t23; do run $f "node $f.js"; done
out=$(timeout 300 node crawl.js 2>&1); if echo "$out" | grep -q 'CRAWL CLEAN'; then echo "ok      crawl"; else echo "FAILED  crawl"; echo "$out" | head -5 | cut -c1-200; fail=1; fi
for sd in 1 2 3 4 5 6; do out=$(timeout 300 node fuzz.js $sd 2>&1); if echo "$out" | grep -q 'FUZZ CLEAN'; then echo "ok      fuzz seed $sd"; else echo "FAILED  fuzz seed $sd"; echo "$out" | tail -3 | cut -c1-200; fail=1; fi; done
[ $fail -eq 0 ] && echo "SUITE CLEAN" || echo "SUITE HAS FAILURES"
exit $fail
