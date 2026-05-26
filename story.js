// ===== 佛光尋光記：三好之旅 AI 互動版 =====
// 故事資料檔案

const STORY_DATA = {
    // ===== 序章 =====
    prologue: {
        p1: {
            id: 'p1',
            background: 'images/體育館.png',
            characters: {
                center: 'images/星雲大師.png'
            },
            speaker: '星雲大師使者',
            text: '孩子，人生的路途，唯有心存善念，口吐芬芳，身行好事，方能圓滿。',
            audio: 'music/人聲/星雲大師使者/P1.MP3',
            next: 'p2'
        },
        p2: {
            id: 'p2',
            background: 'images/體育館.png',
            characters: {
                left: 'images/星雲大師.png',
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '（揉眼睛）剛剛...是在做夢嗎？台上好像有一道金光...',
            audio: 'music/人聲/玩家/G1.MP3',
            next: 'p3'
        },
        p3: {
            id: 'p3',
            background: 'images/體育館.png',
            characters: {
                center: 'images/星雲大師.png'
            },
            speaker: '星雲大師使者',
            text: '這不是夢。我交給你一塊石板，你需要在大學四年中，找回「三好之石」。',
            audio: 'music/人聲/星雲大師使者/P2.MP3',
            next: 'p4'
        },
        p4: {
            id: 'p4',
            background: 'images/體育館.png',
            characters: {
                center: 'images/星雲大師.png'
            },
            speaker: '星雲大師使者',
            text: '只有真正實踐「做好事、說好話、存好心」，才能點亮每一顆寶石。去吧，用你的行動證明自己。',
            audio: 'music/人聲/星雲大師使者/P3.MP3',
            next: 'p5'
        },
        p5: {
            id: 'p5',
            background: 'images/體育館.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '（握著石板）好神奇...我一定要找到這三顆寶石！',
            audio: 'music/人聲/玩家/G2.MP3',
            nextChapter: 'chapter1',
            nextNode: 'c1_1'
        }
    },

    // ===== 第一章：大一 - 做好事 =====
    chapter1: {
        c1_1: {
            id: 'c1_1',
            background: 'images/教室.png',
            characters: {
                center: 'images/睡著女大生.png'
            },
            speaker: '旁白',
            text: '大一的生活讓你忙得焦頭爛額。這天下午，你累倒在教室睡著了...',
            next: 'c1_2'
        },
        c1_2: {
            id: 'c1_2',
            background: 'images/教室.png',
            characters: {
                center: 'images/女大生大喊.png',
                
            },
            speaker: '同學',
            text: '我的 AirPods Pro 不見了！那是我朋友送的畢業禮物啊！怎麼辦？',
            audio: 'music/人聲/耳機女/A1.MP3',
            next: 'c1_3'
        },
        c1_3: {
            id: 'c1_3',
            background: 'images/教室.png',
            characters: {
                center: 'images/女大生大喊.png'
            },
            speaker: '同學',
            text: '（急得快哭了）剛剛還在的...一定是掉在教室裡了！',
            audio: 'music/人聲/耳機女/A2.MP3',
            next: 'c1_ai'
        },
        c1_ai: {
            id: 'c1_ai',
            background: 'images/教室.png',
            characters: {
                center: 'images/男大學生.png',
                
            },
            speaker: '旁白',
            text: '這是你展現「做好事」的時刻。你會怎麼做？',
            aiChallenge: {
                prompt: '情境：同學找不到 AirPods Pro 很著急。請輸入你的「行動」，展現「做好事」的精神。',
                hint: '提示：請具體描述你的行動。例如：「我幫你找」、「我們一起找垃圾桶」、「我去看看地板」、「別急，我陪你找」。',
                context: '大一新生在教室裡睡著後醒來，發現同學的 AirPods Pro 不見了，同學很著急。這是展現「身-做好事」的機會。',
                gemType: 'good_deed',
                validation: {
                    positivePatterns: [
                        /(幫|協助|陪|一起).*(找|看|尋)/,
                        /(去|檢查|翻).*(垃圾桶|地板|角落|桌|抽屜)/,
                        /(別急|冷靜).*(幫|找)/,
                        /(我們|咱們).*(一起|合作)/
                    ],
                    negativePatterns: [
                        /(不|沒空|懶|自己).*(幫|找|管)/,
                        /(好笑|活該|白痴|笨)/,
                        /(無視|走開|離開)/,
                        /(再買|算了)/
                    ]
                }
            },
            aiSuccess: 'c1_success_1',
            aiFail: 'c1_ai'
        },
        c1_success_1: {
            id: 'c1_success_1',
            background: 'images/教室.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '（放下背包，開始認真搜尋）讓我來幫你找找看！',
            audio: 'music/人聲/玩家/G3.MP3',
            next: 'c1_success_2'
        },
        c1_success_2: {
            id: 'c1_success_2',
            background: 'images/教室.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/遺失的耳機.png'
            },
            speaker: '你',
            text: '（在垃圾桶旁邊找到了）找到了！在這裡！',
            audio: 'music/人聲/玩家/G4.MP3',
            next: 'c1_success_3'
        },
        c1_success_3: {
            id: 'c1_success_3',
            background: 'images/教室.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/女大生大喊.png'
            },
            speaker: '同學',
            text: '太感謝你了！你真是好人！我以後一定會記得你的恩情！',
            audio: 'music/人聲/耳機女/A3.MP3',
            next: 'c1_success_4'
        },
        c1_success_4: {
            id: 'c1_success_4',
            background: 'images/教室.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '旁白',
            text: '一道綠光從石板中閃現...你獲得了【善行之石】！原來，好事就是純粹的伸出援手。',
            gem: 'good_deed',
            nextChapter: 'chapter2',
            nextNode: 'c2_1'
        }
    },

    // ===== 第二章：大二 - 說好話 =====
    chapter2: {
        c2_1: {
            id: 'c2_1',
            background: 'images/走廊的盡頭是課外組.png',
            characters: {
                center: 'images/女大生拿著資料.png'
            },
            speaker: '旁白',
            text: '大二了，為了社團活動你忙著跑行政流程。今天你要把企劃書送到課外活動組。',
            next: 'c2_2'
        },
        c2_2: {
            id: 'c2_2',
            background: 'images/走廊的盡頭是課外組.png',
            characters: {
                left: 'images/女大生拿著資料.png',
                right: 'images/熱心的學長.png'
            },
            speaker: '學長',
            text: '課外活動組就在走廊盡頭。記得要有禮貌喔，師長們很重視這個。',
            audio: 'music/人聲/學長.MP3',
            next: 'c2_3'
        },
        c2_3: {
            id: 'c2_3',
            background: 'images/課外活動組.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '（深吸一口氣）好，我準備好了。這是展現「說好話」的時刻！',
            audio: 'music/人聲/玩家/G5.MP3',
            next: 'c2_ai'
        },
        c2_ai: {
            id: 'c2_ai',
            background: 'images/課外活動組.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/課外哥哥姐姐.png'
            },
            speaker: '旁白',
            text: '你走進課外活動組辦公室。你會怎麼說？',
            aiChallenge: {
                prompt: '情境：你要繳交企劃書給師長。請輸入你的「話語」，展現「說好話」的禮貌與智慧。',
                hint: '提示：進入辦公室的基本禮儀是什麼？問候對象（老師/哥哥姐姐）+ 目的（交企劃）+ 禮貌結語（謝謝/辛苦）。',
                context: '大二學生要到課外活動組繳交社團企劃書。這是展現「口-說好話」的機會。',
                gemType: 'good_word',
                validation: {
                    positivePatterns: [
                        /(老師|學長|姐|哥|主任).*(好|您好)/,
                        /(請問|麻煩|不好意思|打擾).*(交|給).*(企劃|資料)/,
                        /(謝謝|辛苦).*(老師|您)/,
                        /(交|給).*(老師|哥哥|姐姐)/
                    ],
                    negativePatterns: [
                        /(喂|欸|那個).*(在哪|收下)/,
                        /(快|隨便|丟).*(收|拿)/,
                        /(不知道|煩)/,
                        /^(企劃|資料)/
                    ]
                }
            },
            aiSuccess: 'c2_success_1',
            aiFail: 'c2_ai'
        },
        c2_success_1: {
            id: 'c2_success_1',
            background: 'images/課外活動組.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/課外哥哥姐姐.png'
            },
            speaker: '你',
            text: '（有禮貌地問候並說明來意）',
            next: 'c2_success_2'
        },
        c2_success_2: {
            id: 'c2_success_2',
            background: 'images/課外活動組.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/課外哥哥姐姐.png'
            },
            speaker: '師長',
            text: '（親切地微笑）你真有禮貌！企劃書我收下了，祝你們活動順利。',
            audio: 'music/人聲/師長.mp3',
            next: 'c2_success_3'
        },
        c2_success_3: {
            id: 'c2_success_3',
            background: 'images/課外活動組.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '旁白',
            text: '一道藍光從石板中綻放...你獲得了【慧語之石】！原來，語言的尊重能建立溫暖的連結。',
            gem: 'good_word',
            nextChapter: 'chapter3',
            nextNode: 'c3_1'
        }
    },

    // ===== 第三章：大四 - 存好心 =====
    chapter3: {
        c3_1: {
            id: 'c3_1',
            background: 'images/大家都再往前走 我好像少了甚麼.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '（看著石板）明明做了好事、說了好話，為什麼還是沒拿到最後一顆石頭？',
            audio: 'music/人聲/玩家/G6.MP3',
            next: 'c3_2'
        },
        c3_2: {
            id: 'c3_2',
            background: 'images/大家都再往前走 我好像少了甚麼.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '難道是因為我平常愛講地獄梗？還是我太功利了？',
            audio: 'music/人聲/玩家/G7.MP3',
            next: 'c3_3'
        },
        c3_3: {
            id: 'c3_3',
            background: 'images/一起畢業.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/女大生大喊.png'
            },
            speaker: '同學',
            text: '（跑過來）嘿！還記得我嗎？大一你幫我找耳機的時候，我就覺得你心地很好。',
            audio: 'music/人聲/耳機女/A4.MP3',
            next: 'c3_4'
        },
        c3_4: {
            id: 'c3_4',
            background: 'images/一起畢業.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/女大生大喊.png'
            },
            speaker: '同學',
            text: '雖然你平常愛開玩笑，但我知道你內心其實很溫柔。今天是我們畢業的日子，真想好好謝謝你！',
            audio: 'music/人聲/耳機女/A5.MP3',
            next: 'c3_ai'
        },
        c3_ai: {
            id: 'c3_ai',
            background: 'images/一起畢業.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/女大生大喊.png'
            },
            speaker: '旁白',
            text: '這是你展現「存好心」的時刻。你會怎麼回應？',
            aiChallenge: {
                prompt: '情境：曾經受你幫助的同學來道謝。請輸入你的「內心想法」或「祝福」，展現「存好心」的真誠。',
                hint: '提示：這是一個感動的時刻。請輸入「祝福」、「感謝緣分」、「恭喜畢業」或「希望你未來順利」等話語。',
                context: '畢業典禮當天，大一時受過你幫助的同學來道謝，稱讚你內心溫柔。這是展現「意-存好心」的機會。',
                gemType: 'good_heart',
                validation: {
                    positivePatterns: [
                        /(祝|願|希望).*(快樂|順利|未來|前程|好運)/,
                        /(恭喜).*(畢業)/,
                        /(謝謝|感謝).*(緣分|遇見|朋友)/,
                        /(不用謝|小事|沒關係).*(開心|好)/,
                        /(一起|我們).*(加油|努力)/
                    ],
                    negativePatterns: [
                        /(還我|錢|回報)/,
                        /(終於|滾|再見|不送)/,
                        /(地獄|梗|笑死)/,
                        /(算了|隨便)/
                    ]
                }
            },
            aiSuccess: 'c3_success_1',
            aiFail: 'c3_ai'
        },
        c3_success_1: {
            id: 'c3_success_1',
            background: 'images/一起畢業.png',
            characters: {
                left: 'images/男大學生.png',
                right: 'images/面帶微笑的一個同學.png'
            },
            speaker: '你',
            text: '（真誠地回應）',
            next: 'c3_success_2'
        },
        c3_success_2: {
            id: 'c3_success_2',
            background: 'images/一起畢業.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '（恍然大悟）原來...存好心不是刻意的任務，而是發自內心的祝福！',
            audio: 'music/人聲/玩家/G8.MP3',
            next: 'c3_success_3'
        },
        c3_success_3: {
            id: 'c3_success_3',
            background: 'images/一起畢業.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '旁白',
            text: '金色的光芒從石板中湧現...你獲得了【淨念之石】！三顆寶石終於集齊了！',
            gem: 'good_heart',
            nextChapter: 'ending',
            nextNode: 'e1'
        }
    },

    // ===== 結局 =====
    ending: {
        e1: {
            id: 'e1',
            background: 'images/一起畢業.png',
            characters: {
                center: 'images/星雲大師.png'
            },
            speaker: '星雲大師使者',
            text: '（聲音再次響起）你從迷惘到覺悟，已將「三好」融入生命。',
            audio: 'music/人聲/星雲大師使者/P4.MP3',
            backgroundMusic: 'music/校園輕音樂.mp3',  // 結局背景音樂
            next: 'e2'
        },
        e2: {
            id: 'e2',
            background: 'images/一起畢業.png',
            characters: {
                center: 'images/星雲大師.png'
            },
            speaker: '星雲大師使者',
            text: '這三顆寶石不是目標，而是你修行的見證。真正的寶藏，在你心中。',
            audio: 'music/人聲/星雲大師使者/P5.MP3',
            next: 'e3'
        },
        e3: {
            id: 'e3',
            background: 'images/一起畢業.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '你',
            text: '（握著發光的石板）謝謝您，大師。我明白了，三好不是任務，而是生活的一部分。',
            audio: 'music/人聲/玩家/G9.MP3',
            next: 'e4'
        },
        e4: {
            id: 'e4',
            background: 'images/一起畢業.png',
            characters: {
                center: 'images/男大學生.png'
            },
            speaker: '旁白',
            text: '— 尋光之旅 完 —\n\n感謝遊玩「佛光尋光記：三好之旅 AI 互動版」\n\n作者：許彧銘、許慧柔\nAI 整合版本：2025/11/28',
            choices: [
    {
        text: '🏠 回到標題畫面',
        type: 'neutral',
        next: null,
        action: () => game.returnToTitle()
    }
]
        }
    }
};