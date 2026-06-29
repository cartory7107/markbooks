#!/bin/bash
cd /home/z/my-project/markbook
python3 -u scripts/check-urls-v3.py > scripts/check-output.log 2>&1
exit_code=$?
echo "EXIT: $exit_code" >> scripts/check-output.log
