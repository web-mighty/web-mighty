#!/bin/bash

echo -n "*** Running Django server..."
cd backend
./manage.py runserver >../backend.stdout 2>../backend.stderr &
DJANGO_PID=$!
cd ..
echo " Done"

echo "*** Running integrated tests"
cd frontend
npm run e2e
ANGULAR_EXIT_CODE=$?
echo "*** Angular exit code: $ANGULAR_EXIT_CODE"
cd ..

echo -n "*** Stopping Django server..."
pkill --signal SIGTERM -P $DJANGO_PID
wait $DJANGO_PID
echo " Done"

echo "*** Django stdout:"
cat backend.stdout
rm backend.stdout
echo
echo "*** Django stderr:"
cat backend.stderr
rm backend.stderr
echo

set -e
( exit $ANGULAR_EXIT_CODE )
