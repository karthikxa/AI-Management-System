#!/bin/bash
# Start the Kortix API server
export PORT=8008
cd "C:/Users/balur/Downloads/Kortix/apps/api"
exec bun run --hot src/index.ts
