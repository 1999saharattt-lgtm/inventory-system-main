#!/bin/bash

git add .

if git diff --cached --quiet; then
  echo "ไม่มีไฟล์ที่เปลี่ยนแปลง"
  exit 0
fi

git commit -m "auto: update"
git push origin main
