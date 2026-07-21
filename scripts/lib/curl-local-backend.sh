# Sourced by deploy/diagnose scripts — curl backend on 127.0.0.1 with production Host headers.
# Production host guard rejects Host: 127.0.0.1; pass MMS_APP_DOMAIN when set.

curl_local_backend_ok() {
  local url="$1"
  local app_domain="${2:-}"
  if [[ -n "$app_domain" ]]; then
    curl -fsS --connect-timeout 3 --max-time 8 \
      -H "Host: ${app_domain}" \
      -H "X-Forwarded-Host: ${app_domain}" \
      -H "X-Forwarded-Proto: https" \
      "$url" >/dev/null 2>&1
  else
    curl -fsS --connect-timeout 3 --max-time 8 "$url" >/dev/null 2>&1
  fi
}

curl_local_backend() {
  local url="$1"
  local app_domain="${2:-}"
  if [[ -n "$app_domain" ]]; then
    curl -fsS --connect-timeout 3 --max-time 8 \
      -H "Host: ${app_domain}" \
      -H "X-Forwarded-Host: ${app_domain}" \
      -H "X-Forwarded-Proto: https" \
      "$url" 2>/dev/null
  else
    curl -fsS --connect-timeout 3 --max-time 8 "$url" 2>/dev/null
  fi
}
