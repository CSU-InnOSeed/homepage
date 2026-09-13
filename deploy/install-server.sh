#!/bin/bash
# 一次性 ECS 初始化：装工具 + 部署 nginx 配置
# 跑法：scp 上传到 /root/ 后 ssh 执行
#   bash /root/install-server.sh
set -euo pipefail

echo "==[1/6]== apt update"
apt-get update

echo "==[2/6]== apt install"
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    nginx \
    git \
    rsync \
    jq \
    curl \
    ca-certificates \
    cron \
    uuid-runtime

echo "==[3/6]== acme.sh (via git clone, get.acme.sh flaky on China routes)"
if [[ ! -d /root/.acme.sh ]]; then
    rm -rf /tmp/acme-sh-install
    git clone --depth 1 https://github.com/acmesh-official/acme.sh.git /tmp/acme-sh-install
    /tmp/acme-sh-install/acme.sh --install --no-cron --no-profile --home /root/.acme.sh
    rm -rf /tmp/acme-sh-install
fi
# shellcheck disable=SC1091
. /root/.acme.sh/acme.sh.env 2>/dev/null || true
/root/.acme.sh/acme.sh --version || true

echo "==[4/6]== create dirs"
mkdir -p /var/www/innoseed
mkdir -p /var/www/acme/.well-known/acme-challenge
mkdir -p /etc/nginx/ssl
chmod 755 /var/www/innoseed /var/www/acme
chmod 750 /etc/nginx/ssl

echo "==[5/6]== nginx config"
install -m 0644 /root/innoseed.nginx.conf /etc/nginx/sites-available/innoseed.conf
ln -sf /etc/nginx/sites-available/innoseed.conf /etc/nginx/sites-enabled/innoseed.conf
rm -f /etc/nginx/sites-enabled/default

# Stub-cert trick: 让 nginx 能在 DNS 切换前也能起来（cert 真正签发前会 502 但不会 crash）
if [[ ! -f /etc/nginx/ssl/innoseed.club.key ]]; then
    echo "  → generating ephemeral self-signed stub cert (will be replaced after LE issue)"
    openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/innoseed.club.key \
        -out /etc/nginx/ssl/innoseed.club.fullchain.cer \
        -subj "/CN=innoseed.club" \
        -addext "subjectAltName=DNS:innoseed.club,DNS:www.innoseed.club,DNS:minicamp.innoseed.club"
    chmod 600 /etc/nginx/ssl/innoseed.club.key
fi

nginx -t
systemctl enable --now nginx
systemctl reload nginx 2>/dev/null || systemctl start nginx

echo "==[6/6]== cron for logrotate"
cat >/etc/cron.d/innoseed-logrotate <<'CRON'
14 0 * * 0 root /usr/sbin/logrotate --force /etc/logrotate.d/nginx 2>/dev/null || true
CRON
chmod 0644 /etc/cron.d/innoseed-logrotate

echo
echo "DONE. nginx status:"
systemctl --no-pager status nginx | head -5
nginx -v
