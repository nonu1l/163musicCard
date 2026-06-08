# NetEase Cloud Music Card

在 GitHub 个人主页展示网易云音乐最近播放和一周播放排行。

## 卡片预览

### Classic 

**Dark**

<p><img src="./cards/classic/dark-large.svg" width="960" alt="classic dark large" /></p>

<p><img src="./cards/classic/dark-medium.svg" width="620" alt="classic dark medium" /></p>

<p><img src="./cards/classic/dark-small.svg" width="320" alt="classic dark small" /></p>

**Light**

<p><img src="./cards/classic/light-large.svg" width="960" alt="classic light large" /></p>

<p><img src="./cards/classic/light-medium.svg" width="620" alt="classic light medium" /></p>

<p><img src="./cards/classic/light-small.svg" width="320" alt="classic light small" /></p>

### Classic Weekly Rank

**Dark**

<p><img src="./cards/classic-weekly-rank/dark-large.svg" width="960" alt="classic weekly rank dark large" /></p>

<p><img src="./cards/classic-weekly-rank/dark-medium.svg" width="620" alt="classic weekly rank dark medium" /></p>

<p><img src="./cards/classic-weekly-rank/dark-small.svg" width="320" alt="classic weekly rank dark small" /></p>

**Light**

<p><img src="./cards/classic-weekly-rank/light-large.svg" width="960" alt="classic weekly rank light large" /></p>

<p><img src="./cards/classic-weekly-rank/light-medium.svg" width="620" alt="classic weekly rank light medium" /></p>

<p><img src="./cards/classic-weekly-rank/light-small.svg" width="320" alt="classic weekly rank light small" /></p>

### Classic Dynamic

最近有播放记录时显示 `classic`，没有最近播放时显示 `classic-weekly-rank`。

**Dark**

<p><img src="./cards/classic-dynamic/dark-large.svg" width="960" alt="classic dynamic dark large" /></p>

<p><img src="./cards/classic-dynamic/dark-medium.svg" width="620" alt="classic dynamic dark medium" /></p>

<p><img src="./cards/classic-dynamic/dark-small.svg" width="320" alt="classic dynamic dark small" /></p>

**Light**

<p><img src="./cards/classic-dynamic/light-large.svg" width="960" alt="classic dynamic light large" /></p>

<p><img src="./cards/classic-dynamic/light-medium.svg" width="620" alt="classic dynamic light medium" /></p>

<p><img src="./cards/classic-dynamic/light-small.svg" width="320" alt="classic dynamic light small" /></p>

### Apple Music

<p><img src="./cards/apple-music/light-large.svg" width="960" alt="apple music light large" /></p>

<p><img src="./cards/apple-music/light-medium.svg" width="620" alt="apple music light medium" /></p>

<p><img src="./cards/apple-music/light-small.svg" width="320" alt="apple music light small" /></p>

## 使用说明

1. Fork 本仓库。
2. 将代码 Clone 到本地（需提前安装 Node.js 环境）。
3. 安装依赖：`npm install`。
4. 运行 `npm run login` 进行扫码登录。
5. 登录成功后，将 `.env.local` 中的字段添加到仓库的 Actions Secret：
   - 进入 Fork 后的仓库，依次点击 **Settings → Secrets and variables → Actions → Repository secrets → New repository secret**。
   - 添加 `MUSIC_U`：对应 `.env.local` 中 `MUSIC_U=` 后面的值。
   - 添加 `NETEASE_COOKIE`：对应 `.env.local` 中 `NETEASE_COOKIE=` 后面的整段值。
6. 在 Actions 页面手动运行 `Update NetEase Cloud Music`。定时任务每 30 分钟获取一次你的网易云听歌信息。

运行成功后，SVG 会生成到 `cards/` 目录并自动提交。

## 嵌入到个人主页

把需要的 SVG 放到 GitHub Profile README 里即可：

```md
<img src="https://raw.githubusercontent.com/你的用户名/仓库名/main/cards/classic-dynamic/light-large.svg" width="960" alt="NetEase Cloud Music Card" />
```

如果仓库名就是你的 GitHub 用户名，也可以使用相对路径：

```md
<img src="./cards/classic-dynamic/light-large.svg" width="960" alt="NetEase Cloud Music Card" />
```

明暗主题可以使用 `picture`：

```md
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./cards/classic-dynamic/dark-large.svg">
  <source media="(prefers-color-scheme: light)" srcset="./cards/classic-dynamic/light-large.svg">
  <img src="./cards/classic-dynamic/light-large.svg" width="960" alt="NetEase Cloud Music Card">
</picture>
```

## 卡片尺寸

- `large`: `960x260`
- `medium`: `620x220`
- `small`: `320x460`

## 开发指南

### 构建 / 预览 
- 卡片脚本文件放在 `scripts/cards/`
- 构建：`npm run generate-cards` 构建时会扫描这个目录，每个文件生成一套卡片。
- 预览：`npm run preview` 会扫描 cards 目录下的所有SVG图片
  - 如果只想预览部分卡片，则在 preview-server.js 文件中配置 EXCLUDED_DIR_PREFIXES


### 动态卡片原理及思路
Actions 每轮会读取并写入 data/listening-state.json，里面包含：
```json
{
  "generatedAt": "构建时间",
  "latestSongId": "最近播放第一首歌曲 id",
  "weekPlayMinutes": "本周播放分钟数",
  "stateSignature": "歌曲id:周播放分钟数",
  "previousSignature": "上一轮签名",
  "stableBuildCount": "连续未变化轮数",
  "isRecentlyPlaying": true
}
```
#### 判断规则为：
1. latestSongId + weekPlayMinutes 组成状态签名 
2. 和上一轮一样：stableBuildCount + 1 
3. 和上一轮不一样：stableBuildCount = 1 
4. 连续 3 轮不变：isRecentlyPlaying = false 
5. classic-dynamic 会因此切换到周排行卡片

## 致谢

本项目得以实现，离不开以下开源项目：

- [NeteaseCloudMusicApi](https://www.npmjs.com/package/NeteaseCloudMusicApi)：网易云音乐 API 封装，本项目获取歌曲信息、最近播放、周排行的核心依赖。
- [kgnio/github-profile-stats-card](https://github.com/kgnio/github-profile-stats-card)：部分卡片主题的灵感与设计参考。
