# football-formations（阵线）

切换现代足球常用阵型，查看每个点位的具体位置名称和职责。基于 TanStack Start
（Vite + React），在 Mac mini 本地维护和发布。

- 公网：`https://football.skylan.dev`

## 运行

首次运行先安装依赖：

```bash
npm install
```

本地启动配置放在两个 Git 忽略的环境文件里：

- `.env.production.local`: production Docker 启动配置。
- `.env.development.local`: local development 启动配置。

两个文件都需要定义 `APP_HOST` 和 `APP_PORT`。

### Production in Docker

先创建本地 production 环境文件。这个文件会被 Git 忽略：

```bash
cat > .env.production.local <<'EOF2'
APP_HOST=0.0.0.0
APP_PORT=<production-port>
EOF2
```

然后用 Docker 构建并启动 production container：

```bash
./production-docker.sh
```

镜像分两阶段：构建阶段运行 `npm run build`（Nitro `node-server` preset）生成
`.output/`，运行阶段只带 `.output/` 并执行 `npm run start`。容器使用只读根文件系统、
`--cap-drop ALL`、`no-new-privileges`，重启策略为 `unless-stopped`，端口只发布到
`127.0.0.1`。

应用没有服务端持久数据：没有数据库，用户选择的阵型保存在浏览器 `localStorage`
中，因此容器不挂载数据卷。

### Local Development

先创建本地 development 环境文件。这个文件会被 Git 忽略：

```bash
cat > .env.development.local <<'EOF2'
APP_HOST=127.0.0.1
APP_PORT=<local-dev-port>
EOF2
```

```bash
./development-server.sh
```

development 启动脚本会读取 `.env.development.local`，停止占用同一端口的旧进程，
然后在后台运行 `npm run dev`（Vite 开发服务，支持热更新）。

## 发布流程

1. 改代码，用 `./development-server.sh` 在本地预览。
2. 检查：

   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

3. 提交并推送到 `origin main`。
4. 在根仓库重新构建并替换 production container：

   ```bash
   cd ..
   ./manage-webapps.sh prod restart football-formations
   ```

5. 打开公网和局域网地址确认页面正常。

## Package scripts

- `npm run dev`: 按 `APP_HOST` / `APP_PORT` 启动 Vite 开发服务。
- `npm run build`: 构建到 `.output/`（Nitro `node-server` preset）。
- `npm run start`: 运行 `.output/server/index.mjs`。需要 `APP_PORT`，可选 `APP_HOST`。
- `npm run typecheck`: TypeScript 类型检查。
- `npm run lint` / `npm run format`: ESLint 检查 / Prettier 格式化。
- `npm test`: 阵型数据的单元测试（`src/data/formations.test.ts`）。

## Startup scripts

- `./production-docker.sh [start|stop|restart]`: 读取 `.env.production.local`，构建 Docker image，并替换同名 production container。
- `./development-server.sh [start|stop|restart]`: 读取 `.env.development.local`，停止占用 development 端口的旧进程，然后在后台运行 `npm run dev`。

脚本日志写入 `.server-logs/`，该目录不会提交到 Git。
