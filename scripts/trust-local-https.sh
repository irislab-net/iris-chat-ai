#!/usr/bin/env bash
# One-time: trust mkcert CA + point legacy/local hosts at loopback.
# Run in Terminal (needs your Mac password):
#   bash scripts/trust-local-https.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v mkcert >/dev/null 2>&1; then
  echo "Installing mkcert…"
  brew install mkcert nss
fi

echo "→ Trusting mkcert local CA (Keychain password prompt)…"
mkcert -install

FORCE_DEV_CERTS=1 node scripts/generate-dev-certs.mjs --force

ensure_host() {
  local host="$1"
  if ! grep -Eq "^[[:space:]]*127\\.0\\.0\\.1[[:space:]].*[[:space:]]${host}([[:space:]]|$)" /etc/hosts \
    && ! grep -Eq "^[[:space:]]*127\\.0\\.0\\.1[[:space:]]+${host}([[:space:]]|$)" /etc/hosts; then
    echo "→ Adding 127.0.0.1 ${host} to /etc/hosts…"
    echo "127.0.0.1 ${host}" | sudo tee -a /etc/hosts >/dev/null
  else
    echo "→ /etc/hosts already has ${host}"
  fi
}

ensure_host local.exur.ai
ensure_host local.irislab.info

echo
echo "Hosts:"
grep -E 'local\.(exur\.ai|irislab\.info)' /etc/hosts || true
echo
echo "Quit Chrome completely (Cmd+Q), then open:"
echo "  https://local.irislab.info:3000/"
echo "  https://local.exur.ai:3000/   ← use this for Google login"
echo
echo "If Chrome still blocks: chrome://net-internals/#hsts → delete local.irislab.info, local.exur.ai, exur.ai, irislab.info"
