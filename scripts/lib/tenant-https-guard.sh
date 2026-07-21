# Sourced by verify/deploy scripts — ensure tenant HTTPS serves MMS, not foreign sites.
# Usage: source scripts/lib/tenant-https-guard.sh
#   tenant_https_headers "slug.mmsv2.example.com"
#   tenant_https_guard_failures "slug.mmsv2.example.com" "mmsv2.example.com"

tenant_https_headers() {
  local host="$1"
  curl -sI --connect-timeout 6 --max-time 18 "https://${host}/" 2>/dev/null || true
}

tenant_cert_sans_for_host() {
  local host="$1"
  local connect_host="${2:-$1}"
  echo | openssl s_client -servername "$host" -connect "${connect_host}:443" 2>/dev/null \
    | openssl x509 -noout -ext subjectAltName 2>/dev/null || true
}

tenant_cert_covers_host() {
  local host="$1"
  local app_domain="$2"
  local connect_host="${3:-$app_domain}"
  local sans
  sans="$(tenant_cert_sans_for_host "$host" "$connect_host")"
  echo "$sans" | grep -qF "DNS:*.${app_domain}" || echo "$sans" | grep -qF "DNS:${host}"
}

# Prints failure reason to stdout; returns 0 when OK, 1 when tenant is misrouted.
tenant_https_guard_failures() {
  local host="$1"
  local app_domain="$2"
  local hdr
  hdr="$(tenant_https_headers "$host")"

  if [[ -z "$hdr" ]]; then
    echo "unreachable"
    return 1
  fi

  local code
  code="$(printf '%s' "$hdr" | head -1 | awk '{print $2}')"

  if echo "$hdr" | grep -qi 'X-Redirect-By: Moodle'; then
    echo "moodle-vhost (X-Redirect-By: Moodle)"
    return 1
  fi

  local loc
  loc="$(printf '%s' "$hdr" | grep -i '^location:' | head -1 | tr -d '\r' || true)"
  if [[ -n "$loc" ]]; then
    local escaped="${app_domain//./\\.}"
    if echo "$loc" | grep -qiE "https?://[^/]*${escaped}(/|$)"; then
      :
    elif echo "$loc" | grep -qiE '^location:[[:space:]]*/'; then
      :
    else
      echo "external-redirect (${loc})"
      return 1
    fi
  fi

  if ! tenant_cert_covers_host "$host" "$app_domain"; then
    echo "tls-sni-not-mms (cert lacks *.${app_domain})"
    return 1
  fi

  if [[ "$code" == "000" || -z "$code" ]]; then
    echo "http-${code:-empty}"
    return 1
  fi

  return 0
}

# Verify host serves MMS API (not Moodle HTML). Optional deep check.
tenant_https_serves_mms_api() {
  local host="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 6 --max-time 15 \
    "https://${host}/health" 2>/dev/null || echo "000")"
  [[ "$code" == "200" ]]
}
