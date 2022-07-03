#!/bin/bash

echo "Installing 'common' package"
(cd common      && npm ci && npm run build && npm link)

echo "Installing 'backend' package"
(cd backend     && npm link @get-me-drunk/common && npm run build)

echo "Installing 'frontend' package"
(cd frontend    && npm link @get-me-drunk/common && npm run build)

echo "Installing 'scripts' package"
(cd scripts     && npm link @get-me-drunk/common && npm run build)