文档首页

火山方舟

视频生成 API

创建视频生成任务 API

复制全文

我的收藏
创建视频生成任务 API
POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks    运行​
本文介绍创建视频生成任务 API 的输入输出参数，供您使用接口时查阅字段含义。模型会依据传入的图片及文本信息生成视频，待生成完成后，您可以按条件查询任务并获取生成的视频。​
注意​
Seedance 2.0 模型目前仅支持 控制台体验中心 在免费额度内体验，暂不支持 API 调用，敬请期待。​
不同模型支持的视频生成能力简介​
​
Tips：一键展开折叠，快速检索内容​
​
​
在线调试
鉴权说明
快速入口
​
API Explorer
您可以通过 API Explorer 在线发起调用，无需关注签名生成过程，快速获取调用结果。
去调试
​
​
​
​
请求参数 ​
跳转 响应参数​
请求体​
​
​
model string 必选​
您需要调用的模型的 ID （Model ID），开通模型服务，并查询 Model ID 。​
您也可通过 Endpoint ID 来调用模型，获得限流、计费类型（前付费/后付费）、运行状态查询、监控、安全等高级能力，可参考获取 Endpoint ID。​
​
​
content object[] 必选​
输入给模型，生成视频的信息，支持文本、图片和视频（样片，Draft 视频）格式。支持以下几种组合：​
文本​
文本+图片​
视频：其中视频指已成功生成的样片视频，模型可基于样片生成高质量正式视频。​
信息类型​
​
​
文本信息 object​
输入给模型生成视频的内容，文本内容部分。​
属性​
​
​
​
图片信息 object​
输入给模型生成视频的内容，图片信息部分。​
属性​
​
​
​
样片信息new  object​
基于样片任务 ID，生成正式视频。仅 Seedance 1.5 pro 支持该功能。阅读文档 获取 draft 功能的使用创作台和注意事项。​
属性​
​
​
​
​
callback_url string ​
填写本次生成任务结果的回调通知地址。当视频生成任务有状态变化时，方舟将向此地址推送 POST 请求。​
回调请求内容结构与查询任务API的返回体一致。​
回调返回的 status 包括以下状态：​
queued：排队中。​
running：任务运行中。​
succeeded： 任务成功。（如发送失败，即5秒内没有接收到成功发送的信息，回调三次）​
failed：任务失败。（如发送失败，即5秒内没有接收到成功发送的信息，回调三次）​
expired：任务超时，即任务处于运行中或排队中状态超过过期时间。可通过 execution_expires_after 字段设置过期时间。​
​
​
return_last_frame boolean 默认值 false​
true：返回生成视频的尾帧图像。设置为 true 后，可通过 查询视频生成任务接口 获取视频的尾帧图像。尾帧图像的格式为 png，宽高像素值与生成的视频保持一致，无水印。​
使用该参数可实现生成多个连续视频：以上一个生成视频的尾帧作为下一个视频任务的首帧，快速生成多个连续视频，调用示例详见 创作台。​
false：不返回生成视频的尾帧图像。​
​
​
service_tier string 默认值 default​
不支持修改已提交任务的服务等级​
指定处理本次请求的服务等级类型，枚举值：​
default：在线推理模式，RPM 和并发数配额较低（详见 模型列表），适合对推理时效性要求较高的场景。​
flex：离线推理模式，TPD 配额更高（详见 模型列表），价格为在线推理的 50%， 适合对推理时延要求不高的场景。​
​
​
execution_expires_after integer 默认值 172800​
任务超时阈值。指定任务提交后的过期时间（单位：秒），从 created at 时间戳开始计算。默认值 172800 秒，即 48 小时。取值范围：[3600，259200]。​
不论使用哪种 service_tier，都建议根据业务场景设置合适的超时时间。超过该时间后任务会被自动终止，并标记为expired状态。​
​
​
generate_audionew boolean 默认值 true​
仅 Seedance 1.5 pro 支持​
控制生成的视频是否包含与画面同步的声音。​
true：模型输出的视频包含同步音频。Seedance 1.5 pro 能够基于文本提示词与视觉内容，自动生成与之匹配的人声、音效及背景音乐。建议将对话部分置于双引号内，以优化音频生成效果。例如：男人叫住女人说：“你记住，以后不可以用手指指月亮。”​
false：模型输出的视频为无声视频。​
​
​
draftnew boolean 默认值 false​
仅 Seedance 1.5 pro 支持​
控制是否开启样片模式。阅读文档 获取使用创作台和注意事项。​
true：开启样片模式，生成一段预览视频，快速验证场景结构、镜头调度、主体动作与 prompt 意图是否符合预期。消耗 token 数较正常视频更少，使用成本更低。​
false：关闭样片模式，正常生成一段视频。​
说明​
开启样片模式后，将使用 480p 分辨率生成 Draft 视频（使用其他分辨率会报错），不支持返回尾帧功能，不支持离线推理功能。​
​
​
部分参数升级说明​
对于 resolution、ratio、duration、frames、seed、camera_fixed、watermark 参数，平台升级了参数传入方式，示例如下。Seedance 1.0-1.5 系列模型依然兼容支持旧方式。​
不同模型，可能对应支持不同的参数与取值，详见 输出视频格式。当输入的参数或取值不符合所选的模型时，该参数将被忽略或触发报错：​
新方式：在 request body 中直接传入参数。此方式为强校验，若参数填写错误，模型会返回错误提示。 ​
旧方式：在文本提示词后追加 --[parameters]。此方式为弱校验，若参数填写错误，模型将自动使用默认值且不会报错。​
新方式（推荐）：在 request body 中直接传入参数​
​
... ​
   // Specify the aspect ratio of the generated video as 16:9, duration as 5 seconds, resolution as 720p, seed as 11, and include a watermark. The camera is not fixed. ​
    "model": "doubao-seedance-1-5-pro-251215", ​
    "content": [ ​
        { ​
            "type": "text", ​
            "text": "小猫对着镜头打哈欠" ​
        } ​
    ], ​
    // All parameters must be written in full; abbreviations are not supported ​
    "resolution": "720p", ​
    "ratio":"16:9", ​
    "duration": 5, ​
    // "frames": 29, Either duration or frames is required ​
    "seed": 11, ​
    "camera_fixed": false, ​
    "watermark": true ​
... ​
​
​
​
旧方式：在文本提示词后追加 --[parameters]​
​
​
​
resolution  string ​
Seedance 1.5 pro、Seedance 1.0 lite 默认值：720p​
Seedance 1.0 pro & pro-fast 默认值：1080p​
视频分辨率，枚举值：​
480p​
720p​
1080p：参考图场景不支持​
​
​
ratio string ​
文生视频：默认值 16:9（ Seedance 1.5 Pro 默认值为 adaptive）​
图生视频：默认值 adaptive（参考图生视频场景默认值为 16:9）​
生成视频的宽高比例。不同宽高比对应的宽高像素值见下方表格。​
16:9 ​
4:3​
1:1​
3:4​
9:16​
21:9​
adaptive：根据输入自动选择最合适的宽高比（详见下文说明）​
adaptive 适配规则​
当配置 ratio 为 adaptive 时，模型会根据生成场景自动适配宽高比；实际生成的视频宽高比可通过 查询视频生成任务 API 返回的 ratio 字段获取。​
文生视频场景：根据输入的提示词，自动选择最合适的宽高比（仅 Seedance 1.5 Pro 支持）。​
图生视频场景：​
参考图生视频：不支持配置 ratio 为 adaptive。​
首帧 / 首尾帧生视频：根据上传的首帧图片比例，自动选择最合适的宽高比。​
不同宽高比对应的宽高像素值​
Note：图生视频，选择的宽高比与您上传的图片宽高比不一致时，方舟会对您的图片进行裁剪，裁剪时会居中裁剪，详细规则见 图片裁剪规则。​
​
分辨率​
宽高比​
​
宽高像素值​
Seedance 1.0 系列​
宽高像素值​
Seedance 1.5 pro​
480p​
16:9​
864×480​
864×496​
4:3​
736×544​
752×560​
1:1​
640×640​
640×640​
3:4​
544×736​
560×752​
9:16​
480×864​
496×864​
21:9​
960×416​
992×432​
720p​
16:9​
1248×704​
1280×720​
4:3​
1120×832​
1112×834​
1:1​
960×960​
960×960​
3:4​
832×1120​
834×1112​
9:16​
704×1248​
720×1280​
21:9​
1504×640​
1470×630​
1080p ​
1.0 lite 参考图场景不支持​
16:9​
1920×1088​
1920×1080​
4:3​
1664×1248​
1664×1248​
1:1​
1440×1440​
1440×1440​
3:4​
1248×1664​
1248×1664​
9:16​
1088×1920​
1080×1920​
21:9​
2176×928​
2206×946​
​
​
​
​
​
duration integer 默认值 5 ​
duration 和 frames 二选一即可，frames 的优先级高于 duration。如果您希望生成整数秒的视频，建议指定 duration。​
生成视频时长，单位：秒。支持 2~12 秒。​
注意​
Seedance 1.5 pro 支持两种配置方法​
指定具体时长：支持 [4,12] 范围内的任一整数。​
不指定具体生成时长：设置为 -1，表示由模型在 [4,12] 范围内自主选择合适的视频长度（整数秒）。实际生成视频的时长可通过 查询视频生成任务 API 返回的 duration 字段获取。注意视频时长与计费相关，请谨慎设置。​
​
​
frames integer ​
Seedance 1.5 pro 暂不支持​
duration 和 frames 二选一即可，frames 的优先级高于 duration。如果您希望生成小数秒的视频，建议指定 frames。​
生成视频的帧数。通过指定帧数，可以灵活控制生成视频的长度，生成小数秒的视频。​
由于 frames 的取值限制，仅能支持有限小数秒，您需要根据公式推算最接近的帧数。​
计算公式：帧数 = 时长 × 帧率（24）。​
取值范围：支持 [29, 289] 区间内所有满足 25 + 4n 格式的整数值，其中 n 为正整数。​
例如：假设需要生成 2.4 秒的视频，帧数=2.4×24=57.6。由于 frames 不支持 57.6，此时您只能选择一个最接近的值。根据 25+4n 计算出最接近的帧数为 57，实际生成的视频为 57/24=2.375 秒。​
​
​
seed integer 默认值 -1 ​
种子整数，用于控制生成内容的随机性。​
取值范围：[-1, 2^32-1]之间的整数。​
注意​
相同的请求下，模型收到不同的seed值，如：不指定seed值或令seed取值为-1（会使用随机数替代）、或手动变更seed值，将生成不同的结果。​
相同的请求下，模型收到相同的seed值，会生成类似的结果，但不保证完全一致。​
​
​
camera_fixed boolean 默认值 false ​
参考图场景不支持​
是否固定摄像头。枚举值：​
true：固定摄像头。平台会在用户提示词中追加固定摄像头，实际效果不保证。​
false：不固定摄像头。​
​
​
watermark boolean 默认值 false ​
生成视频是否包含水印。枚举值：​
false：不含水印。​
true：含有水印。​
​
​
响应参数​
跳转 请求参数​
id string​
视频生成任务 ID 。仅保存 7 天（从 created at 时间戳开始计算），超时后将自动清除。​
设置"draft": true，为 Draft 视频任务 ID。​
设置 "draft": false，为正常视频任务 ID。​
创建视频生成任务为异步接口，获取 ID 后，需要通过 查询视频生成任务 API 来查询视频生成任务的状态。任务成功后，会输出生成视频的video_url。​
​
文生视频
有声视频-首帧
有声视频-首尾帧
seedance-lite-参考图
图生视频-base64编码
request

curl -X POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedance-1-0-pro-250528",
    "content": [
        {
            "type": "text",
            "text": "写实风格，晴朗的蓝天之下，一大片白色的雏菊花田，镜头逐渐拉近，最终定格在一朵雏菊花的特写上，花瓣上有几颗晶莹的露珠"
        }
    ],
    "ratio": "16:9",
    "duration": 5,
    "watermark": false
}'
response

{
  "id": "cgt-2025******-****"
}


