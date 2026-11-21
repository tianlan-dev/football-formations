# 仓库协作规范

遵循上级仓库的协作规范 `../AGENTS.md`。

本应用补充说明：

- 只在 Mac mini 本地维护和发布，不再使用 Grok Build 或 Vercel。
- 技术栈：TanStack Start（Vite + React），Tailwind CSS v4，Nitro `node-server` preset。
- 应用代码在 `src/`：页面路由 `src/routes/`，组件 `src/components/`，阵型数据 `src/data/formations.ts`。
  `src/routeTree.gen.ts` 由 TanStack Router 插件自动生成，不要手工编辑。
- 没有数据库、没有登录、没有服务端写接口；用户选择的阵型只保存在浏览器 `localStorage`。
  应用对公网开放（`football.skylan.dev`），新增服务端接口或持久数据前先和用户确认。
- 提交前运行 `npm run typecheck`、`npm run lint`、`npm test` 和 `npm run build`。
- 发布：在根仓库运行 `./manage-webapps.sh prod restart football-formations`。
