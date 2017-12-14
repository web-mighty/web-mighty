#!/bin/bash

set -e

TYPE=$1
if [ $TYPE = 'before_install' ]; then
  if [ $INTEGRATION -eq 1 ]; then
    echo '*** Installing Python 3.5.3'
    pyenv install 3.5.3
    echo '*** Setting global Python version'
    pyenv global 3.5.3
  fi
  echo '*** Running xvfb'
  sh -e /etc/init.d/xvfb start
elif [ $TYPE = 'install' ]; then
  echo '*** Installing dependencies'
  if [ $INTEGRATION -eq 1 ]; then
    pip install -r ./backend/requirements-dev.txt
    cd frontend
    npm install
    cd ..
  else
    cd frontend
    npm install
    npm install coveralls
    cd ..
  fi
elif [ $TYPE = 'before_script' ]; then
  if [ $INTEGRATION -eq 1 ]; then
    echo '*** Setting up Django server'
    export PROJECT_PATH=$(pwd)/backend/backend
    python util/secret-key-gen.py
    cd backend
    ./manage.py migrate
    cd ..
  fi
elif [ $TYPE = 'script' ]; then
  export CHROME_BIN=/usr/bin/google-chrome
  export DISPLAY=:99.0
  if [ $INTEGRATION -eq 1 ]; then
    ./util/e2e.sh
  else
    cd frontend
    echo '*** Running linter'
    npm run lint
    echo '*** Running unit tests'
    npm run test -- --code-coverage --watch false
    cd ..
  fi
elif [ $TYPE = 'after_success' ]; then
  if [ $INTEGRATION -eq 0 ]; then
    # TODO: Without `cd`?
    echo '*** Submitting coverage info'
    cd frontend
    ./node_modules/coveralls/bin/coveralls.js .. < ./coverage/lcov.info
    cd ..
  fi
fi
