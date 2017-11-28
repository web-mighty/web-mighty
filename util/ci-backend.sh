#!/bin/bash

set -ev

TYPE=$1
if [ $TYPE = 'install' ]; then
  echo '*** Installing dependencies'
  pip install django coverage coveralls
  pip install -r ./backend/requirements-dev.txt
elif [ $TYPE = 'before_script' ]; then
  echo '*** Setting up Django server'
  export PROJECT_PATH=$(pwd)/backend/backend
  python util/secret-key-gen.py
  cd backend
  ./manage.py migrate
  cd ..
elif [ $TYPE = 'script' ]; then
  cd backend
  echo '*** Running linter'
  flake8 --config ./flake8
  echo '*** Running unit tests'
  coverage run --branch --source="./api,./websocket" manage.py test
  cp .coverage ..
  cd ..
elif [ $TYPE = 'after_success' ]; then
  echo '*** Submitting coverage info'
  coveralls
fi
