const cardContainer = document.getElementById('card-container');
const themeSelector = document.getElementById('theme-selector');
let selectedTheme = 'anime'; // 默認主題為動漫主題
let firstCard, secondCard; // 用於比較的兩張卡片
let lockBoard = false; // 防止在比對期間翻更多卡片
let score = 0;
let timeUsed = 0; // 記錄玩家完成遊戲所花的時間（從 0 開始）
let timerInterval;
let matchedPairs = 0; // 記錄配對成功的對數
const totalPairs = 8; // 總共需要配對的對數
let bestRecord = localStorage.getItem('bestRecord') || null; // 從 localStorage 取得歷史最佳紀錄
let isPaused = false; // 用於判斷遊戲是否處於暫停狀態

// 聲音檔案
const matchSound = document.getElementById('match-sound');
const failSound = document.getElementById('fail-sound');

// 動漫主題的圖片
const animeImages = {
    front: 'anime_image/img1.jpg', // 正面圖片
    back: [
        'anime_image/img2.jpg', 'anime_image/img3.jpg', 'anime_image/img4.jpg', 'anime_image/img5.jpg',
        'anime_image/img6.jpg', 'anime_image/img7.jpg', 'anime_image/img8.jpg', 'anime_image/img9.jpg'
    ]
};

// 工具主題的圖片
const toolsImages = {
    front: 'tools/tools1.jpg', // 正面圖片
    back: [
        'tools/tools2.jpg', 'tools/tools3.jpg', 'tools/tools4.jpg', 'tools/tools5.jpg',
        'tools/tools6.jpg', 'tools/tools7.jpg', 'tools/tools8.jpg', 'tools/tools9.jpg'
    ]
};

// 生成一個包含兩次背面圖片的陣列，根據所選主題動態更新
let allBackImages = [];

// Fisher-Yates 洗牌算法，將陣列順序打亂
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // 交換位置
    }
    return array;
}

// 根據主題生成卡片
function generateCards() {
    // 根據選擇的主題更新圖片
    let frontImage;
    let backImages;
    if (selectedTheme === 'anime') {
        frontImage = animeImages.front;
        backImages = animeImages.back;
    } else if (selectedTheme === 'tools') {
        frontImage = toolsImages.front;
        backImages = toolsImages.back;
    }

    allBackImages = []; // 清空背面圖片陣列
    backImages.forEach(image => {
        allBackImages.push(image); // 第一次加入
        allBackImages.push(image); // 第二次加入
    });
    allBackImages = shuffle(allBackImages); // 隨機排列背面圖片

    // 清空現有卡片
    cardContainer.innerHTML = '';

    // 動態生成卡片
    for (let i = 0; i < 16; i++) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-back', allBackImages[i]); // 將背面圖片儲存為屬性
        card.innerHTML = `
            <div class="card-face card-front">
                <img src="${frontImage}" alt="卡牌正面">
            </div>
            <div class="card-face card-back">
                <img src="${allBackImages[i]}" alt="卡牌背面">
            </div>
        `;
        // 為卡片添加翻轉事件
        card.addEventListener('click', flipCard);
        cardContainer.appendChild(card);
    }
}

// 顯示卡片容器
function showCardContainer() {
    cardContainer.style.display = 'grid'; // 顯示卡片容器
}

// 翻轉卡片邏輯
function flipCard() {
    if (lockBoard || this === firstCard) return; // 如果正在比較或點擊同一張卡片，則不執行
    this.classList.add('flipped');

    if (!firstCard) {
        // 如果沒有翻第一張卡片
        firstCard = this;
    } else {
        // 如果已經翻了第一張卡片，現在翻第二張
        secondCard = this;
        lockBoard = true;

        // 檢查是否匹配
        checkForMatch();
    }
}

// 檢查兩張卡片是否匹配
function checkForMatch() {
    let isMatch = firstCard.getAttribute('data-back') === secondCard.getAttribute('data-back');
    
    if (isMatch) {
        disableCards(); // 禁用卡片點擊
        playSound('match');
    } else {
        unflipCards(); // 如果不匹配，將卡片翻回去
        playSound('fail');
    }
}

// 播放聲音
function playSound(type) {
    if (type === 'match') {
        matchSound.play();
    } else if (type === 'fail') {
        failSound.play();
    }
}

// 匹配後禁用卡片
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    resetBoard();
}

// 卡片不匹配時翻回去
function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

// 重置卡片狀態
function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

// 依次翻轉卡片
function flipCards(action, delay = 200) {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            if (action === 'show-back') {
                card.classList.add('flipped'); // 顯示背面
            } else if (action === 'show-front') {
                card.classList.remove('flipped'); // 顯示正面
            }
        }, index * delay); // 設置每張卡片的延遲時間
    });
}

// 當選擇主題時重新生成卡片
themeSelector.addEventListener('change', function () {
    selectedTheme = themeSelector.value; // 更新選擇的主題
    generateCards(); // 根據選擇主題生成卡片
});

// 按鈕功能 - 開始遊戲
document.getElementById('start-game').addEventListener('click', function () {
    generateCards(); // 重新生成卡片，並隨機打亂背面圖片
    showCardContainer(); // 顯示卡片容器
    flipCards('show-back', 200); // 依次翻轉顯示背面

    // 10 秒後翻回正面
    setTimeout(() => {
        flipCards('show-front', 200); // 依次翻回正面
    }, 10000); // 延遲 10 秒後翻回
});

// 顯示正面按鈕
document.getElementById('show-front').addEventListener('click', function () {
    flipCards('show-front', 200); // 依次翻回正面
});

// 顯示背面按鈕
document.getElementById('show-back').addEventListener('click', function () {
    flipCards('show-back', 200); // 依次翻轉顯示背面
});

// 初次加載時生成動漫主題的卡片
window.onload = function () {
    generateCards(); // 生成卡片，但初始不顯示
};

// 如果有最佳紀錄，顯示在右上角
if (bestRecord) {
    document.getElementById('best-record').innerText = `最佳紀錄: ${bestRecord} 秒`;
} else {
    document.getElementById('best-record').innerText = `最佳紀錄: -- 秒`;
}

// 更新分數
function updateScore(points) {
    score += points;
    document.getElementById('score').innerText = '分數: ' + score;
}

// 開始計時器（從 0 開始）
function startTimer() {
    timeUsed = 0; // 初始化已使用時間
    document.getElementById('timer').innerText = '時間: ' + timeUsed + '秒';

    timerInterval = setInterval(() => {
        if (!isPaused) { // 計時器只在未暫停狀態下運行
            timeUsed++; // 每秒增加
            document.getElementById('timer').innerText = '時間: ' + timeUsed + '秒';
        }
    }, 1000);
}

// 暫停遊戲
function pauseGame() {
    isPaused = !isPaused; // 切換暫停狀態
    const pauseButton = document.getElementById('pause-game');
    
    if (isPaused) {
        pauseButton.innerText = '恢復'; // 暫停狀態，按鈕顯示 "恢復"
        disableAllCards(); // 禁止所有卡片翻轉
        pauseCardAnimations(); // 暫停所有卡片的動畫
    } else {
        pauseButton.innerText = '暫停'; // 恢復狀態，按鈕顯示 "暫停"
        enableAllCards(); // 允許所有卡片翻轉
        resumeCardAnimations(); // 恢復所有卡片的動畫
    }
}

// 暫停所有卡片的翻轉動畫
function pauseCardAnimations() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('paused'); // 增加暫停的 CSS 樣式，讓翻轉動畫暫停
    });
}

// 恢復所有卡片的翻轉動畫
function resumeCardAnimations() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.remove('paused'); // 移除暫停的 CSS 樣式，恢復翻轉動畫
    });
}

// 重置遊戲
function resetGame() {
    clearInterval(timerInterval);
    score = 0;
    matchedPairs = 0; // 重置配對數
    timeUsed = 0; // 重置計時器
    isPaused = false; // 重置暫停狀態
    document.getElementById('pause-game').innerText = '暫停'; // 重置按鈕文字
    document.getElementById('timer').innerText = '時間: 0秒';
    document.getElementById('score').innerText = '分數: ' + score;
    // 可以在這裡重設卡片或其他遊戲狀態
    enableAllCards(); // 重新啟用卡片翻轉
}

// 禁用所有卡片
function disableAllCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.pointerEvents = 'none'; // 禁用卡片點擊
    });
}

// 啟用所有卡片
function enableAllCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.pointerEvents = 'auto'; // 啟用卡片點擊
    });
}

// 在遊戲開始時啟動計時器
document.getElementById('start-game').addEventListener('click', function () {
    startTimer(); // 開始計時
    updateScore(0); // 初始化分數
    matchedPairs = 0; // 初始化配對數量
});

// 暫停與恢復遊戲
document.getElementById('pause-game').addEventListener('click', function () {
    pauseGame(); // 暫停或恢復遊戲
});

// 重新開始遊戲
document.getElementById('restart-game').addEventListener('click', function () {
    resetGame(); // 重置遊戲
});

// 檢查兩張卡片是否匹配
function checkForMatch() {
    let isMatch = firstCard.getAttribute('data-back') === secondCard.getAttribute('data-back');
    
    if (isMatch) {
        disableCards(); // 禁用卡片點擊
        matchedPairs++; // 增加配對成功數
        playSound('match');
        checkGameOver(); // 檢查是否遊戲結束
    } else {
        unflipCards(); // 如果不匹配，將卡片翻回去
        playSound('fail');
    }
}

// 檢查遊戲是否結束
function checkGameOver() {
    if (matchedPairs === totalPairs) {
        clearInterval(timerInterval); // 停止計時
        let newRecordText = '';

        // 檢查是否破了紀錄
        if (!bestRecord || timeUsed < bestRecord) {
            bestRecord = timeUsed; // 更新最佳紀錄
            localStorage.setItem('bestRecord', bestRecord); // 保存到 localStorage
            newRecordText = ' NEW RECORD!';

            // 更新右上角顯示的最佳紀錄
            document.getElementById('best-record').innerText = `最佳紀錄: ${bestRecord} 秒`;
        }

        // 顯示遊戲完成訊息並告知玩家破紀錄
        Swal.fire({
            title: '恭喜你！',
            text: `全部配對成功！用時: ${timeUsed} 秒` + newRecordText,
            icon: 'success',
            confirmButtonText: '重新開始'
        }).then(() => {
            resetGame(); // 重置遊戲
        });
    }
}

// 配對失敗時翻回卡片
function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

// 禁用卡片點擊
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    resetBoard();
}

// 重置卡片狀態
function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}


// 當玩家完成遊戲時，生成一個分享的 URL
function generateShareLink(score, timeUsed) {
    // Twitter 分享訊息
    const tweetText = `我在這個配對遊戲中用了 ${timeUsed} 秒完成了所有配對！你能打破我的紀錄嗎？`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`;
    
    // Facebook 分享訊息
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(tweetText)}`;

    // 設置分享按鈕的 href 屬性
    document.getElementById('twitter-share').setAttribute('href', twitterUrl);
    document.getElementById('facebook-share').setAttribute('href', fbUrl);
}

// 在遊戲結束時，生成分享連結
function checkGameOver() {
    if (matchedPairs === totalPairs) {
        clearInterval(timerInterval); // 停止計時
        let newRecordText = '';

        // 檢查是否破了紀錄
        if (!bestRecord || timeUsed < bestRecord) {
            bestRecord = timeUsed; // 更新最佳紀錄
            localStorage.setItem('bestRecord', bestRecord); // 保存到 localStorage
            newRecordText = ' NEW RECORD!';

            // 更新右上角顯示的最佳紀錄
            document.getElementById('best-record').innerText = `最佳紀錄: ${bestRecord} 秒`;
        }

        // 生成分享的 URL
        generateShareLink(score, timeUsed);

        // 顯示遊戲完成訊息並告知玩家破紀錄
        Swal.fire({
            title: '恭喜你！',
            text: `全部配對成功！用時: ${timeUsed} 秒` + newRecordText,
            icon: 'success',
            confirmButtonText: '重新開始'
        }).then(() => {
            resetGame(); // 重置遊戲
        });
    }
}
