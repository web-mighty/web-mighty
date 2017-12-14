#!/bin/bash

set -e

TYPE=$1
if [ $TYPE = 'before_install' ]; then
  if [ $INTEGRATION -eq 1 ]; then
    echo '*** Installing nvm'
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    echo '*** Installing Node.js 8.8'
    nvm install 8.8
    echo '*** Setting global Node.js version'
    nvm use 8.8
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
