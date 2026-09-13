# InnOSeed Landing — 运维 Runbook

> 日常部署 / DNS / 应急回滚 的唯一真源。最后更新：2026-08-29。
> 初次配置（从零搭建）见同目录 `README.md`；本文件专注"现在跑着什么 + 怎么动它 + 挂了怎么办"。

## 0. 速查

| 想做 | 怎么做 |
| --- | --- |
| 部署新版本 | `./deploy/deploy.sh` |
| 改 nginx 配置 | 编辑 `deploy/nginx.innoseed.conf` → `cat … \| ssh … 'cat > /etc/nginx/sites-available/innoseed.conf && nginx -t && systemctl reload nginx'` |
| 改 DNS 记录 | Vercel dashboard → innoseed-landing → Settings → DNS Records |
| 看服务器状态 | `ssh root@8.210.122.152 'systemctl status nginx && free -h && df -h /'` |
| 看错误日志 | `ssh root@8.210.122.152 'tail -50 /var/log/nginx/innoseed.error.log'` |
| 手动续期 SSL | `ssh root@8.210.122.152 '/root/.acme.sh/acme.sh --renew -d innoseed.club --force'` |
| **ECS 过期 / 挂了** | 切回 Vercel（详见 §4.1）|
| 联系 ECS 主机 | `ssh root@8.210.122.152`（使用 SSH key，**禁用密码登录**）|

## 1. 当前架构（2026-08-29 之后）

```
用户访问 innoseed.club
  → DNS (Vercel) 解析到 8.210.122.152
    → 阿里云 ECS 香港（Debian 13, 2C1G 100Mbps）
      → nginx serve /var/www/innoseed/ 静态
      → /api/* 反代 https://innoseed-landing.vercel.app/api/

备份链路：innoseed-landing.vercel.app (Vercel)
  → ECS 故障 / 过期时手动切回
```

**为什么不分线**：域名注册商 Porkbun 我们没控制权（见 §6.1），没法迁 NS 到支持分线路的 DNS（DNSPod / Cloudflare）。当前**所有用户都解析到 ECS**，海外延迟比 Vercel 全球 CDN 略高。

## 2. 资源清单

| 资源 | 位置 / 值 |
| --- | --- |
| 域名 | `innoseed.club` + `www.innoseed.club` + `minicamp.innoseed.club` |
| 注册商 | Porkbun（**无控制权**，详见 §6.1） |
| DNS 服务 | Vercel DNS（`vercel-dns.com`） |
| ECS | `8.210.122.152` 香港 / Debian 13 / 900Mi RAM / 17G 磁盘 |
| 静态 | `/var/www/innoseed/`（60 文件 / 3.1MB，rsync 自本地 dist/） |
| nginx 配置 | `/etc/nginx/sites-available/innoseed.conf` |
| SSL 证书 | `/etc/nginx/ssl/innoseed.club.{fullchain.cer,key}`（acme.sh 签，stub cert 占位） |
| acme.sh | `/root/.acme.sh/`（git clone 安装，**不是** get.acme.sh） |
| Vercel project | `innoseed-landing` / `prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb` |
| 部署脚本 | `./deploy/deploy.sh`（本地跑） |
| ECS 上脚本 | `/root/install-server.sh` / `/root/deploy.sh`（首次初始化用） |

## 3. 操作历史（2026-08-29 这次做了什么）

### 3.1 ECS 初始化
- `apt install nginx git rsync jq curl ca-certificates cron uuid-runtime`
- `git clone https://github.com/acmesh-official/acme.sh.git` + `./acme.sh --install`（get.acme.sh 在中国路由不稳，改用 git clone）
- 部署 `nginx.innoseed.conf` 到 `/etc/nginx/sites-available/`
- `openssl req -x509` 生成 1 天自签 stub cert 占位（LE 证书签下来后会替换）
- 创建 `/var/www/{innoseed,acme}` + `/etc/nginx/ssl/`

### 3.2 静态部署
- 本地 `pnpm build` 出 `dist/`（Vite，60 文件 / 3.1MB）
- `rsync -avz` 推 ECS（增量，不带 `--delete`，Vite content hash 旧文件不影响功能）
- 清理 macOS 残留（`.DS_Store` / `imgs/.omc/` / `imgs/.omx/`）

### 3.3 DNS 切换
**因 Porkbun 没控制权**，走 Vercel dashboard 直接改 A：
1. Vercel dashboard → innoseed-landing → Settings → Domains → `innoseed.club` → **Remove**（unlink，避免 Vercel 自动重建 CNAME 抢回 DNS）
2. DNS Records 页面删 2 条 CNAME：`www → innoseed-landing.vercel.app.` + `minicamp → 9293a6f6fcfa0256.vercel-dns-017.com.`
3. 加 3 条 A：`@` / `www` / `minicamp` 都指 `8.210.122.152`，TTL=60
4. **保留** 5 条飞书邮件相关记录（TXT 验证 / SPF / DKIM / DMARC + 2 条 MX `mx1/mx2.feishu.cn`）— 一条都别动

### 3.4 未完成项（待办）
- [ ] **DNSPod API Token** — 用户在 DNSPod 控制台创建（`记录列表/创建/修改/删除` 权限）
- [ ] `acme.sh --issue -d innoseed.club -d "*.innoseed.club" --dns dns_dp` 签 wildcard 证书
- [ ] `acme.sh --install-cert` 装到 `/etc/nginx/ssl/` + nginx reload（替换 stub cert）
- [ ] **UptimeRobot 心跳监控**（强烈建议，详见 §5.1）
- [ ] **轮换已泄露的 root 凭据 + 加 SSH key + 禁用密码登录**（详见 §6.2）

## 4. 日常操作

### 4.1 部署新版本

```bash
# 在 innoseed-landing repo 根目录
./deploy/deploy.sh
```

脚本依次：
1. `pnpm build` 出最新 `dist/`
2. `rsync -avz` 推 `dist/` 到 ECS `/var/www/innoseed/`（增量）
3. 远程清理 `.DS_Store` / `.omc/` / `.omx/`
4. `nginx -t && systemctl reload nginx`

部署完验证：
```bash
dig +short innoseed.club @8.8.8.8     # 应返回 8.210.122.152
curl -skI https://innoseed.club/       # 应 200（证书警告先忽略，stub cert）
curl -sk -X POST https://innoseed.club/api/apply -H 'content-type: application/json' -d '{}'  # 应 400（说明 /api/* 反代通了）
```

### 4.2 改 nginx 配置

```bash
# 1. 本地编辑
$EDITOR deploy/nginx.innoseed.conf

# 2. 推上去 + 验证 + reload（用 cat|ssh 避开 scp/rsync 诡异问题）
cat deploy/nginx.innoseed.conf | ssh \
    -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    root@8.210.122.152 \
    'cat > /etc/nginx/sites-available/innoseed.conf && nginx -t && systemctl reload nginx'
```

`nginx -t` 失败就**不要** reload（脚本会卡住），先改好再重试。

### 4.3 改 DNS 记录

Vercel dashboard → innoseed-landing → Settings → DNS Records

| 主机 | 类型 | 值 | 备注 |
| --- | --- | --- | --- |
| @ | A | `8.210.122.152` | 主域 → ECS |
| www | A | `8.210.122.152` | |
| minicamp | A | `8.210.122.152` | |
| （多条）| TXT / MX | 飞书 SPF/DKIM/DMARC/MX | **别动** |

⚠️ Vercel 可能显示 "Invalid Configuration" 警告，**忽略**。Vercel 希望你用它的 CDN，但实际访问按 DNS 解析结果走，没问题。

### 4.4 Vercel 抢回 DNS（如果它又自动加 CNAME）

如果 Vercel 因为项目绑定又自动加了 CNAME 抢回 DNS：
- Settings → Domains → `innoseed.club` → `...` → **Remove**（unlink）
- 回 DNS Records 删 Vercel 自动加的 CNAME / A
- 重新加 3 条 A 记录

## 5. 应急回滚

### 5.1 ECS 过期 / 挂了 → 切回 Vercel（**最重要**）

**触发条件**：ECS 不可达 / 过期 / 被阿里云回收 / 任何原因挂掉。

**操作**（5 分钟，全程 Vercel dashboard，不需要 Porkbun / DNSPod）：
1. 登录 https://vercel.com
2. 顶部选 `innoseed-landing` → **Settings** → **Domains**
3. 选 `innoseed.club` → **Add**（重新 link 域名到 Vercel 项目）
4. Vercel 会自动加：
   - `@` → A 76.76.21.21
   - `www` → CNAME `cname.vercel-dns.com`
   - `minicamp` → CNAME `cname.vercel-dns.com`
5. 回到 **DNS Records** 页面：
   - 删我们手动加的 3 条 A（@ / www / minicamp → 8.210.122.152）
   - **保留** Vercel 自动加的记录 + 飞书 TXT / MX
6. 几分钟后所有用户走 Vercel 边缘，Vercel Function 继续 serve `/api/*`

**前提**：Vercel project `innoseed-landing` 没被删（prj_5AZiomgjCi7Wkf5K1MdgdBD8PEHb）。

**回切到 ECS**（如果新 ECS 上线）：
- 重新 unlink 域名
- 重新加 3 条 A 记录指新 ECS IP
- 装 nginx + 同步 dist/ + reload（参考 README.md 重建流程）

### 5.2 ECS 临时维护

短时间维护（< 5 min）直接重启：
```bash
ssh root@8.210.122.152 'systemctl restart nginx'   # 仅重启 nginx
# 或
ssh root@8.210.122.152 'reboot'                   # 重启整个 ECS
```

长时间维护 / 重建 / 操作系统升级：
- 按 §5.1 切回 Vercel
- 维护完再 unlink + 手动加 A 切回 ECS

### 5.3 SSL 证书过期 / 失效

acme.sh 默认 60 天前自动续。续期日志：
```bash
ssh root@8.210.122.152 'tail -100 /root/.acme.sh/innoseed.club/*.log'
```

手动强制续（如果自动续失败了）：
```bash
ssh root@8.210.122.152 '/root/.acme.sh/acme.sh --renew -d innoseed.club --force'
```

如果 DNSPod API Token 失效了，acme.sh 续期会失败。重新去 DNSPod 控制台拿新 Token，更新 `/root/.acme.sh/account.conf` 里的 `SAVED_DP_Id` / `SAVED_DP_Key`。

### 5.4 /api/* 反代挂了

排查顺序：
```bash
# 1. 看 nginx 错误
ssh root@8.210.122.152 'tail -50 /var/log/nginx/innoseed.error.log'

# 2. 直接测 Vercel Function
curl -I https://innoseed-landing.vercel.app/api/apply
#  → 200/400/500 都说明 Vercel 活着，问题是 ECS → Vercel 链路
#  → 502/503/timeout 说明 Vercel 本身挂了

# 3. ECS 上直接 curl 测反代
ssh root@8.210.122.152 'curl -skI -X POST https://innoseed-landing.vercel.app/api/apply -H "content-type: application/json" -d "{}" -o /dev/null -w "%{http_code} %{time_total}\n"'
```

**应急**：如果 Vercel Function 挂了，临时让 `/api/*` 直接 503：
```nginx
location /api/ {
    return 503 "API temporarily unavailable";
    add_header Retry-After 60;
}
```
改完 `nginx -t && systemctl reload nginx`。等 Vercel 恢复再改回反代。

### 5.5 内存爆了

900Mi 总量紧张时（不应该，正常 nginx + acme.sh < 100Mi）：
```bash
ssh root@8.210.122.152 'free -h && ps aux --sort=-%mem | head -10'
```

如果是 acme.sh 续期时内存峰值撞了，调续期 cron 错峰到凌晨低峰。

## 6. 已知问题 / 限制

### 6.1 Porkbun 没控制权

`innoseed.club` 是别人（学长 / Lab owner）买的，我们没有 Porkbun 账号，没法改 NS。

**影响**：
- ❌ 不能迁 NS 到支持分线路的 DNS（DNSPod / Cloudflare）
- ❌ 全部用户走 ECS 香港，海外延迟略高于 Vercel 全球 CDN
- ✅ 不影响功能，可正常 serve

**治本**（任选其一，长期方案）：
1. **找原注册人**：让 TA 在 Porkbun 改 NS 到 `rabbit.dnspod.net` + `bread.dnspod.net`（5 min），之后走原计划的智能分线
2. **域名转移**：让原注册人解锁域名 + 给 auth code，5-7 天转到 Cloudflare / 阿里云 / 任何用户能控制的注册商
3. **Porkbun 找回账号**：原注册人邮箱重置密码（30 min）

**智能分线路线图**（拿到 NS 控制权后）：
1. Porkbun 改 NS 到 `rabbit.dnspod.net` / `bread.dnspod.net`（NS 切换 10-30 min 生效）
2. DNSPod 加分线解析（9 条）：

   | 主机 | 类型 | 记录值 | 线路 |
   | --- | --- | --- | --- |
   | @ / www / minicamp | A | `8.210.122.152` | 国内 |
   | @ / www / minicamp | CNAME | `cname.vercel-dns.com.` | 海外 |
   | @ / www / minicamp | CNAME | `cname.vercel-dns.com.` | 默认 |

   > CNAME 末尾那个点 `.` 保留。**Vercel 的 CNAME target 用 `cname.vercel-dns.com.`**（通用入口），不要用 `innoseed-landing.vercel.app.`（那是访问 URL 不是 CNAME target）。
3. Vercel dashboard unlink `innoseed.club` + 删 ECS 改的 A 记录
4. ECS nginx 配置**不用改**（它同时 serve 国内和海外来 ECS 的请求）

### 6.2 root 密码暴露

2026-08-29 曾有 root 凭据明文暴露在对话历史里；相关凭据必须轮换，不能继续使用。

**立即做**（强烈建议）：
```bash
# 1. 改密码
ssh root@8.210.122.152 'passwd'

# 2. 本地生成 SSH key
ssh-keygen -t ed25519 -f ~/.ssh/innoseed-ecs -N "" -C "MciG@local → innoseed ECS"

# 3. 把公钥传上去
ssh-copy-id -i ~/.ssh/innoseed-ecs.pub root@8.210.122.152

# 4. 测试 key 登录
ssh -i ~/.ssh/innoseed-ecs root@8.210.122.152 'whoami'  # 应返回 root

# 5. 关掉密码登录
ssh root@8.210.122.152 "sed -i 's/^#\?PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && systemctl restart sshd"

# 6. 验证（断开当前会话，新开一个）
ssh -i ~/.ssh/innoseed-ecs root@8.210.122.152
#  应该不需要密码就能登入
```

之后 `ssh root@8.210.122.152` 改用 `ssh -i ~/.ssh/innoseed-ecs root@8.210.122.152`（或者配 `~/.ssh/config` Host 别名简化）。

### 6.3 智能分线暂不可用

同 §6.1，治本后恢复。

## 7. 监控

### 7.1 强烈建议：UptimeRobot 心跳

- 注册 https://uptimerobot.com（免费版 50 个 monitor）
- 加一个 **HTTPS** monitor：`https://innoseed.club/`
- 间隔 5 min，挂 1 min 触发告警
- 告警渠道：至少邮件 + 微信（Webhook）/ Telegram bot
- ECS 过期 / 挂了 / 证书过期都会触发

### 7.2 服务器自检脚本

```bash
ssh root@8.210.122.152 <<'EOF'
echo "--- nginx ---"
systemctl status nginx | head -5
echo "--- mem ---"
free -h | head -2
echo "--- disk ---"
df -h / | tail -1
echo "--- ports ---"
ss -tlnp | grep -E ":80|:443"
echo "--- dist mtime ---"
ls -la /var/www/innoseed/ | head -3
echo "--- last 5 errors ---"
tail -5 /var/log/nginx/innoseed.error.log
echo "--- cert expiry ---"
openssl x509 -in /etc/nginx/ssl/innoseed.club.fullchain.cer -noout -dates 2>/dev/null || echo "(stub cert, no real LE yet)"
EOF
```

### 7.3 过期提醒

ECS 到期前 7 天 / 1 天各设一个手机日历提醒。提醒文案：

> **InnOSeed ECS 即将到期** — 续费 OR 切回 Vercel（§5.1）。忘记改回 = 域名解析到不可达 IP = 全站挂。

---

## 8. 待办 checklist（每次部署完过一遍）

- [ ] DNSPod API Token 创建 → acme.sh 签 wildcard 证书
- [ ] UptimeRobot 心跳监控
- [ ] 轮换已泄露的 root 凭据 + 加 SSH key + 关密码登录
- [ ] 联系原 Porkbun 注册人（治本 → 智能分线）
- [ ] 设置 ECS 到期日历提醒
