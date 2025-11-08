#!/bin/bash
# Render build script - ensures clean build

echo "Cleaning previous builds..."
rm -rf dist node_modules package-lock.json

echo "Installing dependencies..."
npm install

echo "Building client..."
npm run build

echo "Build complete - ready to start!"
