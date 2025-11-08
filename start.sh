#!/bin/bash
# Production start script for Render

export NODE_ENV=production
exec tsx server/index.ts
