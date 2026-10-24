# Jev · System One 演示

通过 [EasyGateway](https://github.com/nightgopher/litellm-gateway) 的 `POST /v1/systemone` 调用 Jev，输入 `state + questions`，展示 `noul`、`choice`、`score` 答案、概率和原始 JSON。

**在线地址**：[nightgopher.github.io/jev-demo](https://nightgopher.github.io/jev-demo/)

## 运行

1. 使用 EasyGateway **v0.3.9 或更新版本**，并更新其 `providers.yaml` 中的 Jev 配置。
2. 打开演示页，填入本机 `http://127.0.0.1:4001/v1` 或 mini 等可达网关地址，以及网关 API Key。
3. 检测连接，选择模型，编辑待判断内容和问题 JSON，点击“开始评估”。

网关地址中的 `127.0.0.1` 指浏览器所在电脑。浏览器可能要求允许访问本地网络，网关也需要允许页面来源的 CORS；在线页的来源是 `https://nightgopher.github.io`。

## 示例场景

页面提供 8 个完整场景：客服工单分诊、线上告警核实、邮件意图分类、商品评价分析、发布说明检查、搜索相关性评分、缺陷报告完整性、工作流下一步决策；另有 Noul、Choice、Score 三个基础示例。

每个例子都包含待判断内容、问题定义和结果解读提示。选择后点击“载入示例”，会一并替换 `state` 与 `questions`、清空旧结果；网关地址、Key 和模型选择保持当前设置，不会自动调用模型。可编辑后再点击“开始评估”。示例只展示输入与判断方法，返回值以实际推理为准，工作流示例不会执行任何动作。

## 模型与授权

- `jev-1.13-free` 使用上游免费额度。额度耗尽时展示真实 `429` 错误，不会自动转为付费请求。
- `jev-1.13` 需要在**网关服务器**的受保护 `.env` 配置 `OPENCODE_API_KEY`，再重启服务。它是选择了工作区的 OpenCode Console API Key，设备码 OAuth 登录不能替代。服务端 Key 不交给浏览器。
- 目录中出现模型只说明已经注册，不代表授权、额度或推理已验证。检测连接会检查 `protocol: systemone`，成功评估则必须收到 `answers`。

实现依据 [OpenCode Jev 协议](https://opencode.ai/v2/docs/console/models/#jev) 和 [TypeSafe 快速开始](https://docs.typesafe.ai/introduction/quickstart)，调用网关后由服务端转发到 `https://opencode.ai/inference/systemone/v1/systemone`。

```json
{"model":"jev-1.13-free","state":"支付连续失败三天，客户无法下单。","questions":{"is_urgent":{"type":"noul","instructions":"是否需要紧急处理？"}}}
```

## 密钥与数据

网关 Key 只保存在当前页面内存，刷新后清空。浏览器只持久化网关地址和模型选项；升级会从旧版设置记录移除曾保存的 Key。请求直接发往所填网关，不使用第三方脚本，也不把问题或答案保存到浏览器存储。网关可能按其归档配置保存请求，保留策略由网关管理员控制。

## 本地开发与测试

无需安装依赖或打包：

```bash
python3 -m http.server 8080
node --test tests/*.test.cjs
```

自动测试覆盖原生请求契约、问题校验、错误类型、结果完整性。浏览器验证和真实上游测试分别记录，授权或额度错误不能写成推理成功。
