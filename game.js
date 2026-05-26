// ===== 佛光尋光記：三好之旅 AI 互動版 =====
// 遊戲引擎主檔案

class FoguangGame {
    constructor() {
        this.currentChapter = null;
        this.currentNode = null;
        this.collectedGems = {
            good_deed: false,
            good_word: false,
            good_heart: false
        };
        this.playerScore = {
            good_deed: 0,
            good_word: 0,
            good_heart: 0
        };
        
        // 金鑰一律由使用者在網頁上輸入，啟動時於 init() 從 localStorage 載入
        this.apiKey = null;
        this.useLocalMode = false;

        this.currentAIChallenge = null;

        // 自動偵測到的可用模型（由 ListModels 解析，避免硬寫死的模型被下架）
        this.resolvedModel = null;
        
        // 音訊播放器
        this.currentAudio = null;           // 對話音訊
        this.backgroundMusic = null;        // 背景音樂
    }

    // ===== 初始化 =====
    init() {
        console.log('🎮 佛光尋光記 AI 互動版啟動');

        // 依是否有存檔，顯示/隱藏「繼續遊戲」按鈕
        this.refreshContinueButton();

        // 載入金鑰：先看 sessionStorage（本次瀏覽期間有效），再看 localStorage（記住的金鑰，有 30 天效期）
        const KEY_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
        let savedApiKey = sessionStorage.getItem('foguang_api_key');

        if (!savedApiKey) {
            const lsKey = localStorage.getItem('foguang_api_key');
            const savedAt = parseInt(localStorage.getItem('foguang_api_key_saved_at') || '0', 10);
            if (lsKey) {
                if (savedAt && (Date.now() - savedAt) > KEY_TTL) {
                    // 超過效期，自動清除，要求重新輸入
                    localStorage.removeItem('foguang_api_key');
                    localStorage.removeItem('foguang_api_key_saved_at');
                    localStorage.removeItem('foguang_model_cache');
                    console.log('🧹 已儲存的金鑰超過 30 天，已自動清除，請重新輸入');
                } else {
                    savedApiKey = lsKey;
                }
            }
        }

        if (savedApiKey) {
            this.apiKey = savedApiKey;
            console.log('✅ API 金鑰已載入（沿用上次設定）');
        } else {
            console.log('⚠️ 尚未設定 API 金鑰，將在遊戲開始時詢問');
        }

        // 設定寶石圖片
        this.setupGemImages();

        // 綁定事件
        this.bindEvents();

        // 隱藏載入畫面
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 1000);
    }

    setupGemImages() {
        // 設定寶石圖片路徑
        const gemImages = {
            'good-deed': 'images/善行之石.png',
            'good-word': 'images/慧語之石.png',
            'good-heart': 'images/淨念之石.png'
        };
        
        // 為每個寶石 slot 設定背景圖片
        ['good-deed', 'good-word', 'good-heart'].forEach(gemType => {
            const gemIcon = document.getElementById(`gem-${gemType}`);
            if (gemIcon) {
                gemIcon.dataset.gemImage = gemImages[gemType];
            }
        });
    }

    bindEvents() {
        // 綁定對話框點擊事件
        const dialogueBox = document.getElementById('dialogue-box');
        if (dialogueBox) {
            dialogueBox.addEventListener('click', () => this.nextDialogue());
        }

        // 綁定字數計數器
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.addEventListener('input', (e) => {
                document.getElementById('char-count').textContent = e.target.value.length;
            });
        }

        // 綁定標題畫面點擊事件（用於觸發音樂播放）
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.addEventListener('click', () => {
                // 如果還沒有背景音樂在播放，且在標題畫面，則播放
                if (!this.backgroundMusic && titleScreen.classList.contains('active')) {
                    this.playBackgroundMusic('music/校園輕音樂.mp3', true);
                }
            }, { once: false });  // 允許多次觸發，因為可能會回到標題畫面
        }
    }

    // ===== 畫面切換 =====
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        
        // 如果切換到標題畫面，播放標題音樂並更新「繼續遊戲」按鈕狀態
        if (screenId === 'title-screen') {
            this.playBackgroundMusic('music/校園輕音樂.mp3', true);
            this.refreshContinueButton();
        }
    }

    // ===== API 設定 =====
    showApiConfig() {
        this.showScreen('api-config-screen');
    }

    saveApiKey() {
        const apiKeyInput = document.getElementById('api-key-input');
        // 清掉複製貼上常見的雜質：半形/全形空白、換行、Tab、零寬字元
        const apiKey = apiKeyInput.value
            .replace(/[\s\u3000\u200B\u200C\u200D\uFEFF]/g, '')
            .trim();

        if (!apiKey) {
            alert('請輸入 API 金鑰！');
            return;
        }

        // 格式檢查放寬為「提醒」而非「硬擋」：Google 金鑰目前多以 AIza 開頭，
        // 但格式日後可能調整，故僅在不符時提示，仍允許使用者繼續。
        if (!apiKey.startsWith('AIza')) {
            const proceed = confirm(
                '⚠️ 這把金鑰不是以 AIza 開頭，可能不是有效的 Google API 金鑰。\n\n' +
                '若你確定沒貼錯，可以按「確定」繼續；否則按「取消」重新檢查。'
            );
            if (!proceed) return;
        }

        // 依「在此裝置記住金鑰」勾選框決定儲存方式
        const rememberEl = document.getElementById('remember-key-checkbox');
        const rememberOnDevice = rememberEl ? rememberEl.checked : true;

        this.apiKey = apiKey;
        this.useLocalMode = false;

        // 先清掉兩種儲存，避免新舊殘留
        localStorage.removeItem('foguang_api_key');
        localStorage.removeItem('foguang_api_key_saved_at');
        sessionStorage.removeItem('foguang_api_key');

        if (rememberOnDevice) {
            // 記住在此裝置：存 localStorage，並記時間戳供 30 天效期判斷
            localStorage.setItem('foguang_api_key', apiKey);
            localStorage.setItem('foguang_api_key_saved_at', String(Date.now()));
        } else {
            // 僅本次瀏覽期間：存 sessionStorage，瀏覽器一關即清空（適合共用電腦）
            sessionStorage.setItem('foguang_api_key', apiKey);
        }

        // 換金鑰時清掉舊的模型快取，讓系統用新金鑰重新偵測可用模型
        localStorage.removeItem('foguang_model_cache');
        this.resolvedModel = null;

        console.log('✅ API 金鑰已儲存（' + (rememberOnDevice ? '記住於此裝置，30 天效期' : '僅本次瀏覽期間') + '）');
        alert('✅ API 金鑰設定成功！遊戲將自動偵測可用模型並使用 Gemini AI 判定。');

        this.showScreen('title-screen');
    }

    skipApiConfig() {
        this.useLocalMode = true;
        this.apiKey = null;
        
        console.log('⚠️ 使用本地語意分析模式');
        alert('ℹ️ 將使用本地語意分析模式。\n判定準確度可能較低，建議設定 API 金鑰以獲得最佳體驗。');
        
        this.showScreen('title-screen');
    }

    // 重新設定 / 清除已儲存的金鑰（供遊戲選單呼叫）
    reconfigureApiKey() {
        const hasKey = !!localStorage.getItem('foguang_api_key');
        if (hasKey) {
            const clear = confirm(
                '🔑 目前已儲存一把 API 金鑰。\n\n' +
                '按「確定」清除已儲存的金鑰並重新輸入；\n' +
                '按「取消」則保留現有金鑰、僅前往輸入畫面覆蓋。'
            );
            if (clear) {
                localStorage.removeItem('foguang_api_key');
                localStorage.removeItem('foguang_api_key_saved_at');
                sessionStorage.removeItem('foguang_api_key');
                localStorage.removeItem('foguang_model_cache');
                this.apiKey = null;
                this.resolvedModel = null;
                this.useLocalMode = false;
                console.log('🧹 已清除本地金鑰與模型快取');
            }
        }
        // 關閉選單（若開著）並前往金鑰設定畫面
        const menu = document.getElementById('game-menu');
        if (menu && menu.classList.contains('active')) {
            this.toggleMenu();
        }
        const input = document.getElementById('api-key-input');
        if (input) input.value = '';
        this.showApiConfig();
    }

    // ===== 關於畫面 =====
    showAbout() {
        this.showScreen('about-screen');
    }

    hideAbout() {
        this.showScreen('title-screen');
    }

    // ===== 遊戲開始 =====
    startNewGame() {
        // 停止標題音樂
        this.stopBackgroundMusic();
        
        // 如果有 API 金鑰,直接開始遊戲
        if (this.apiKey) {
            console.log('✅ 使用已設定的 API 金鑰開始遊戲');
        } else if (!this.useLocalMode) {
            // 沒有金鑰且未設定本地模式,詢問是否設定
            const setupApi = confirm(
                '🤖 AI 判定功能設定\n\n' +
                '本遊戲使用 Google Gemini API 進行智能語意分析。\n\n' +
                '是否要設定 API 金鑰?\n' +
                '(點「取消」將使用本地分析模式)'
            );

            if (setupApi) {
                this.showApiConfig();
                return;
            } else {
                this.useLocalMode = true;
                console.log('⚠️ 使用本地語意分析模式');
            }
        }

        // 重置遊戲狀態
        this.currentChapter = 'prologue';
        this.currentNode = 'p1';
        this.collectedGems = {
            good_deed: false,
            good_word: false,
            good_heart: false
        };
        this.playerScore = {
            good_deed: 0,
            good_word: 0,
            good_heart: 0
        };

        this.showScreen('game-screen');
        this.loadNode('prologue', 'p1');
        this.updateChapterDisplay('序章');
        this.updateGemsDisplay();
    }

    // ===== 載入故事節點 =====
    loadNode(chapter, nodeId) {
        const node = STORY_DATA[chapter][nodeId];
        if (!node) {
            console.error(`找不到節點: ${chapter}.${nodeId}`);
            return;
        }

        this.currentChapter = chapter;
        this.currentNode = nodeId;

        console.log(`📖 載入節點: ${chapter}.${nodeId}`);

        // 停止前一個對話音訊
        this.stopAudio();

        // 播放此節點的對話音訊（如果有）
        if (node.audio) {
            this.playAudio(node.audio);
        }

        // 播放背景音樂（如果有）
        if (node.backgroundMusic) {
            this.playBackgroundMusic(node.backgroundMusic, true);
        }

        // 更新場景背景
        if (node.background) {
            this.updateBackground(node.background);
        }

        // 更新角色
        if (node.characters) {
            this.updateCharacters(node.characters, node.speaker);
        }

        // 隱藏選擇和 AI 輸入
        this.hideChoices();
        this.hideAIInput();

        // 檢查是否有 AI 挑戰 - 儲存但不立即顯示
        if (node.aiChallenge) {
            this.currentAIChallenge = node.aiChallenge;
            console.log('🤖 此節點包含 AI 挑戰,等待對話結束後顯示');
        } else {
            this.currentAIChallenge = null;
        }

        // 顯示對話
        if (node.speaker && node.text) {
            this.showDialogue(node.speaker, node.text);
        }

        // 檢查是否要收集寶石（進入節點即記錄，動畫由 collectGem 內部延後播放）
        if (node.gem) {
            this.collectGem(node.gem);
        }
    }

    // ===== 更新場景背景 =====
    updateBackground(imagePath) {
        const bg = document.getElementById('scene-background');
        bg.style.backgroundImage = `url('${imagePath}')`;
    }

    // ===== 更新角色 =====
    updateCharacters(characters, speakingChar = null) {
        ['left', 'center', 'right'].forEach(pos => {
            const charDiv = document.getElementById(`char-${pos}`);
            charDiv.innerHTML = '';

            if (characters[pos]) {
                const img = document.createElement('img');
                img.src = characters[pos];
                img.classList.add('active');
                
                if (speakingChar && characters[pos].includes(speakingChar)) {
                    img.classList.add('speaking');
                }
                
                charDiv.appendChild(img);
            }
        });
    }

    // ===== 顯示對話 =====
    showDialogue(speaker, text) {
        document.getElementById('speaker-name').textContent = speaker;
        document.getElementById('dialogue-text').textContent = text;
        document.getElementById('dialogue-box').style.display = 'block';
    }

    hideDialogue() {
        document.getElementById('dialogue-box').style.display = 'none';
    }

    // ===== 下一段對話 =====
    nextDialogue() {
        const node = STORY_DATA[this.currentChapter][this.currentNode];

        console.log('⏭️ nextDialogue 被呼叫', {
            hasChoices: !!node.choices,
            hasAIChallenge: !!node.aiChallenge,
            hasNext: !!node.next,
            hasNextChapter: !!node.nextChapter
        });

        // 如果有 AI 挑戰,顯示 AI 輸入
        if (node.aiChallenge) {
            console.log('🤖 顯示 AI 輸入介面');
            this.showAIInput(node.aiChallenge);
            return;
        }

        // 如果有選擇,顯示選擇
        if (node.choices) {
            console.log('📝 顯示選擇按鈕');
            this.showChoices(node.choices);
            return;
        }

        // 檢查是否要切換章節
        if (node.nextChapter && node.nextNode) {
            console.log('📖 切換到新章節:', node.nextChapter);
            // 更新章節顯示
            const chapterNames = {
                'chapter1': '第一章:大一',
                'chapter2': '第二章:大二',
                'chapter3': '第三章:大四',
                'ending': '結局'
            };
            this.updateChapterDisplay(chapterNames[node.nextChapter] || '');
            
            // 載入新章節
            this.loadNode(node.nextChapter, node.nextNode);
            return;
        }

        // 如果有下一個節點,載入
        if (node.next) {
            console.log('➡️ 載入下一個節點:', node.next);
            this.loadNode(this.currentChapter, node.next);
            return;
        }

        // 否則結束當前章節
        console.log('✅ 章節結束');
    }

    // ===== 顯示選擇 =====
    showChoices(choices) {
        this.hideDialogue();
        
        const container = document.getElementById('choices-container');
        container.innerHTML = '';
        container.style.display = 'flex';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = `choice-btn ${choice.type}`;
            btn.textContent = choice.text;
            btn.onclick = () => this.selectChoice(choice);
            container.appendChild(btn);
        });
    }

    hideChoices() {
        document.getElementById('choices-container').style.display = 'none';
    }

    selectChoice(choice) {
    console.log(`選擇: ${choice.text} (${choice.type})`);

    // 更新分數
    if (choice.score) {
        const scoreType = choice.scoreType || 'good_deed';
        this.playerScore[scoreType] += choice.score;
    }

    this.hideChoices();

    // 如果有自定義 action,執行它
    if (choice.action && typeof choice.action === 'function') {
        choice.action();
        return;  // 執行 action 後直接返回,不繼續處理 next
    }

    // 載入下一個節點
    if (choice.next) {
        this.loadNode(this.currentChapter, choice.next);
    }
}

    // ===== AI 輸入系統 =====
    showAIInput(challenge) {
        const container = document.getElementById('ai-input-container');
        const promptText = document.getElementById('ai-prompt-text');
        const hintContent = document.getElementById('hint-content');
        const userInput = document.getElementById('user-input');

        // 先設置內容
        promptText.textContent = challenge.prompt;
        hintContent.textContent = challenge.hint;
        hintContent.style.display = 'none';
        document.getElementById('hint-toggle-text').textContent = '顯示提示';
        userInput.value = '';
        document.getElementById('char-count').textContent = '0';
        
        // 確保 AI 輸入框內部元素可見
        document.querySelector('.ai-prompt-box').style.display = 'block';
        document.getElementById('ai-result').style.display = 'none';
        document.getElementById('ai-analyzing').style.display = 'none';
        
        // 先顯示容器
        container.style.display = 'block';
        
        // 然後才隱藏其他元素
        this.hideDialogue();
        this.hideChoices();
        
        // 焦點到輸入框
        setTimeout(() => {
            userInput.focus();
            console.log('✅ AI 輸入框已顯示並聚焦');
        }, 100);
    }

    hideAIInput() {
        const container = document.getElementById('ai-input-container');
        container.style.display = 'none';
        
        // 同時重置內部狀態
        document.querySelector('.ai-prompt-box').style.display = 'block';
        document.getElementById('ai-result').style.display = 'none';
        document.getElementById('ai-analyzing').style.display = 'none';
        
        console.log('🔒 AI 輸入框已隱藏');
    }

    toggleHint() {
        const hintContent = document.getElementById('hint-content');
        const toggleText = document.getElementById('hint-toggle-text');
        
        if (hintContent.style.display === 'none' || hintContent.style.display === '') {
            hintContent.style.display = 'block';
            toggleText.textContent = '隱藏提示';
            console.log('💡 提示已顯示');
        } else {
            hintContent.style.display = 'none';
            toggleText.textContent = '顯示提示';
            console.log('💡 提示已隱藏');
        }
    }

    // ===== 提交 AI 輸入 =====
    async submitAIInput() {
        const userInput = document.getElementById('user-input').value.trim();
        
        if (!userInput) {
            alert('請輸入你的回答！');
            return;
        }

        console.log(`🤖 分析輸入: ${userInput}`);

        // 隱藏輸入框，顯示分析中
        document.querySelector('.ai-prompt-box').style.display = 'none';
        document.getElementById('ai-analyzing').style.display = 'block';

        try {
            let result;
            
            // 根據模式選擇分析方法
            if (this.useLocalMode || !this.apiKey) {
                console.log('使用本地語意分析模式');
                result = await this.analyzeWithLocalPatterns(userInput);
            } else {
                console.log('使用 Gemini API 分析模式');
                result = await this.analyzeWithGeminiAPI(userInput);
            }

            // 顯示結果
            this.showAIResult(result);

        } catch (error) {
            console.error('AI 分析錯誤:', error);
            this.showAIResult({
                success: false,
                analysis: '系統錯誤：AI 分析失敗。請檢查網路連線或稍後再試。'
            });
        }
    }

    // ===== 本地語意分析 =====
    async analyzeWithLocalPatterns(input) {
        // 模擬網路延遲
        await new Promise(r => setTimeout(r, 2000));

        const challenge = this.currentAIChallenge;
        const validation = challenge.validation;

        // 1. 檢查負面句型
        for (let pattern of validation.negativePatterns) {
            if (pattern.test(input)) {
                return {
                    success: false,
                    analysis: '❌ 語意判定未通過\n\n系統偵測到您的回答中包含負面、冷漠或不禮貌的意圖。三好精神強調善意與溫暖，請重新思考並調整您的回答。',
                    mode: 'local'
                };
            }
        }

        // 2. 檢查正面句型
        for (let pattern of validation.positivePatterns) {
            if (pattern.test(input)) {
                return {
                    success: true,
                    analysis: '✅ 語意判定通過！\n\n系統分析出您的回答結構完整，包含正確的行動意圖與善意，完全符合三好精神。做得好！',
                    mode: 'local'
                };
            }
        }

        // 3. 語意不明確
        return {
            success: false,
            analysis: '⚠️ 語意不夠明確\n\n您的回答似乎過於簡短或語意不清。請試著更完整地描述您的行動、對話或想法。可以參考提示來組織回答。',
            mode: 'local'
        };
    }

    // ===== 模型自動偵測 =====
    // 用同一把金鑰呼叫 ListModels，取得「這把金鑰當下實際可用」的模型清單，
    // 再依偏好挑一個。已下架的模型不會出現在清單裡，所以日後 Google 換版時無需手動改程式。
    async resolveModel(forceRefresh) {
        const CACHE_KEY = 'foguang_model_cache';
        const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小時

        // 1) 先看快取（避免每次判定都多打一次 ListModels）
        if (!forceRefresh) {
            try {
                const raw = localStorage.getItem(CACHE_KEY);
                if (raw) {
                    const cached = JSON.parse(raw);
                    if (cached && cached.model && (Date.now() - cached.ts) < CACHE_TTL) {
                        return cached.model;
                    }
                }
            } catch (e) {
                // 快取壞掉就忽略，往下重新偵測
            }
        }

        // 2) 呼叫 ListModels
        try {
            const listUrl = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000';
            const resp = await fetch(listUrl, {
                method: 'GET',
                headers: { 'x-goog-api-key': this.apiKey }
            });

            if (!resp.ok) {
                console.warn('ListModels 失敗，改用備用模型。狀態碼:', resp.status);
                return this.fallbackModel();
            }

            const data = await resp.json();
            const models = Array.isArray(data.models) ? data.models : [];

            const candidates = models
                .filter((m) => {
                    const methods = m.supportedGenerationMethods || m.supported_actions || [];
                    return methods.indexOf('generateContent') !== -1;
                })
                .map((m) => String(m.name || '').replace(/^models\//, ''))
                .map((name) => ({ name: name, score: this.scoreModel(name) }))
                .filter((c) => c.score >= 0)
                .sort((a, b) => b.score - a.score);

            if (candidates.length > 0) {
                const chosen = candidates[0].name;
                console.log('✅ 自動選用模型:', chosen);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ model: chosen, ts: Date.now() }));
                } catch (e) { /* localStorage 滿了也無妨 */ }
                this.resolvedModel = chosen;
                return chosen;
            }

            console.warn('清單中沒有合適的 generateContent 模型，改用備用模型。');
            return this.fallbackModel();

        } catch (error) {
            console.warn('ListModels 發生例外，改用備用模型:', error);
            return this.fallbackModel();
        }
    }

    // 偏好評分：為這個「三好判定」分類任務挑最划算的模型
    // flash-lite（免費額度最高、最便宜）> flash > pro（貴又限額，最後才用）
    // 偏好穩定版而非 preview；版本越新加越多分，之後新版穩定後會自動升級。
    scoreModel(name) {
        const n = name.toLowerCase();
        if (n.indexOf('gemini') !== 0) return -1;

        // 排除非純文字 / 特殊用途的變體
        const banned = ['embedding', 'aqa', 'vision', 'imagen', 'image', 'tts',
                        'audio', 'live', 'learnlm', 'gemma', 'thinking', 'exp'];
        for (let i = 0; i < banned.length; i++) {
            if (n.indexOf(banned[i]) !== -1) return -1;
        }

        let score = 0;
        if (n.indexOf('flash-lite') !== -1) score += 1000;
        else if (n.indexOf('flash') !== -1) score += 800;
        else if (n.indexOf('pro') !== -1) score += 200;
        else score += 100;

        if (n.indexOf('preview') !== -1) score -= 300; // 偏好穩定版
        if (n.indexOf('latest') !== -1) score -= 150;   // 別名，可能指向實驗版

        const m = n.match(/gemini-(\d+)(?:\.(\d+))?/);
        if (m) {
            const major = parseInt(m[1], 10) || 0;
            const minor = m[2] ? parseInt(m[2], 10) : 0;
            score += major * 20 + minor * 2;
        }
        return score;
    }

    // ListModels 打不通時的備用模型（目前的穩定、免費額度友善選擇）
    fallbackModel() {
        return 'gemini-2.5-flash-lite';
    }

    // ===== Gemini API 分析 =====
    async analyzeWithGeminiAPI(input) {
        const challenge = this.currentAIChallenge;

        // 構建分析提示詞
        const analysisPrompt = `
你是「佛光尋光記：三好之旅」遊戲的 AI 評審。你的任務是評估玩家的回答是否符合「三好」精神。

**遊戲情境：**
${challenge.context}

**評估任務：**
${challenge.prompt}

**玩家的回答：**
"${input}"

**評估標準：**
- 回答是否展現出善意、同理心、禮貌或真誠？
- 是否包含具體的行動、話語或心態？
- 語氣是否正面、溫暖？

**判定規則：**
- 如果回答符合三好精神（做好事/說好話/存好心），請回應：SUCCESS
- 如果回答消極、冷漠、不禮貌或缺乏行動，請回應：FAILURE

請以下列JSON格式回應（不要加任何markdown標記）：
{
  "success": true/false,
  "analysis": "簡短評語（70字內）",
  "score": 1-10
}
`;

        // 實際送出一次請求的內部函式，方便 404 時換模型重試
        const callOnce = async (model) => {
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
            console.log('📡 呼叫 Gemini API (模型: ' + model + ')...');
            return await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey  // 金鑰放在 Header 中
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: analysisPrompt
                        }]
                    }]
                })
            });
        };

        try {
            // 自動偵測可用模型（會走快取）
            let model = await this.resolveModel(false);
            let response = await callOnce(model);

            // 若選到的模型剛好被下架（404），清快取、強制重新偵測、再試一次
            if (response.status === 404) {
                console.warn('模型 ' + model + ' 回傳 404，重新偵測可用模型...');
                model = await this.resolveModel(true);
                response = await callOnce(model);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const apiMsg = (errorData.error && errorData.error.message) || '未知錯誤';
                console.error('API 回應錯誤:', response.status, errorData);
                console.error('使用的模型:', model);

                // 把不同錯誤碼講清楚，方便日後排查（不再被一句「切換本地模式」蓋掉）
                let hint;
                if (response.status === 400) {
                    hint = '請求格式有誤 (400)。';
                } else if (response.status === 403) {
                    hint = '金鑰權限不足或未啟用 Generative Language API (403)。請到 Google AI Studio 確認金鑰。';
                } else if (response.status === 404) {
                    hint = '找不到可用模型 (404)。這把金鑰可能沒有任何可用的 Gemini 模型。';
                } else if (response.status === 429) {
                    hint = '已達免費額度上限 (429)。請稍後再試，或改用自己的金鑰。';
                } else {
                    hint = 'HTTP ' + response.status + '。';
                }
                throw new Error(hint + ' 詳細: ' + apiMsg);
            }

            const data = await response.json();

            // 防呆：Gemini 可能因安全機制攔截、或回傳沒有 candidates
            const candidate = data.candidates && data.candidates[0];
            const parts = candidate && candidate.content && candidate.content.parts;
            const responseText = parts && parts[0] && parts[0].text;

            if (!responseText) {
                const blockReason = (data.promptFeedback && data.promptFeedback.blockReason) ||
                                    (candidate && candidate.finishReason) || '未知';
                throw new Error('模型沒有回傳可用內容（原因：' + blockReason + '）。可能被安全機制攔截，請換個說法再試。');
            }

            console.log('Gemini API 回應:', responseText);

            // 解析 JSON 回應
            let result;
            try {
                // 移除可能的 markdown 標記
                const cleanText = responseText
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();
                
                result = JSON.parse(cleanText);
            } catch (e) {
                console.error('JSON 解析失敗:', e);
                // Fallback: 簡單判斷
                const isSuccess = responseText.toUpperCase().includes('SUCCESS') || 
                                 responseText.includes('"success": true');
                result = {
                    success: isSuccess,
                    analysis: responseText.substring(0, 200),
                    score: 5
                };
            }

            return {
                ...result,
                mode: 'api'
            };

        } catch (error) {
            console.error('Gemini API 呼叫失敗:', error);

            // 仍保留 fallback 到本地，但這次把真正的原因顯示出來，方便排查
            alert('⚠️ AI 判定失敗，暫時切換到本地分析模式。\n\n原因：' + (error.message || error));
            return await this.analyzeWithLocalPatterns(input);
        }
    }

    // ===== 顯示 AI 結果 =====
    showAIResult(result) {
        document.getElementById('ai-analyzing').style.display = 'none';

        // 播放對應的音效
        if (result.success) {
            this.playSoundEffect('music/成功音效.mp3');
        } else {
            this.playSoundEffect('music/失敗音效.MP3');
        }

        const resultDiv = document.getElementById('ai-result');
        resultDiv.className = result.success ? 'success' : 'failure';
        resultDiv.innerHTML = `
            <div class="result-header">
                ${result.success ? '✅ 判定通過！' : '❌ 判定未通過'}
            </div>
            <div class="result-content">
                ${result.analysis}
                ${result.mode === 'local' ? '<br><small style="color: #64748b;">(使用本地語意分析)</small>' : ''}
                ${result.mode === 'api' ? '<br><small style="color: #64748b;">(AI Powered by Google Gemini)</small>' : ''}
            </div>
            <div class="result-actions">
                ${result.success ? 
                    `<button class="result-btn primary" onclick="game.proceedAfterAI(true)">繼續劇情 →</button>` :
                    `<button class="result-btn secondary" onclick="game.retryAIInput()">重新回答</button>`
                }
            </div>
        `;
        resultDiv.style.display = 'block';

        // 如果成功，更新分數
        if (result.success) {
            const scoreType = this.currentAIChallenge.gemType;
            this.playerScore[scoreType] += 3;
        }
    }

    // ===== AI 輸入後續 =====
    retryAIInput() {
        // 重置提示文字顯示狀態
        document.getElementById('hint-content').style.display = 'none';
        document.getElementById('hint-toggle-text').textContent = '顯示提示';
        
        // 顯示輸入框,隱藏結果
        document.querySelector('.ai-prompt-box').style.display = 'block';
        document.getElementById('ai-result').style.display = 'none';
        document.getElementById('ai-analyzing').style.display = 'none';
        
        // 清空輸入
        document.getElementById('user-input').value = '';
        document.getElementById('char-count').textContent = '0';
        
        // 聚焦輸入框
        setTimeout(() => {
            document.getElementById('user-input').focus();
        }, 100);
    }

    proceedAfterAI(success) {
        this.hideAIInput();
        
        const node = STORY_DATA[this.currentChapter][this.currentNode];
        
        if (success && node.aiSuccess) {
            this.loadNode(this.currentChapter, node.aiSuccess);
        } else if (!success && node.aiFail) {
            this.loadNode(this.currentChapter, node.aiFail);
        } else if (node.next) {
            this.loadNode(this.currentChapter, node.next);
        }
    }

    // ===== 寶石收集 =====
    collectGem(gemType) {
        if (this.collectedGems[gemType]) {
            return; // 已經收集過了
        }

        console.log(`💎 收集寶石: ${gemType}`);
        // 立刻記錄並更新顯示，確保此刻存檔就會包含這顆寶石（不受動畫延遲影響）
        this.collectedGems[gemType] = true;
        this.updateGemsDisplay();

        // 動畫與音效延後播放，維持「對話先出現、寶石再亮」的節奏
        setTimeout(() => {
            this.playGemSound();
            this.playGemCollectAnimation(gemType);
        }, 1000);
    }

    playGemCollectAnimation(gemType) {
        const gemDiv = document.createElement('div');
        gemDiv.className = 'gem-collect-animation';
        gemDiv.textContent = '💎';
        gemDiv.style.left = '50%';
        gemDiv.style.top = '50%';
        document.body.appendChild(gemDiv);

        setTimeout(() => {
            gemDiv.remove();
        }, 2000);
    }

    updateGemsDisplay() {
        const gemMap = {
            'good_deed': 'good-deed',
            'good_word': 'good-word',
            'good_heart': 'good-heart'
        };

        Object.entries(this.collectedGems).forEach(([gemType, collected]) => {
            const gemId = gemMap[gemType];
            const gemIcon = document.getElementById(`gem-${gemId}`);
            
            if (collected && gemIcon) {
                gemIcon.classList.remove('empty');
                gemIcon.classList.add('collected', gemType.replace('_', '-'));
                
                // 設定寶石圖片
                const gemImage = gemIcon.dataset.gemImage;
                if (gemImage) {
                    gemIcon.style.backgroundImage = `url('${gemImage}')`;
                    gemIcon.style.backgroundSize = 'cover';
                }
                
                gemIcon.innerHTML = '';
            }
        });
    }

    // ===== 音訊控制 =====
    playAudio(audioPath) {
        try {
            // 停止前一個音訊
            this.stopAudio();
            
            // 建立新的音訊物件
            this.currentAudio = new Audio(audioPath);
            
            // 播放音訊
            this.currentAudio.play().catch(error => {
                console.warn('音訊播放失敗:', error);
                console.log('提示：某些瀏覽器需要使用者互動後才能播放音訊');
            });
            
            console.log('🔊 播放音訊:', audioPath);
        } catch (error) {
            console.error('音訊載入失敗:', error);
        }
    }

    stopAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    // 播放背景音樂
    playBackgroundMusic(musicPath, loop = true) {
        try {
            // 停止前一個背景音樂
            this.stopBackgroundMusic();
            
            // 建立新的音訊物件
            this.backgroundMusic = new Audio(musicPath);
            this.backgroundMusic.loop = loop;  // 設定循環播放
            this.backgroundMusic.volume = 0.5; // 音量設為 50%
            
            // 播放背景音樂
            this.backgroundMusic.play().catch(error => {
                console.warn('背景音樂播放失敗:', error);
                console.log('提示：某些瀏覽器需要使用者互動後才能播放音訊');
            });
            
            console.log('🎵 播放背景音樂:', musicPath);
        } catch (error) {
            console.error('背景音樂載入失敗:', error);
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic = null;
        }
    }

    // 播放寶石收集音效
    playGemSound() {
        try {
            const gemSound = new Audio('music/獲得寶石.mp3');
            gemSound.volume = 0.7;  // 音量設為 70%
            gemSound.play().catch(error => {
                console.warn('寶石音效播放失敗:', error);
            });
            console.log('✨ 播放寶石音效');
        } catch (error) {
            console.error('寶石音效載入失敗:', error);
        }
    }

    // 播放音效（通用函數）
    playSoundEffect(soundPath, volume = 0.7) {
        try {
            const sound = new Audio(soundPath);
            sound.volume = volume;  // 預設音量 70%
            sound.play().catch(error => {
                console.warn('音效播放失敗:', error);
            });
            console.log('🔊 播放音效:', soundPath);
        } catch (error) {
            console.error('音效載入失敗:', error);
        }
    }

    // ===== 章節顯示 =====
    updateChapterDisplay(chapterName) {
        document.getElementById('chapter-display').textContent = chapterName;
    }

    // ===== 選單系統 =====
    toggleMenu() {
        const menu = document.getElementById('game-menu');
        menu.classList.toggle('active');
    }

    // ===== 儲存/讀取 =====
    saveGame() {
        const saveData = {
            currentChapter: this.currentChapter,
            currentNode: this.currentNode,
            collectedGems: this.collectedGems,
            playerScore: this.playerScore,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('foguang_ai_save', JSON.stringify(saveData));
        // 存檔後立即更新「繼續遊戲」按鈕狀態（不必等下次重新整理）
        this.refreshContinueButton();
        alert('✅ 遊戲進度已儲存！');
        console.log('💾 儲存進度:', saveData);
    }

    // 依是否有存檔，顯示或隱藏標題畫面的「繼續遊戲」按鈕
    refreshContinueButton() {
        const continueBtn = document.getElementById('continue-btn');
        if (!continueBtn) return;
        const hasSave = !!localStorage.getItem('foguang_ai_save');
        continueBtn.style.display = hasSave ? 'flex' : 'none';
    }

    loadGame() {
        const saveDataStr = localStorage.getItem('foguang_ai_save');
        
        if (!saveDataStr) {
            alert('❌ 沒有找到儲存的進度！');
            return;
        }

        try {
            const saveData = JSON.parse(saveDataStr);
            
            this.currentChapter = saveData.currentChapter;
            this.currentNode = saveData.currentNode;
            this.collectedGems = saveData.collectedGems;
            this.playerScore = saveData.playerScore;

            this.showScreen('game-screen');
            this.loadNode(this.currentChapter, this.currentNode);

            // 還原章節標題（原本讀檔沒做，會顯示成上一次的章節）
            const chapterNames = {
                'prologue': '序章',
                'chapter1': '第一章：大一',
                'chapter2': '第二章：大二',
                'chapter3': '第三章：大四',
                'ending': '結局'
            };
            this.updateChapterDisplay(chapterNames[this.currentChapter] || '');

            this.updateGemsDisplay();

            alert('✅ 進度讀取成功！');
            console.log('📂 讀取進度:', saveData);
            
            this.toggleMenu();

        } catch (error) {
            console.error('讀取進度失敗:', error);
            alert('❌ 進度檔案損壞，無法讀取！');
        }
    }

    returnToTitle() {
        if (confirm('確定要回到標題畫面嗎?未儲存的進度將會遺失。')) {
            // 停止音訊
            this.stopAudio();
            this.stopBackgroundMusic();
        
            // 只有在選單開啟時才關閉它（從結局選項呼叫時選單是關著的，不可無條件 toggle）
            const menu = document.getElementById('game-menu');
            if (menu && menu.classList.contains('active')) {
                this.toggleMenu();
            }
        
            // 切換到標題畫面（showScreen 會自動播放標題音樂）
            this.showScreen('title-screen');
        
            // 重置遊戲狀態(可選)
            this.currentScene = null;
        }
    }
}

// ===== 全域遊戲實例 =====
const game = new FoguangGame();

// ===== 頁面載入完成後初始化 =====
window.addEventListener('DOMContentLoaded', () => {
    game.init();
});