#!/bin/sh
# Production start script for Render

export NODE_ENV=production
exec npx tsx server/index.ts
