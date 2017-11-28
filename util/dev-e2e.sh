#!/bin/bash

echo -n '*** Testing for django...'
python -c 'import django' >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo ' failed; please check your environment'
  exit 1
fi
echo ' done'

set -e

echo -n '*** Backing up current database...'
cd backend
if [ -e db.sqlite3 ]; then
  mv db.sqlite3 .db.sqlite3
  echo ' done'
else
  echo ' not found'
fi

./manage.py migrate
cd ..
./util/e2e.sh

echo -n '*** Restoring database...'
cd backend
rm db.sqlite3
if [ -e .db.sqlite3 ]; then
  mv .db.sqlite3 db.sqlite3
  echo ' done'
else
  echo ' pass'
fi
cd ..
