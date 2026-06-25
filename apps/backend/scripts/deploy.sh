#!/bin/sh
# apps/backend/scripts/deploy.sh
# يُنفَّذ تلقائياً عند كل Deploy على Railway/Render

set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "⚙️  Generating Prisma client..."
npx prisma generate

echo "🚀 Starting server..."
node dist/main
