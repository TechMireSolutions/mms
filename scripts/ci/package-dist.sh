#!/usr/bin/env bash
# Package the production build into the release tarball consumed by
# scripts/deploy-on-server.sh. Shared by ci.yml (build once, on push to main)
# and deploy.yml (manual-dispatch rebuild) so both produce the same layout.
set -euo pipefail

tar czf mms-dist.tar.gz apps/backend/dist apps/frontend/dist packages/shared/dist
sha256sum mms-dist.tar.gz > mms-dist.tar.gz.sha256
