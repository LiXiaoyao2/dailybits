# DailyBits Docker Compose 部署

DailyBits 可以放在一个 Docker Compose 栈里运行：`db` 提供 PostgreSQL，`migrate` 负责一次性执行 Prisma migration，`app` 提供网页和 API，`scheduler` 负责定时推送。

## 服务依赖

| 服务 | 作用 | 备注 |
| --- | --- | --- |
| `db` | PostgreSQL 16 | 数据卷为 `postgres_data` |
| `migrate` | 执行 `prisma migrate deploy` | `app` 和 `scheduler` 会等待它完成 |
| `app` | Next.js Web/API | 对外暴露 `3000` |
| `scheduler` | 每分钟扫描订阅并推送 | 默认按 `Asia/Shanghai` 和中国工作日规则运行 |

## 首次部署

```bash
cp .env.example .env
docker compose up --build -d
```

`.env` 里至少要确认这些值：

- `AUTH_MODE=gateway`：生产环境必须走 Auth Hub 网关注入的用户头。
- `ADMIN_USER_IDS`：管理员用户 ID，多个值用逗号分隔。
- `POSTGRES_PASSWORD`：如果用内置 PostgreSQL，部署前建议改成强密码。
- `LLM_API_KEY`：需要 AI 生成题目或摘要时填写。
- `PUSH_PROVIDER`、`CARD_SERVICE_API_BASE`、`MESSAGING_API_BASE_URL`、`INNER_API_BASE_URL`：按实际卡片服务和公司 Messaging/Inner API 地址填写。
- `CARD_SERVICE_EVENT_SECRET`：card-service 回调答题结果时的共享密钥，生产环境建议必须配置。

默认 Compose 会把应用和调度器的 `DATABASE_URL` 指向同栈数据库：

```text
postgresql://postgres:postgres@db:5432/dailybits?schema=public
```

如果你修改了 `POSTGRES_DB`、`POSTGRES_USER` 或 `POSTGRES_PASSWORD`，推荐同时设置 `DOCKER_DATABASE_URL`，确保用户名、密码和库名一致。密码里如果包含 `@`、`:`、`/` 等字符，需要在 URL 中做百分号编码。

Dockerfile 默认使用国内 apt/npm 镜像。海外 CI 或私有网络可以通过 build args 覆盖：

```bash
docker build \
  --build-arg APT_MIRROR=http://deb.debian.org/debian \
  --build-arg APT_SECURITY_MIRROR=http://deb.debian.org/debian-security \
  --build-arg NPM_REGISTRY=https://registry.npmjs.org \
  -t dailybits .
```

## 从旧库导入数据

导入时先不要启动 `app` 和 `scheduler`，尤其是 `scheduler`，避免迁移中途触发推送。

```bash
docker compose up -d db
```

从旧库导出：

```bash
pg_dump "$OLD_DATABASE_URL" -Fc --no-owner --no-acl -f dailybits.dump
```

导入到新容器：

```bash
docker compose cp dailybits.dump db:/tmp/dailybits.dump
docker compose exec db pg_restore --clean --if-exists --no-owner --no-acl -U postgres -d dailybits /tmp/dailybits.dump
docker compose run --rm migrate
docker compose up -d app scheduler
```

如果你在 `.env` 中改了库名或用户，请同步替换 `pg_restore -U ... -d ...` 参数。

## 迁移注意事项

- 保留原有主键 ID。题目卡片的答题回调会用 `Question.id` 作为业务标识，导入时不要重新生成题目 ID。
- 导入完成后先看 `app` 日志，再启动或恢复 `scheduler`。
- 如果旧库和当前 Prisma schema 不完全一致，先还原到空库，再运行 `docker compose run --rm migrate` 补齐结构。
- 生产环境不要使用 `.env.example` 里的默认密码和空密钥。

## 常用命令

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f scheduler
docker compose restart app scheduler
docker compose down
```

删除整个数据库卷：

```bash
docker compose down -v
```
