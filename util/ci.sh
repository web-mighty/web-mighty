#!/bin/bash

if [ $TEST = 'FRONTEND_UNIT' ]; then
  echo "*** Test configuration: Frontend unit test"
  export INTEGRATION=0
  exec ./util/ci-frontend.sh $1
elif [ $TEST = 'INTEGRATION' ]; then
  echo "*** Test configuration: Integration test"
  export INTEGRATION=1
  exec ./util/ci-frontend.sh $1
elif [ $TEST = 'BACKEND_UNIT' ]; then
  echo "*** Test configuration: Backend unit test"
  exec ./util/ci-backend.sh $1
fi
