#!/bin/bash
kill %1
git stash
git pull
node index.js
