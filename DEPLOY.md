# Valerius 上线步骤

这个网页现在是一个纯静态网站，最简单的上线方式是用 GitHub Pages。

## 你已经有的内容

- 网页入口：`index.html`
- 样式：`styles.css`
- 交互逻辑：`app.js`
- 自定义域名：`zjm.us.ci`
- 域名配置文件：`CNAME`

## 推荐上线方式

推荐使用 GitHub Pages，原因是：

- 免费
- 适合当前这个静态网页
- 支持绑定你自己的域名
- 后续改内容后重新上传代码就能更新

## 第一步：创建 GitHub 仓库

1. 登录 GitHub
2. 新建一个仓库，比如 `valerius-site`
3. 把当前文件夹里的文件上传到仓库根目录

需要上传的文件：

- `index.html`
- `styles.css`
- `app.js`
- `CNAME`

## 第二步：开启 GitHub Pages

1. 打开 GitHub 仓库
2. 进入 `Settings`
3. 点击左侧 `Pages`
4. 在 `Build and deployment` 里选择：
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
5. 保存

几分钟后，GitHub 会生成一个默认网址，例如：

`https://你的用户名.github.io/valerius-site/`

## 第三步：绑定你的域名

因为你要绑定的是 `zjm.us.ci`，它是一个子域名，通常只需要在你的域名服务商后台添加一条 `CNAME` 记录。

记录建议如下：

- 类型：`CNAME`
- 主机记录：`zjm`
- 目标值：`你的GitHub用户名.github.io`

如果你的域名控制台要求你填完整域名，也可能写成：

- `zjm.us.ci` -> `你的GitHub用户名.github.io`

## 第四步：在 GitHub Pages 填入域名

1. 回到仓库 `Settings > Pages`
2. 在 `Custom domain` 中填入：

`zjm.us.ci`

3. 保存
4. 等待 HTTPS 证书生效

## 上线后怎么更新

以后你要更新页面内容，只需要：

1. 修改本地文件
2. 重新上传到 GitHub 仓库
3. GitHub Pages 会自动更新网站

## 当前版本的限制

现在这个原型里，商品数据保存在浏览器本地，不是真正的后台数据库。

这意味着：

- 你自己电脑上新增的商品，别人看不到
- 换浏览器或换设备，数据不会同步

## 下一步最值得做的升级

如果你要“真正商用”，下一步应该把商品数据改成云端存储：

- 加一个真正后台登录页
- 商品上传后保存到数据库
- 图片上传到云存储
- 顾客打开网址时能看到你最新上传的商品

## 推荐的第二阶段

建议升级为：

- 前台展示站
- 管理后台
- 商品数据库
- 图片上传功能
- 域名正式接入 `zjm.us.ci`

这样它才会从“原型网页”变成“真正能运营的网站”。
