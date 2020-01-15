# 用户模块(Grpc)

基于nestjs的 用户服务，向 duoduo-comic 主程序提供 rpc 接口

## 使用说明

1. 克隆 `master` 分支到本地
2. 安装依赖 `yarn install`
3. 手动创建数据库 `module_user`
4. 修改数据库配置，配置项在 `user.module.ts` 中，只需修改 `host`、`port`、`username`、`password`、`database`  (database 必须为创建好的数据库)
5. - 开发 server，`yarn dev`
   - 启动 server，`yarn start`
