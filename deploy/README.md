# InnOSeed 双线部署（国内 DNSPod 分线 + 阿里云 ECS + Vercel 兜底）

## 架构

```
国内用户 → DNSPod(国内线路)  → 8.210.122.152 (阿里云 ECS 香港) → nginx 静态 + /api/* 反代 Vercel
海外用户 → DNSPod(海外/默认)  → innoseed-landing.vercel.app (Vercel 继续生效)
```

ECS 只跑 `nginx`：静态文件从 `dist/` 出，`/api/*` 反代到 Vercel Function。Vercel 那条链路不动，作为海外主入口 + 国内兜底。

## 当前状态

- [x] ECS 已初始化：Debian 13 / nginx / acme.sh / git / rsync / jq
- [x] dist/ 已 build 同步到 `/var/www/innoseed`
- [x] nginx 配置已部署 (`/etc/nginx/sites-available/innoseed.conf`)，临时自签证书占位
- [ ] **Porkbun NS 改到 DNSPod**
- [ ] **DNSPod 加分线解析**
- [ ] **DNSPod 创建 API Token** → 我用 acme.sh 签 wildcard 证书
- [ ] reload nginx + 验证

## 一次性操作

### 1. Porkbun 改 NS

1. 登录 [dnspod.cn](https://dnspod.cn)（或控制台 https://console.dnspod.cn）
2. **DNS 解析** → 添加域名 `innoseed.club` → DNSPod 给你两条 NS（**实际显示的为准**，可能是 `rabbit.dnspod.net` / `bread.dnspod.net` 这种 `*.dnspod.net` 形式，也可能是 `ns3.dnsv2.com` / `ns4.dnsv2.com`）
3. 登录 [porkbun.com](https://porkbun.com) → 域名列表 → `innoseed.club` → **Details** → **Nameservers** → 选 **Custom** → 填入 DNSPod 给的 NS
4. 等 10–30 min 生效（TTL 默认 600s，半天内全球生效）

> 验证 NS 切到位：`dig +short innoseed.club NS @8.8.8.8` 应该返回 DNSPod 那两条（而非原来的 `ns1/2.vercel-dns.com`）。

### 2. DNSPod 加解析（分线路）

在 DNSPod 控制台 → 域名 `innoseed.club` → 记录管理，逐条添加：

| 主机记录 | 记录类型 | 记录值 | 线路 | TTL |
| --- | --- | --- | --- | --- |
| @ | A | 8.210.122.152 | 国内 | 600 |
| @ | CNAME | innoseed-landing.vercel.app. | 海外 | 600 |
| @ | CNAME | innoseed-landing.vercel.app. | 默认 | 600 |
| www | A | 8.210.122.152 | 国内 | 600 |
| www | CNAME | innoseed-landing.vercel.app. | 海外 | 600 |
| www | CNAME | innoseed-landing.vercel.app. | 默认 | 600 |
| minicamp | A | 8.210.122.152 | 国内 | 600 |
| minicamp | CNAME | innoseed-landing.vercel.app. | 海外 | 600 |
| minicamp | CNAME | innoseed-landing.vercel.app. | 默认 | 600 |

> CNAME 记录值的末尾那个点 `.` 一定要保留（DNSPod 接受后会自动处理）。

### 3. 申请 SSL 证书（DNS-01 / wildcard）

1. DNSPod 控制台 → 右上角头像 → **用户中心** → **安全设置** → **API Token** → **创建 Token**
2. 名称随便取（比如 `acme-sh-innoseed`）
3. 权限至少勾：`记录列表` / `记录创建` / `记录修改` / `记录删除`
4. 创建后会显示 **ID** + **Token**（只显示一次，**复制保存**），发给我
5. 我用 acme.sh 签 `*.innoseed.club` 通配证书（DNS-01 验证，**不**等 HTTP 解析生效）

### 4. 验证

```bash
# 海外应解析到 Vercel CNAME（实际 IP 是 Vercel Anycast）
dig +short innoseed.club @8.8.8.8

# 国内应解析到 8.210.122.152
dig +short innoseed.club @223.5.5.5

# 端到端
curl -I https://innoseed.club/
curl -I https://innoseed.club/apply
curl -I -X POST https://innoseed.club/api/apply -H 'content-type: application/json' -d '{}'
```

## 日常部署

```bash
# 本地
pnpm build
rsync -avz --delete ./dist/ root@8.210.122.152:/var/www/innoseed/
ssh root@8.210.122.152 'nginx -t && systemctl reload nginx'
```

## 监控 / 排错

```bash
# nginx 状态 / 错误日志
ssh root@8.210.122.152 'systemctl status nginx && tail -50 /var/log/nginx/innoseed.error.log'

# 实时访问
ssh root@8.210.122.152 'tail -f /var/log/nginx/innoseed.access.log'

# 内存（总 900Mi）
ssh root@8.210.122.152 'free -h'
```

## 安全备注

- root 凭据曾在会话中明文传输，已视为泄露；**部署前务必轮换密码并改用 SSH key**
- 现在只有 22 端口暴露，22/80/443 在阿里云安全组放通
- HTTPS 证书由 Let's Encrypt 签发，acme.sh 自动续（cron 已装）
