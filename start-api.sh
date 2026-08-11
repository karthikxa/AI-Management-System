#!/bin/bash
# Start the Zed API server
export PORT=8008
cd "C:/Users/balur/Downloads/Zed/apps/api"
exec bun run --hot src/index.ts
