#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
umask 077
if [ -e api-server/.env ]; then
  printf '%s\n' 'api-server/.env exists. Keeping the current local keys.'
  exit 0
fi
jwt_secret=$(openssl rand -hex 48)
encryption_key=$(openssl rand -base64 32)
hmac_key=$(openssl rand -base64 32)
(
  set -C
  printf 'JWT_SECRET=%s\nENCRYPTION_KEY=%s\nHMAC_KEY=%s\n' \
    "$jwt_secret" "$encryption_key" "$hmac_key" > api-server/.env
)
