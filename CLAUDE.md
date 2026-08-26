# 佛光尋光記 — 開發指南

純前端視覺小說（HTML + CSS + 原生 JS，無建置步驟、無相依套件），關卡由玩家自由輸入、
交給 Google Gemini 做語意判定。玩法、劇情、金鑰設定、疑難排解見 [README.md](README.md)
——README 是給玩家／老師／自行部署者的文件，這份是開發慣例。

與許慧柔共同創作、MIT 授權。**改動時不要動掉 README 的製作團隊署名與 LICENSE。**

## 上線位置與部署（最容易搞錯的一件事）

**線上網址是 https://play.cornhsu.com/seeking-the-light/**，不是 GitHub Pages。

部署**不從 GitHub 走**，而是由容器腳本從**本機這個資料夾**複製過去組裝：

```powershell
cd D:\網站\_deploy\play
.\deploy.ps1              # 組裝並上線
.\deploy.ps1 -BuildOnly   # 只組裝到 build\，不上線
```

流程是 **本機開發 → 部署上線 → 推 GitHub 備份**。上線的永遠是本機這份，
GitHub（`HSU-YU-MING/seeking-the-light`）是備份不是來源。所以
**commit 了但沒跑 `deploy.ps1` = 線上沒變**，反之亦然。容器細節看
`D:\網站\_deploy\play\README.md`。

- `deploy.ps1` 會從產物刪掉 `*.md` / `.gitattributes` / `.gitignore`，
  免得 README 變成公開可讀的網址。**這份 CLAUDE.md 也在 `*.md` 之列，不會上線。**
  `LICENSE` 沒有副檔名，所以會上線——這是對的，MIT 要求保留授權條款。
- 作品掛在 `/seeking-the-light/` **子路徑**底下，資源路徑一律用相對路徑。
  寫成 `/images/x.webp` 在本機看不出問題，上線後全部 404。目前全站都是相對路徑。
- 遠端的 `gh-pages` 分支**只有一頁轉址**（舊的 `hsu-yu-ming.github.io/seeking-the-light`
  → 新網址）。不要把 `main` 合併過去、也不要拿它當備份。

## 金鑰架構是刻意的，不要「順手簡化」

這是**純前端**網頁，任何寫進原始碼的金鑰都是公開的。所以：

- **金鑰一律由使用者在網頁上輸入**，2.1 版已經把 `config.js` 整個移除。
  絕對不要為了測試方便把金鑰寫死在 `game.js`、也不要新增任何 `config.js` / `.env`。
  （`.gitignore` 結尾那段註解就是在講這件事。）
- **金鑰放在 `x-goog-api-key` header，不放 URL query。** 放 URL 會漏進瀏覽器歷史、
  referrer 與各層日誌。`callOnce()` 與 `resolveModel()` 兩處都是 header，別改掉。
- 儲存分兩種：勾「記住金鑰」→ `localStorage`（`foguang_api_key` +
  `foguang_api_key_saved_at`，**30 天 TTL**，逾期在 `init()` 自動清掉）；
  不勾 → `sessionStorage`，關瀏覽器即失效（給共用電腦用）。換金鑰時兩邊都會先清，
  並一併清掉 `foguang_model_cache`。這幾個 key 動了要三處一起改。
- 格式檢查（`AIza` 開頭）是**提醒不是硬擋**——Google 的金鑰格式日後可能改，
  擋死會讓遊戲直接不能玩。不要把它改成 return。

## 模型「不釘死」是刻意的

`resolveModel()` 打 ListModels 自動偵測金鑰可用的模型，`scoreModel()` 依偏好排序
（`flash-lite` > `flash` > `pro`，偏好穩定版、版本越新分數越高，排除
embedding / vision / tts / preview 等變體），結果快取 24 小時
（`foguang_model_cache`）。實際呼叫拿到 404 會清快取、強制重新偵測、再試一次。
ListModels 整個打不通才退回 `fallbackModel()` 的 `gemini-2.5-flash-lite`。

**不要把模型改成寫死一個型號。** 一旦釘死，Google 哪天下架它，遊戲就直接壞掉，
而且沒有後台可以改——這個站是靜態的，只能重新部署。要調整偏好就改 `scoreModel()`
的評分權重，不要改成常數。

沒金鑰時走 `analyzeWithLocalPatterns()`（正則比對），準確度低但保證能玩完，
是刻意保留的離線備援。

## 資料格式的地雷

`story.js` 是純資料（`STORY_DATA`），`game.js` 是引擎。`index.html` 先載 `story.js`
再載 `game.js`，**順序不能反**。

- **`aiChallenge.gemType` 必填**（`good_deed` / `good_word` / `good_heart`）。
  `showAIResult()` 判定成功時用它去 `playerScore[scoreType] += 3`，漏填會靜靜出錯。
- **改故事節點 id 會弄壞玩家的存檔。** `foguang_ai_save` 存的是 `currentChapter` +
  `currentNode` 字串，而且**沒有版本號**。舊存檔指到不存在的節點時不會有友善提示。
  要改既有 id，請一起把存檔 key 改名（例如 `foguang_ai_save_v2`）讓舊檔失效。
- **存檔是手動的**（選單裡按「儲存」），不是自動存檔——測試時別以為它會自己存。
- `aiChallenge.context` 會一起送進 Gemini 的 prompt，影響判定結果；改情境文字等於改判準。

## 檔名地雷：大小寫與空白

圖片和音檔都是**中文檔名**，而且音檔的副檔名**大小寫不一致**
（`成功音效.mp3` 但 `失敗音效.MP3`；`人聲/師長.mp3` 但 `人聲/學長.MP3`）。
Cloudflare Pages 與 GitHub Pages 都**區分大小寫**，Windows 本機不分——
所以「本機好好的、上線 404」幾乎都是這個原因。改到任何資源路徑後，
用 `[ -f "路徑" ]` 之類的方式對實際檔名逐一核對過再部署。

另外 `images/大家都再往前走 我好像少了甚麼.webp` **檔名含半形空白**，不是底線。

## 圖片一律轉 WebP

2026-08-12 把 29 張場景圖與角色立繪從 PNG 換成 WebP（品質 90），
**32.6 MB 減為 2.4 MB**——原本玩家用手機開場要等很久。有透明背景的立繪保留
alpha 通道，尺寸不變。

**之後新增任何圖都要照做**：轉 WebP、品質 90、立繪保留 alpha、場景圖不必留。
這個站沒有建置步驟，沒有任何工具會幫你壓縮——手動轉好再放進 `images/`。
（音檔沒做過對應處理，`music/` 目前 4.9 MB，比圖片還大。）

## 技術債留帳

- **`images/` 有 11 張沒有任何程式碼引用的圖**（約 776 KB）：`女大學生.webp`、
  `寶石.webp`、`寶石托盤.webp`、`活動企劃書.webp`、`報著資料的男大生.webp`、
  `男大生大喊.webp`、`睡著男大生.webp`、`站在教室門口的耳機同學.webp`、
  `遇上耳機不見好友.webp`、`鄙視ㄉ男人.webp`、`靠背難過的延畢生.webp`。
  `deploy.ps1` 是整個資料夾複製，所以每次部署都會一起推上線。看起來像是劇情刪節後
  留下的素材——刪之前先確認（`grep -n "檔名" story.js game.js index.html style.css`）。
- **`showAIResult()` 用 `innerHTML` 直接塞 `result.analysis`**（Gemini 回傳的文字），
  沒有逸出。玩家的自由輸入會進 prompt、模型有機會把它原樣吐回來，等於一條
  自作自受的 HTML 注入路徑。金鑰是玩家自己的、影響只及於自己，所以不緊急，
  但要動這段的話應該改成逸出後再插入，或分成 `textContent` + 固定結構。
  同一函式裡的其他欄位都已經是硬編碼字串，只有這一處是外來資料。

## 現況與 README 不符之處

1. **README 的「直接試玩」還指向 `https://hsu-yu-ming.github.io/seeking-the-light/`。**
   因為 `gh-pages` 有轉址頁所以還能用，但正確網址是 `https://play.cornhsu.com/seeking-the-light/`。
2. **README「📁 檔案結構」整段仍寫成 `.png`**（`體育館.png`、`教室.png`……），
   「開發者參考」的程式範例也還是 `background: 'images/教室.png'`。
   WebP 那次沒同步改 README。**實際檔案全部是 `.webp`**，照 README 抄會抄出 404。

動到 README 時順手修這兩處。

## 開工慣例

- **沒有測試、沒有 lint、沒有 CI。** 任何改動都要真的把遊戲跑一輪。
- 本機**不能用 `file://` 開**——跨來源請求會被擋。起個伺服器：
  `python -m http.server 8000` 或 `npx http-server -p 8000`。
- 動到 AI 判定就要**兩條路都測**：有金鑰（Gemini）與沒金鑰（本地正則）。
  README 有記錄各種 HTTP 錯誤碼的對應提示，改錯誤處理時對照著看。
- 動到資源路徑就要**實際部署到 `-BuildOnly` 產物或線上驗一次**，因為大小寫問題
  在 Windows 本機永遠測不出來。
- 收尾：改到玩法、判準或檔案結構 → 同步 README 對應章節（它有三種讀者，別只改一段）。
