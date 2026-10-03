# Streamed to the production host by scripts/ci/ssh-exec.sh (renew-tls-cert.yml).
# Issues the apex + wildcard certificate via acme.sh with Name.com DNS-01.
set -euo pipefail

echo "=== Cert status for ${MMS_APP_DOMAIN} ==="
sudo certbot certificates 2>&1 \
  | awk -v name="Certificate Name: ${MMS_APP_DOMAIN}" '$0 ~ name {f=1} f {print; if (/Private Key Path/) f=0}' || true

if [ "${DRY_RUN}" = "true" ]; then
  echo 'DRY RUN — exiting without changes.'
  exit 0
fi

if [ ! -x "${HOME}/.acme.sh/acme.sh" ]; then
  echo '=== Installing acme.sh ==='
  curl -fsSL https://get.acme.sh | sh -s -- --email "admin@${MMS_APP_DOMAIN}"
fi
ACME="${HOME}/.acme.sh/acme.sh"

echo "=== Issuing wildcard cert: ${MMS_APP_DOMAIN} + *.${MMS_APP_DOMAIN} ==="
Namecom_Username="${NAMECOM_USERNAME}" \
Namecom_Token="${NAMECOM_API_TOKEN}" \
"${ACME}" --issue \
  --dns dns_namecom \
  -d "${MMS_APP_DOMAIN}" \
  -d "*.${MMS_APP_DOMAIN}" \
  --dnssleep 60 \
  --force

CERT_DIR="/etc/letsencrypt/live/${MMS_APP_DOMAIN}"
sudo mkdir -p "${CERT_DIR}"
"${ACME}" --install-cert \
  -d "${MMS_APP_DOMAIN}" \
  --cert-file      "${CERT_DIR}/cert.pem" \
  --key-file       "${CERT_DIR}/privkey.pem" \
  --fullchain-file "${CERT_DIR}/fullchain.pem" \
  --ca-file        "${CERT_DIR}/chain.pem" \
  --reloadcmd      'sudo systemctl reload apache2'

echo '=== New expiry ==='
echo | openssl s_client -servername "${MMS_APP_DOMAIN}" -connect "${MMS_APP_DOMAIN}:443" 2>/dev/null \
  | openssl x509 -noout -dates 2>/dev/null | grep notAfter || echo 'unknown'

echo '=== Health checks ==='
sleep 3
curl -fsS --max-time 15 "https://${MMS_APP_DOMAIN}/health" && echo 'Apex OK'
TENANT_HOST="${TENANT_SUBDOMAIN}.${MMS_APP_DOMAIN}"
if dig +short "${TENANT_HOST}" | grep -q .; then
  curl -fsS --max-time 10 "https://${TENANT_HOST}/health" && echo "Tenant ${TENANT_HOST} wildcard OK"
fi

"${ACME}" --install-cronjob || true
echo ''
echo 'Wildcard cert installed. Auto-renewal cron set by acme.sh.'
echo "Both ${MMS_APP_DOMAIN} and *.${MMS_APP_DOMAIN} are covered."

echo '=== Removing abandoned NXDOMAIN certs ==='
for DEAD in grav.aabtaab.com grave.darulquran.pk; do
  if sudo certbot certificates 2>&1 | grep -q "Certificate Name: ${DEAD}"; then
    echo "Deleting: ${DEAD}"
    sudo certbot delete --cert-name "${DEAD}" --non-interactive || true
  fi
done
