# DNS 解析 + 网站部署 知识总结

> 整理自 InnOSeed 双线部署实战（2026-08-29/30）踩坑经验，**通用**，不限于本项目。
> 重点：**常见误区** + **踩坑实录** + **可复用的工程知识**。

---

## 一、DNS 解析

### 1.1 DNS 体系结构（请求链路）

```
用户浏览器
  ↓
本地 resolver（macOS / 阿里 / Google / Cloudflare）
  ↓ cache miss
根服务器（. / 13 台）
  ↓ 问 ".club 在哪"
TLD 权威（.club 注册局：a.nic.club / b.nic.club / k.nic.club）
  ↓ 问 "innoseed.club 在哪"
权威 NS（用户在注册商设置的，比如 rabbit.dnspod.net）
  ↓ 查记录
返回 A / CNAME / ...
```

**修改 NS 的链路**：Porkbun（注册商）→ 注册局（.club）→ 根 zone → 全球 resolver 缓存 → 实际查询。

### 1.2 记录类型速查

| 类型 | 用途 | 示例 |
| --- | --- | --- |
| **A** | 域名 → IPv4 | `@ A 8.210.122.152` |
| **AAAA** | 域名 → IPv6 | `@ AAAA 2001:db8::1` |
| **CNAME** | 域名 → 另一个域名（**别名**）| `www CNAME cname.vercel-dns.com.` |
| **NS** | 域名 → 权威 DNS 服务器 | `@ NS rabbit.dnspod.net` |
| **MX** | 邮件路由 | `@ MX 10 mx1.feishu.cn.` |
| **TXT** | 文本记录（验证 / SPF / DKIM）| `_dmarc TXT v=DMARC1; p=quarantine` |

### 1.3 CNAME 铁律（RFC 1034）

- **同一名字 + 同一线路下，CNAME 不能跟 A / MX / TXT / NS 共存**
- 同一名字 + **不同线路**（境内 / 境外 / 默认）下可以共存（DNSPod 智能分线）
- CNAME 是"代理转发"，跟 A 记录的"直接指向 IP"在 DNS 协议层互斥

### 1.4 NS 切换的真实传播时间

**Porkbun 改 NS 后**：
1. **秒级**：Porkbun 控制台 + whois 立即更新到 DNSPod
2. **分钟级**：DNSPod 内部 SOA 更新（serial 变化）
3. **小时级**：注册局（.club）zone 文件里 innoseed.club 的 NS 记录更新
4. **几小时**：全球 resolver（Google / Cloudflare / 阿里 / 114）缓存的 NS 链过期

**关键**：注册局 zone 文件里 NS 记录的 TTL 是注册局设的，**用户改不了**。`.club` 给 innoseed.club 设的 NS TTL = `23524 秒`（**6.5 小时**）—— 这是 Vercel 当年注册域名时默认的。

**等不等得了？** 看你设的 TTL：120s → 2 min 传播，1h → 1h 传播，6.5h → 6.5h 传播。

### 1.5 DNS 智能分线

| DNS 服务商 | 分线支持 | 备注 |
| --- | --- | --- |
| **DNSPod** | ✅ 免费版支持 | 14 条线路（境内 / 境外 / 默认 / 国内 / 海外 / 搜索引擎 / 电信 / 联通 / 移动 / 各省 / 教育网） |
| **阿里云 DNS** | ✅ 免费版支持 | 同上 |
| **Cloudflare** | ❌ 免费版**不支持** | 要 Load Balancer（$5/月起）|
| **Vercel DNS** | ❌ 不支持 | 单条 A 记录，无分线 |

**典型用法**（"国内走 ECS，海外走 Vercel"）：

| 主机 | 类型 | 值 | 线路 |
| --- | --- | --- | --- |
| `@` / `www` / `minicamp` | A | ECS IP | 境内 / 国内 |
| `@` / `www` / `minicamp` | CNAME | `cname.vercel-dns.com.` | 境外 / 海外 |
| `@` / `www` / `minicamp` | CNAME | `cname.vercel-dns.com.` | 默认 |

### 1.6 Vercel DNS 的限制（项目实战发现）

Vercel dashboard 上的 `Domains` 页面有"link / unlink" 状态机：

| 状态 | DNS 行为 | 用户能不能改 A 记录 |
| --- | --- | --- |
| **link** + DNS 正确指向 Vercel 边缘 | Valid Configuration | ❌ Vercel 强制 A 指自己 |
| **link** + DNS 指别的 | Invalid Configuration（警告）| ❌ 加 A 记录**会被 Vercel 覆盖** |
| **unlink** | Vercel 把 A 改成 **parking `198.18.0.5/6/7`** | ❌ |

**结论**：**Vercel 上完全改不了非 Vercel IP 的 A 记录**。要换 IP 必须**让 Porkbun NS 切到其他 DNS**（DNSPod / Cloudflare）。

### 1.7 CNAME target 常见误区

| 错误用法 | 正确用法 |
| --- | --- |
| `CNAME innoseed-landing.vercel.app.` | `CNAME cname.vercel-dns.com.` |
| `CNAME my-project.vercel.app.` | `CNAME cname.vercel-dns.com.` |

- `cname.vercel-dns.com.` = Vercel 的 **CNAME target**（DNS 解析的下一跳）
- `innoseed-landing.vercel.app.` = Vercel 项目的**访问 URL**（浏览器能直接打开的地址）
- Vercel 还有更精确的 target（`9293a6f6fcfa0256.vercel-dns-017.com.`），但通用 `cname.vercel-dns.com.` 永远可用

### 1.8 DNS 测试命令速查

```bash
# 看 NS 链（注册商权威）
dig +short innoseed.club NS @a.nic.club

# 看完整 NS 链（带 trace）
dig +trace innoseed.club

# 看 A 记录（公共 DNS 视角）
dig +short innoseed.club @8.8.8.8

# 看 _acme-challenge TXT（SSL 验证）
dig +short _acme-challenge.innoseed.club TXT @8.8.8.8

# 看 SOA 记录（NS 已切但缓存没过期时会看到新 NS 的 SOA）
dig +short innoseed.club SOA @a.nic.club

# NS 记录缓存还剩多少秒（global resolver）
dig +noall +answer innoseed.club @8.8.8.8 | grep -E "NS|TTL"
```

### 1.9 DNSPod API 速查（acme.sh 用）

```bash
# 旧版（acme.sh dns_dp 用）
curl -sX POST 'https://dnsapi.cn/Record.List' \
  --data-urlencode "login_token=$DP_Id,$DP_Key" \
  --data-urlencode "format=json" \
  --data-urlencode "domain=innoseed.club" \
  --data-urlencode "sub_domain=_acme-challenge"

# 列出所有记录
curl -sX POST 'https://dnsapi.cn/Record.List' \
  --data-urlencode "login_token=$DP_Id,$DP_Key" \
  --data-urlencode "format=json" \
  --data-urlencode "domain=innoseed.club" | jq '.records[] | {id, name, type, line, value}'
```

---

## 二、网站部署

### 2.1 部署栈组成

```
┌─────────────────────────────────────────────┐
│ 用户浏览器                                  │
└──────────┬──────────────────────────────────┘
           │ DNS 解析
           ▼
┌─────────────────────────────────────────────┐
│ Web 服务器 (nginx)                          │
│  ├─ 静态文件 (dist/): HTML/CSS/JS/资源      │
│  ├─ SSL 终止: Let's Encrypt wildcard         │
│  ├─ 反向代理: /api/* → Vercel Function      │
│  └─ 安全 headers: HSTS / CSP / X-Frame       │
└──────────┬──────────────────────────────────┘
           │ HTTPS
           ▼
┌─────────────────────────────────────────────┐
│ Vercel (innoseed-landing)                   │
│  ├─ Function: /api/apply                    │
│  ├─ Edge: 全球 CDN 备份                      │
│  └─ 项目 URL: innoseed-landing.vercel.app   │
└─────────────────────────────────────────────┘
```

### 2.2 nginx 配置关键模式

#### SPA fallback（React / Vue 路由）

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

- 用户访问 `/apply` → `$uri=/apply` 不存在 → fallback 到 `/index.html`
- React Router 在客户端解析 `/apply`，渲染正确页面

#### 反向代理（保留 Host 头）

```nginx
upstream vercel_app {
    server innoseed-landing.vercel.app:443;
    keepalive 32;
}

location /api/ {
    proxy_pass https://vercel_app;
    proxy_ssl_server_name on;          # 用 SNI 解析 upstream
    proxy_ssl_name innoseed-landing.vercel.app;
    proxy_set_header Host innoseed-landing.vercel.app;  # 关键：必须改 Host，否则 Vercel 不知道返回哪个项目
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Connection "";     # 配合 keepalive
}
```

#### 安全 headers（镜像 Vercel）

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

#### 缓存策略（不可变资源）

```nginx
location ~* ^/imgs/ { expires 1y; add_header Cache-Control "public, max-age=31536000, immutable" always; }
location ~* \.(js|css|woff2)$ { expires 1y; add_header Cache-Control "public, max-age=31536000, immutable" always; }
location = /index.html { add_header Cache-Control "public, max-age=0, must-revalidate" always; }  # HTML 永远不缓存
```

### 2.3 SSL 证书

#### HTTP-01 vs DNS-01

| 验证方式 | 适用 | 限制 |
| --- | --- | --- |
| **HTTP-01** | 单域名 / 多域名 | 需要 80 端口能被 LE 访问；**不能签 wildcard** |
| **DNS-01** | wildcard / 多域名 / 80 端口被墙 | 需要 DNS API（DNSPod / Cloudflare / 各种）|

**这次实战用 DNS-01 签 `*.innoseed.club`**（一份覆盖 @ / www / minicamp）。

#### SAN 关键点

```
Subject:  CN=innoseed.club
SAN:      DNS:*.innoseed.club, DNS:innoseed.club
```

- `*.innoseed.club` 通配符匹配**所有子域**（www / minicamp）
- **不匹配主域** `innoseed.club`（RFC 6125 规定）
- 一份证书同时覆盖主域 + 子域 = SAN 同时列出两者

#### acme.sh 实战

```bash
# 1. 装 acme.sh（git clone 稳，get.acme.sh 在中国路由不稳）
git clone --depth 1 https://github.com/acmesh-official/acme.sh.git
./acme.sh --install --no-cron --no-profile --home /root/.acme.sh

# 2. 签 wildcard 证书（DNSPod API）
export DP_Id="12345"
export DP_Key="abc123..."
/root/.acme.sh/acme.sh --issue \
  -d innoseed.club -d "*.innoseed.club" \
  --dns dns_dp --keylength ec-256 --dnssleep 60

# 3. 装证书 + reload nginx（同时注册自动续期 cron）
/root/.acme.sh/acme.sh --install-cert -d innoseed.club \
  --fullchain-file /etc/nginx/ssl/innoseed.club.fullchain.cer \
  --key-file /etc/nginx/ssl/innoseed.club.key \
  --reloadcmd "systemctl reload nginx"
```

**续期**：acme.sh 安装时自动加 cron 任务，每天 0:00 检查，过期 60 天前续。**不需手动管**。

### 2.4 Vercel 项目

#### 域名 link 状态机

| 状态 | 含义 | 行为 |
| --- | --- | --- |
| **linked** (Valid) | DNS 正确指向 Vercel 边缘 | Vercel 签 SSL，serve 项目 |
| **linked** (Invalid) | DNS 没指向 Vercel 边缘 | 警告但功能正常（如果 DNS 真解析到 Vercel）|
| **unlinked** | 域名从项目移除 | Vercel 把 A 改 parking 198.18.0.5 |
| **redirect to another domain** | 308 重定向到另一个域名 | Vercel 项目内设置（HTTP 层） |

#### backup URL

`https://innoseed-landing.vercel.app` —— Vercel 项目自动获得的**永久访问 URL**，**不依赖** `innoseed.club`。作为 ECS 过期时的紧急回滚入口。

### 2.5 部署回滚（5 min 切回任一边）

```
切回 Vercel（ECS 挂了/过期）：
  1. Vercel dashboard → innoseed-landing → Settings → Domains
  2. Add innoseed.club (重新 link)
  3. Vercel 自动加 A/CNAME 记录
  4. 删 ECS 加的 3 条 A 记录

切回 ECS（Vercel 挂了/要优化国内）：
  1. DNSPod 控制台 → innoseed.club → 记录管理
  2. 9 条记录：3 主机 × 3 线路
  3. 全部改成 ECS IP（境内 A）/ Vercel CNAME（境外 + 默认）
```

### 2.6 Vite 部署

```bash
# 本地 build
pnpm build   # 出 dist/，60 个文件 / 3.1MB

# 同步到 ECS（增量，不删旧）
rsync -avz --exclude '.DS_Store' dist/ root@8.210.122.152:/var/www/innoseed/

# nginx reload
ssh root@8.210.122.152 'nginx -t && systemctl reload nginx'
```

**为什么不用 `--delete`**：Vite 用 content hash（`Pillars-BkBEJkbc.js`），HTML 引用新 hash，**旧文件不影响功能**。删旧文件要 `rm -rf`（permission gate 拦截 `rm -rf` / `rsync --delete`）—— 增量最稳。

---

## 三、踩坑实录（这次实战）

### 3.1 ❌ Porkbun 控制权缺失

**症状**：`Porkbun 改 NS` 这步完全卡住。
**原因**：域名是别人（学长 / Lab owner）买的，用户没账号。
**解决**：
- 找原注册人帮忙改（5 min）
- 邮箱重置密码（30 min，需要注册邮箱可用）
- 域名转移（5-7 天）

### 3.2 ❌ Vercel unlink 副作用

**症状**：`Vercel unlink 域名` 后，A 记录从用户配的 ECS IP 变成 `198.18.0.5`（Vercel parking）。
**原因**：Vercel 设计行为——unlink 时**自动改 A 记录为 parking IP**（让 Vercel 自身的 parking 页面 serve）。
**教训**：
- 想要 ECS IP 必须**不 unlink**
- 但不 unlink Vercel 不让你加非 Vercel IP 的 A
- **死结** → 必须 Porkbun 改 NS 切到其他 DNS

### 3.3 ❌ CNAME + A 同名字冲突

**症状**：DNSPod 加 `www CNAME` 报"Existing record [...] conflict"。
**原因**：DNS 协议规定，**CNAME 不能跟任何其他记录类型共存**于同一名字。Vercel 已经加了 `www CNAME innoseed-landing.vercel.app.`，不能再加 A。
**解决**：
- 加 A 记录前**先删 CNAME**
- 或者用 DNSPod 智能分线：CNAME 走境外，A 走境内（不同线路可共存）

### 3.4 ❌ `.club` zone NS TTL 6.5h

**症状**：Porkbun 改 NS 几小时后，**全球 resolver 仍返回 Vercel NS**（`198.18.0.5`），不解析到 ECS。
**原因**：`.club` 注册局 zone 文件里 `innoseed.club` 的 NS 记录 TTL = `23524 秒`（Vercel 当年注册时默认的）。
**判断**：
```bash
dig innoseed.club NS @a.nic.club
# TTL 字段：23524（6.5h）
```
**加速**：联系 Porkbun 客服（support@porkbun.com）让他们 push 一下，1-2h 可能搞定。
**教训**：**改 NS 之前先看老 NS 的 TTL**——`vercel-dns.com` 系列的 TTL 通常 6.5h，`cloudflare.com` 是 5min。

### 3.5 ❌ CNAME target 误用

**症状**：用户看到 Vercel 上有 `CNAME innoseed-landing.vercel.app.`，以为这就是 Vercel 项目的 CNAME target。
**原因**：混淆**访问 URL**（`innoseed-landing.vercel.app.`）和**CNAME target**（`cname.vercel-dns.com.`）。
**教训**：
- Vercel 通用 CNAME target：`cname.vercel-dns.com.`（永远可用）
- Vercel 精确 target：`9293a6f6fcfa0256.vercel-dns-017.com.`（性能略好）
- **绝不用** `*.vercel.app.` 做 CNAME target（那是访问 URL）

### 3.6 ❌ HTTPS 验证前置

**症状**：acme.sh DNS-01 issue 失败，"No TXT record found at _acme-challenge.innoseed.club"。
**原因**：DNSPod 上 challenge 记录加成功了，但 LE 查时**走根 → .club → Porkbun NS（仍是 Vercel）→ 查不到**。
**判断**：
```bash
dig _acme-challenge.innoseed.club TXT @8.8.8.8  # 返回空
dig _acme-challenge.innoseed.club TXT @rabbit.dnspod.net  # 能查到
```
**解决**：必须先让 Porkbun NS 改到 DNSPod，DNSPod 才有权威。

### 3.7 ❌ 本地测试假象

**症状**：`curl https://innoseed.club/` 返 200 + `Server: nginx` + 真实内容，以为成功了。
**原因**：macOS 系统 HTTP 代理（`final_ip=127.0.0.1` 是 CONNECT 代理标志）直接连 ECS，**绕过 DNS 解析**。
**教训**：
- 真正验证要走 **直访 ECS IP**（`curl https://8.210.122.152/`）或 **直访公共 DNS**（不用本地 resolver）
- `dig +short` 看真实 IP，`curl -v` 看 `Connected to` 那一行
- "Connection established" = HTTP CONNECT 代理 = 测试假象

### 3.8 ❌ Vercel 308 redirect 误解

**症状**：Vercel 上 `innoseed.club` 显示 "308 redirect to www.innoseed.club"。
**原因**：unlink 失败 / 不完整，Vercel 把它设成了 redirect 模式。
**教训**：
- 这是 Vercel **项目内 HTTP 层**设置（不是 DNS 层 redirect）
- A 记录改后这条 redirect 没用了（DNS 直奔 ECS，Vercel 收不到请求）

### 3.9 ❌ SSH root 密码泄露

**症状**：root 凭据曾在对话里明文传输，应按已泄露处理。
**教训**：
- 部署完后**必须 `passwd` 改**
- 加 SSH key + 关密码登录（`sed -i 's/PasswordAuthentication yes/no/'`）
- 公钥部署：`ssh-copy-id -i ~/.ssh/innoseed-ecs.pub root@8.210.122.152`

### 3.10 ❌ LE rate limit

**症状**：重复签发同一域名触发 Let's Encrypt rate limit（5 次/周）。
**教训**：
- 一次签成功就别再 `--force`
- 改 issue 模式（HTTP-01 ↔ DNS-01）也计数
- 测试用 staging：`--server https://acme-staging-v02.api.letsencrypt.org/directory`

---

## 四、监控与自动化

### 4.1 UptimeRobot（强烈建议）

- 注册 https://uptimerobot.com（免费版 50 monitor）
- 加 HTTPS monitor：`https://innoseed.club/`
- 间隔 5 min，挂 1 min 触发告警
- 告警：邮件 / 微信 Webhook / Telegram bot

### 4.2 acme.sh 自动续期

acme.sh 安装时**自动加 cron 任务**：

```bash
# 查看 cron
crontab -l | grep acme
# 0 0 * * * "/root/.acme.sh"/acme.sh --cron --home "/root/.acme.sh" > /dev/null
```

每天 0:00 检查，过期 60 天前续。续期时 acme.sh 调用 DNS API 加 challenge TXT → LE 验证 → 替换证书 → reload nginx。

### 4.3 NGINX 状态自检

```bash
ssh root@8.210.122.152 '
  systemctl status nginx | head -3
  nginx -t 2>&1
  ss -tlnp | grep -E ":80|:443"
  free -h
  df -h /
  tail -5 /var/log/nginx/innoseed.error.log
'
```

---

## 五、关键经验总结

### 5.1 DNS 修改的标准流程

```
1. 评估：能改 NS 吗？有 Porkbun 控制权吗？
2. 改 NS：在注册商控制台
3. 加记录：在新 DNS 服务商加 A/CNAME（9 条智能分线）
4. 签证书：DNS-01 wildcard（需要 DNS API）
5. 装证书 + reload
6. 验证：dig + curl + 浏览器
7. 监控：UptimeRobot + 日志
```

### 5.2 域名迁移的"零信任"原则

- **永远先 dig 验证再操作**
- **永远保留 backup URL**（`*.vercel.app` 不依赖自定义域名）
- **永远知道 ECS IP**（直访能验证服务状态，绕过 DNS）

### 5.3 部署的"四层验证"

```
L1:  dig +short @8.8.8.8            → DNS 解析对
L2:  curl -I https://ECS_IP/         → ECS 服务在
L3:  curl -I https://域名/           → 域名能访问
L4:  openssl s_client -servername    → 证书对
```

**L1+L2 必须先过**才能 L3+L4。

### 5.4 服务器最低安全基线

- 改 root 密码
- 加 SSH key + 关密码登录
- 改 SSH 端口（可选，减小爆破）
- 防火墙只放 22/80/443
- 自动安全更新（`unattended-upgrades`）

---

## 六、参考链接

- LE rate limits: https://letsencrypt.org/docs/rate-limits/
- acme.sh DNS-01 文档: https://github.com/acmesh-official/acme.sh/wiki/dnsapi
- DNSPod API 文档（旧版）: https://www.dnspod.cn/docs/records.html
- Vercel DNS 文档: https://vercel.com/docs/concepts/projects/domains
- RFC 6125 (SSL SAN): https://datatracker.ietf.org/doc/html/rfc6125
- RFC 1034 (DNS CNAME 规则): https://datatracker.ietf.org/doc/html/rfc1034#section-3.6.2
