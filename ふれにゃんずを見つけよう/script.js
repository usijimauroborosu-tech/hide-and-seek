// ゲームの状態管理
        let gameState = {
            isPlaying: false,
            startTime: 0,
            remainingTime: 60.0,
            caughtCharacters: new Set(),
            missCount: 0,
            gameInterval: null,
            spawnInterval: null,
            activeCharacters: new Map()
        };

        // キャラクター設定（実際の画像パスに変更してください）
        const characterImages = [
            'character1.jpg',  // キャラクター1
            'character2.jpg',  // キャラクター2
            'character3.jpg',  // キャラクター3
            'character4.jpg',  // キャラクター4
            'character5.jpg',  // キャラクター5
            'character6.jpg',  // キャラクター6
            'character7.jpg'   // キャラクター7
        ];

        const badCharacterImage = 'bad_character.jpg';  // ハズレキャラクター
        const backgroundImage = 'background.jpg';       // 背景画像

        // デフォルト画像（色付きの丸）
        const defaultColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8'
        ];
        const badCharacterColor = '#2C3E50';

        // 背景画像の設定
        function setupBackground() {
            const img = new Image();
            img.onload = function() {
                document.body.style.backgroundImage = `url(${backgroundImage})`;
            };
            img.onerror = function() {
                document.body.style.background = '#4CAF50'; // デフォルトの緑色
            };
            img.src = backgroundImage;
        }

        // キャラクター画像の設定
        function setupCharacterImage(element, imageIndex, isBadCharacter = false) {
            const img = new Image();
            
            if (isBadCharacter) {
                img.onload = function() {
                    element.style.backgroundImage = `url(${badCharacterImage})`;
                };
                img.onerror = function() {
                    element.style.backgroundColor = badCharacterColor;
                    element.style.backgroundImage = 'none';
                    element.innerHTML = '💀';
                    element.style.display = 'flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.fontSize = element.classList.contains('bad-preview') ? '20px' : '40px';
                };
                img.src = badCharacterImage;
            } else {
                img.onload = function() {
                    element.style.backgroundImage = `url(${characterImages[imageIndex]})`;
                };
                img.onerror = function() {
                    element.style.backgroundColor = defaultColors[imageIndex];
                    element.style.backgroundImage = 'none';
                    element.innerHTML = '🐹';
                    element.style.display = 'flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.fontSize = element.classList.contains('preview-character') ? '24px' : '40px';
                };
                img.src = characterImages[imageIndex];
            }
        }

        // プレビューキャラクターの設定
        function setupCharacterPreview() {
            const previewContainer = document.getElementById('characterPreview');
            const badPreview = document.getElementById('badCharacterPreview');
            
            // 正常キャラクターのプレビュー
            for (let i = 0; i < 7; i++) {
                const previewElement = document.createElement('div');
                previewElement.className = 'preview-character';
                setupCharacterImage(previewElement, i, false);
                previewContainer.appendChild(previewElement);
            }
            
            // ハズレキャラクターのプレビュー
            setupCharacterImage(badPreview, 0, true);
        }

        // ゲーム開始
        function startGame() {
            gameState.isPlaying = true;
            gameState.startTime = Date.now();
            gameState.remainingTime = 60.0;
            gameState.caughtCharacters.clear();
            gameState.missCount = 0;
            gameState.activeCharacters.clear();

            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'block';
            document.getElementById('resultScreen').style.display = 'none';

            // タイマー開始（制限時間カウントダウン）
            gameState.gameInterval = setInterval(updateTimer, 100);
            
            // キャラクター出現開始（0.5秒間隔で安定出現）
            spawnCharacter();
            gameState.spawnInterval = setInterval(spawnCharacter, 500);

            setupBackground();
        }

        // タイマー更新（制限時間カウントダウン）
        function updateTimer() {
            if (!gameState.isPlaying) return;
            
            const elapsed = (Date.now() - gameState.startTime) / 1000;
            gameState.remainingTime = Math.max(0, 60.0 - elapsed);
            
            const timeDisplay = document.getElementById('timeDisplay');
            const timerElement = document.getElementById('timer');
            
            timerElement.textContent = gameState.remainingTime.toFixed(1);
            
            // 残り10秒以下で警告表示
            if (gameState.remainingTime <= 10) {
                timeDisplay.classList.add('warning');
            } else {
                timeDisplay.classList.remove('warning');
            }
            
            // 時間切れ
            if (gameState.remainingTime <= 0) {
                endGame(false, 'timeout');
            }
        }

        // キャラクター出現（修正版）
        function spawnCharacter() {
            if (!gameState.isPlaying) return;

            // 残りキャラクター数を先に計算
            const remainingCharacters = [];
            for (let i = 0; i < 7; i++) {
                if (!gameState.caughtCharacters.has(i)) {
                    remainingCharacters.push(i);
                }
            }

            // 空いている穴を探す
            const availableHoles = [];
            for (let i = 0; i < 9; i++) {
                if (!gameState.activeCharacters.has(i)) {
                    availableHoles.push(i);
                }
            }

            // 残りキャラクター数に応じて上書き戦略を変更
            let shouldForceSpawn = false;
            
            if (remainingCharacters.length === 1) {
                // 最後の1匹の場合：空き穴が7個以下で上書き（ほぼ常に出現）
                shouldForceSpawn = availableHoles.length <= 7;
            } else if (remainingCharacters.length <= 2) {
                // 残り2匹の場合：空き穴が5個以下で上書き
                shouldForceSpawn = availableHoles.length <= 5;
            } else {
                // 通常時：空き穴が2個以下で上書き（元のロジック）
                shouldForceSpawn = availableHoles.length <= 2;
            }

            if (shouldForceSpawn && availableHoles.length < 9) {
                const activeHoles = Array.from(gameState.activeCharacters.keys());
                if (activeHoles.length > 0) {
                    const randomActiveHole = activeHoles[Math.floor(Math.random() * activeHoles.length)];
                    hideCharacter(randomActiveHole);
                    availableHoles.push(randomActiveHole);
                }
            }

            // どうしても空き穴がない場合は強制的に作る
            if (availableHoles.length === 0) {
                const activeHoles = Array.from(gameState.activeCharacters.keys());
                if (activeHoles.length > 0) {
                    const randomActiveHole = activeHoles[Math.floor(Math.random() * activeHoles.length)];
                    hideCharacter(randomActiveHole);
                    availableHoles.push(randomActiveHole);
                } else {
                    return;
                }
            }

            const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
            const characterElement = document.getElementById(`char${holeIndex}`);

            // 最後の1匹の場合は出現確率を上げる
            let characterType;
            if (remainingCharacters.length > 0) {
                let spawnProbability;
                if (remainingCharacters.length === 1) {
                    spawnProbability = 0.8; // 最後の1匹は80%の確率
                } else if (remainingCharacters.length <= 2) {
                    spawnProbability = 0.6; // 残り2匹は60%の確率
                } else {
                    spawnProbability = 0.45; // 通常時は45%の確率
                }
                
                characterType = Math.random() < spawnProbability
                    ? remainingCharacters[Math.floor(Math.random() * remainingCharacters.length)]
                    : -1;
            } else {
                characterType = -1;
            }

            // キャラクター画像設定
            characterElement.innerHTML = '';
            characterElement.style.backgroundColor = '';
            characterElement.style.backgroundImage = '';
            
            if (characterType === -1) {
                setupCharacterImage(characterElement, 0, true);
            } else {
                setupCharacterImage(characterElement, characterType, false);
            }

            // キャラクターを表示
            characterElement.classList.add('show');
            gameState.activeCharacters.set(holeIndex, characterType);

            // 最後の1匹の場合は表示時間を短くして回転を速める
            let showTime;
            if (remainingCharacters.length === 1) {
                showTime = 400 + Math.random() * 400; // 0.4～0.8秒（短縮）
            } else {
                showTime = 500 + Math.random() * 700; // 0.5～1.2秒（元のまま）
            }
            
            setTimeout(() => {
                if (gameState.activeCharacters.has(holeIndex)) {
                    hideCharacter(holeIndex);
                }
            }, showTime);
        }

        // キャラクターを隠す
        function hideCharacter(holeIndex) {
            const characterElement = document.getElementById(`char${holeIndex}`);
            characterElement.classList.remove('show');
            gameState.activeCharacters.delete(holeIndex);
        }

        // 穴をタッチした時の処理
        function hitHole(holeIndex) {
            if (!gameState.isPlaying || !gameState.activeCharacters.has(holeIndex)) return;

            const characterType = gameState.activeCharacters.get(holeIndex);
            const characterElement = document.getElementById(`char${holeIndex}`);
            
            characterElement.classList.add('caught');

            if (characterType === -1) {
                // ハズレキャラクター
                gameState.missCount++;
                document.getElementById('missCount').textContent = gameState.missCount;
                
                if (gameState.missCount >= 2) {
                    endGame(false, 'miss');
                }
            } else {
                // 正しいキャラクター
                gameState.caughtCharacters.add(characterType);
                document.getElementById('caughtCount').textContent = gameState.caughtCharacters.size;
                
                if (gameState.caughtCharacters.size >= 7) {
                    endGame(true, 'clear');
                }
            }

            hideCharacter(holeIndex);
        }

        // ゲーム終了
        function endGame(success, reason) {
            gameState.isPlaying = false;
            clearInterval(gameState.gameInterval);
            clearInterval(gameState.spawnInterval);

            // すべてのキャラクターを隠す
            gameState.activeCharacters.forEach((_, holeIndex) => {
                hideCharacter(holeIndex);
            });

            document.getElementById('gameScreen').style.display = 'none';
            document.getElementById('resultScreen').style.display = 'block';

            const gameOverMessage = document.getElementById('gameOverMessage');
            
            if (success) {
                const clearTime = 60.0 - gameState.remainingTime;
                document.getElementById('finalTime').textContent = clearTime.toFixed(1);
                gameOverMessage.style.display = 'none';

                // レベル判定
                const levelElement = document.getElementById('levelResult');
                if (clearTime <= 12) {
                    levelElement.textContent = '三つ星⭐⭐⭐';
                    levelElement.className = 'level expert';
                } else if (clearTime <= 20) {
                    levelElement.textContent = '二つ星⭐⭐';
                    levelElement.className = 'level intermediate';
                } else {
                    levelElement.textContent = '一つ星⭐';
                    levelElement.className = 'level beginner';
                }
            } else {
                document.getElementById('finalTime').textContent = '---';
                document.getElementById('levelResult').textContent = '';
                gameOverMessage.style.display = 'block';
                
                if (reason === 'miss') {
                    gameOverMessage.innerHTML = 'ゲームオーバー！<br>肉球を2回タッチしました';
                } else if (reason === 'timeout') {
                    gameOverMessage.innerHTML = 'ゲームオーバー！<br>制限時間切れです';
                }
            }
        }

        // ゲームリセット
        function resetGame() {
            document.getElementById('resultScreen').style.display = 'none';
            document.getElementById('startScreen').style.display = 'block';
            
            // UIリセット
            document.getElementById('timer').textContent = '60.0';
            document.getElementById('timeDisplay').classList.remove('warning');
            document.getElementById('caughtCount').textContent = '0';
            document.getElementById('missCount').textContent = '0';
            
            // すべてのキャラクターを隠す
            for (let i = 0; i < 9; i++) {
                const characterElement = document.getElementById(`char${i}`);
                characterElement.classList.remove('show', 'caught');
                characterElement.innerHTML = '';
                characterElement.style.backgroundColor = '';
                characterElement.style.backgroundImage = '';
            }
        }

        // 初期化
        window.onload = function() {
            setupBackground();
            setupCharacterPreview();
        };