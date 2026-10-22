# Jev 模型演示（EasyGateway）

一个纯静态的单页 Demo，通过 OpenAI 兼容接口调用本机 [EasyGateway](http://127.0.0.1:4001)
上的 **Jev 1.13** 模型（`jev-1.13`）。

**在线地址**：<https://hwj123hwj.github.io/jev-demo/>

## 使用前提

| 条件 | 说明 |
| --- | --- |
| 网关在线 | github.io 上的页面只能在你自己电脑的浏览器里连到 `127.0.0.1:4001`（或你暴露出来的网关地址） |
| API Key | 在页面「⚙ 连接设置」里填入网关 master key，**只保存在你浏览器的 localStorage** |
| opencode 授权 | `jev-1.13` 走 opencode Zen 的**授权档**：需先在网关完成 opencode 渠道设备码登录（管理台 `/admin/dashboard`），否则上游返回 `Workspace selection is required` |

## 为什么不是 jev-1.13-free（免费档）？

- 2026-10-22 实测：opencode Zen 免费池已将访问限制为官方 OpenCode 客户端
  （客户端指纹校验），且 `jev-1.13-free` 这个 id 在上游后端本身处于故障状态
  （三种协议均返回 `ModelProtocolUnsupported`，其它免费模型正常）。
- 因此本演示锁定**付费授权档 `jev-1.13`**：用你自己的账号登录后通过网关正规调用，
  稳定且不依赖对免费池的任何非官方用法。

## 安全说明

- 页面不内嵌、不上传任何密钥；所有请求由浏览器直连你填写的 Base URL。
- 不填 Key、不连网关时，页面是纯静态的"空壳"，对访客无副作用。

## 本地开发

```bash
cd jev-demo
python3 -m http.server 8080   # 或直接双击 index.html
```
