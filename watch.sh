#!/usr/bin/env bash
. ~/.nvm/nvm.sh
nvm use 0.10
nodemon index.js &
nodemon -w sass/*.* node_modules/.bin/node-sass --include-path sass sass/main.scss public/main.css &
node_modules/.bin/watchify browser.js -o public/bundle.js -v
