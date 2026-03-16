# Valerius 微信小程序操作指南

这份说明按小白视角来写，你照着一步一步做就行。

## 1. 先准备什么

你现在已经有：

- 已上线网页版
- 已配置好的 Supabase
- 小程序项目骨架目录：`miniapp`

你接下来需要：

1. 注册微信小程序账号
2. 下载微信开发者工具
3. 把 `miniapp` 导入开发者工具
4. 填好小程序的 `AppID`
5. 填好 Supabase 的 publishable key
6. 预览
7. 上传代码
8. 去微信公众平台提交审核并发布

## 2. 注册小程序账号

官方入口：
[微信公众平台](https://mp.weixin.qq.com/)

如果你还没有小程序账号：

1. 打开上面的网址
2. 选择注册
3. 选择“小程序”
4. 按平台要求填写主体信息

提示：

- 如果以后你想正式上架，一般需要完成主体认证
- 有些能力和发布流程会和主体类型有关

## 3. 下载微信开发者工具

官方地址：
[微信开发者工具下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

下载并安装后登录。

## 4. 打开本地小程序项目

你的小程序项目目录已经在这里：

[miniapp](C:\Users\jiami\Documents\Playground\miniapp)

在微信开发者工具里这样做：

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择：
   `C:\Users\jiami\Documents\Playground\miniapp`
4. 如果你已经有正式小程序 `AppID`，就填正式的
5. 如果还没有，也可以先用测试号或开发环境方式预览

## 5. 先改两个配置

### 5.1 修改 AppID

打开：
[project.config.json](C:\Users\jiami\Documents\Playground\miniapp\project.config.json)

把：

```json
"appid": "touristappid"
```

改成你自己的小程序 `AppID`。

### 5.2 修改 Supabase key

打开：
[config.js](C:\Users\jiami\Documents\Playground\miniapp\config.js)

把：

```js
supabaseAnonKey: "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
```

替换成你自己的 `Publishable key`。

注意：

- 只能填 `Publishable key`
- 不能填 `Secret key`

## 6. 小程序里需要看到什么

这个骨架已经做了 4 个页面：

- 首页：`pages/home/home`
- 商品列表：`pages/catalog/catalog`
- 商品详情：`pages/detail/detail`
- 购物车：`pages/cart/cart`

它现在支持：

- 商品展示
- 分类筛选
- 快捷筛选
- 商品详情
- 加入购物车

## 7. 配置合法域名

如果小程序要请求 Supabase 接口，你必须去微信公众平台后台配置合法域名。

微信官方文档：
[网络请求合法域名](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)

你要重点配置：

- `request` 合法域名

通常你需要加入类似：

`https://iyhaubxubytefdrrdvad.supabase.co`

注意：

- 必须是 HTTPS
- 域名要和小程序实际请求的域名一致

## 8. 如何在开发者工具里预览

导入项目并填好配置后：

1. 点击“编译”
2. 看模拟器里页面是否正常加载
3. 用手机微信扫码预览

如果加载失败：

- 先检查 `config.js` 是否填了正确 key
- 再检查微信后台是否合法域名已配置

## 9. 如何上传代码

开发者工具里完成测试后：

1. 点击右上角“上传”
2. 填版本号
3. 填版本说明
4. 上传成功

然后去微信公众平台后台：

1. 打开“小程序后台”
2. 找到“版本管理”
3. 选中刚上传的版本
4. 提交审核
5. 审核通过后发布

## 10. 你现在最应该怎么做

推荐顺序：

1. 先在微信开发者工具里导入 `miniapp`
2. 改 `project.config.json` 里的 `AppID`
3. 改 `config.js` 里的 `Publishable key`
4. 在微信公众平台后台配置合法域名
5. 编译预览
6. 如果没问题，再上传代码

## 11. 你现在需要上传到 GitHub 吗

不需要。

这个 `miniapp` 项目是给微信开发者工具用的，不是给 GitHub Pages 用的。

网页版和小程序是两套前端，但可以共用同一个 Supabase 数据源。
