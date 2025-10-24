document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const menuScreen = document.getElementById('menu-screen');
    const gameCards = document.querySelectorAll('.game-card');
    const gameAreas = document.querySelectorAll('.game-area');
    const globalControls = document.getElementById('global-controls');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const backBtn = document.getElementById('back-btn');

    // Game State
    let currentGame = null;
    let gameInstances = {
        flappy: null,
        pong: null,
        memory: null
    };

    // Game Loaders
    const gameLoaders = {
        flappy: loadFlappyBird,
        pong: loadPong,
        memory: loadMemoryGame
    };

    // =======================================================
    // === FLAPPY BIRD GAME CLASS & LOADER (ZORLUK DÜZELTİLDİ) ===
    // =======================================================
    
    function loadFlappyBird() {
        const gameArea = document.getElementById('flappy-game-area');
        // HTML yapısını sadece bir kez yükle
        gameArea.innerHTML = `
            <div class="flappy-container game-container">
                <div class="score">Score: <span id="flappy-score">0</span></div>
                <div class="message" id="flappy-message">Press START to play</div>
                <div class="ground"></div>
                <div class="bird" id="flappy-bird">
                    <div class="beak"></div>
                    <div class="eye"></div>
                </div>
                <div class="pipe-container" id="flappy-pipes"></div>
            </div>
        `;
        // Her oyuna giriş yapıldığında yeni instance oluştur
        gameInstances.flappy = new FlappyBird(startBtn, pauseBtn);
    }

    class FlappyBird {
        constructor(startBtn, pauseBtn) {
            this.bird = document.getElementById('flappy-bird');
            this.pipeContainer = document.getElementById('flappy-pipes');
            this.message = document.getElementById('flappy-message');
            this.scoreDisplay = document.getElementById('flappy-score');
            this.startBtn = startBtn;
            this.pauseBtn = pauseBtn;

            this.GAME_WIDTH = 400;
            this.GAME_HEIGHT = 600;
            this.BIRD_SIZE = 40;
            this.PIPE_WIDTH = 60;
            this.PIPE_GAP = 200;
            this.GROUND_HEIGHT = 50;
            this.GRAVITY = 0.5;
            this.JUMP_STRENGTH = -10;
            this.GAME_LOOP_INTERVAL = 20; // 20ms frame süresi

            // ZORLUK AYARLARI
            this.BASE_PIPE_SPEED = 3;       // Başlangıç boru hızı (pixels/frame)
            this.DIFFICULTY_INCREASE = 0.8; // Her zorluk artışında hıza eklenecek miktar
            this.DIFFICULTY_SCORE_INTERVAL = 3; // Kaç skorda bir zorluk artacak
            this.PIPE_INTERVAL_MS_INITIAL = 1500; // Başlangıç boru spawn süresi

            // Borular arasındaki yatay mesafeyi sabit tutmak için hesaplama
            this.BASE_DISTANCE = (this.PIPE_INTERVAL_MS_INITIAL / this.GAME_LOOP_INTERVAL) * this.BASE_PIPE_SPEED;
            this.PIPE_INTERVAL_MS = this.PIPE_INTERVAL_MS_INITIAL; // Mevcut aralık

            this.pipes = [];
            this.gameLoopId = null;
            this.pipeGeneratorId = null;
            this.isRunning = false;
            this.isPaused = false;
            this.lastDifficultyScore = 0; 

            this.resetGame();
            this.setupEventListeners(); // Sadece handler'ları tanımlar
        }

        setupEventListeners() {
            this.handleKeyPress = (e) => {
                if (!this.isRunning || this.isPaused) return;
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.jump();
                }
            };
            this.handleClick = (e) => {
                if (!this.isRunning || this.isPaused) return;
                if (e.target.closest('#flappy-game-area')) {
                     e.preventDefault();
                    this.jump();
                }
            };
        }

        // Dinleyicileri ekle
        addEventListeners() {
            document.addEventListener('keydown', this.handleKeyPress);
            document.addEventListener('click', this.handleClick);
        }

        // Dinleyicileri kaldır
        removeEventListeners() {
            document.removeEventListener('keydown', this.handleKeyPress);
            document.removeEventListener('click', this.handleClick);
        }

        jump() {
            this.velocity = this.JUMP_STRENGTH;
            this.bird.style.transform = 'rotate(-25deg)';
        }
        
        start = () => {
            if (this.isRunning) return;
            
            this.resetGame();
            this.addEventListeners(); // Zıplama dinleyicilerini yeniden ekle
            
            this.isRunning = true;
            this.isPaused = false;
            this.message.style.display = 'none';
            this.bird.classList.add('flying');
            
            this.gameLoopId = setInterval(() => this.gameLoop(), this.GAME_LOOP_INTERVAL);
            this.pipeGeneratorId = setInterval(() => this.createPipe(), this.PIPE_INTERVAL_MS); 
        };

        pause() {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                clearInterval(this.gameLoopId);
                clearInterval(this.pipeGeneratorId);
                this.message.textContent = "GAME PAUSED";
                this.message.style.display = 'block';
                this.bird.classList.remove('flying');
            } else {
                this.gameLoopId = setInterval(() => this.gameLoop(), this.GAME_LOOP_INTERVAL);
                this.pipeGeneratorId = setInterval(() => this.createPipe(), this.PIPE_INTERVAL_MS); 
                this.message.style.display = 'none';
                this.bird.classList.add('flying');
            }
        }

        stop() {
            this.isRunning = false;
            this.isPaused = false;
            
            if (this.gameLoopId) clearInterval(this.gameLoopId);
            if (this.pipeGeneratorId) clearInterval(this.pipeGeneratorId);
            
            this.bird.classList.remove('flying');
            this.bird.style.transform = 'rotate(0deg)';
            
            this.message.textContent = "Press START to play";
            this.message.style.display = 'block';
            this.removeEventListeners(); // Dinleyicileri kaldır
        }

        checkDifficulty() {
            if (this.score > this.lastDifficultyScore && this.score % this.DIFFICULTY_SCORE_INTERVAL === 0) {
                
                // 1. Hızı Arttır
                this.PIPE_SPEED += this.DIFFICULTY_INCREASE; 
                this.lastDifficultyScore = this.score;

                // 2. YENİ: Yeni Spawn Aralığını Hesapla (BASE_DISTANCE sabit kalacak)
                const newFramesBetweenPipes = this.BASE_DISTANCE / this.PIPE_SPEED;
                const newIntervalMS = newFramesBetweenPipes * this.GAME_LOOP_INTERVAL;
                this.PIPE_INTERVAL_MS = newIntervalMS; // Güncel değeri sakla
                
                // 3. Boru Oluşturucuyu Yeniden Başlat (Yeni, daha kısa aralıkta)
                if (this.pipeGeneratorId) {
                    clearInterval(this.pipeGeneratorId);
                }
                this.pipeGeneratorId = setInterval(() => this.createPipe(), this.PIPE_INTERVAL_MS);
            }
        }

        movePipes() {
             for (let i = this.pipes.length - 1; i >= 0; i--) {
                const pipe = this.pipes[i];
                pipe.x += this.PIPE_SPEED;
                pipe.element.style.right = pipe.x + 'px';

                if (!pipe.passed && pipe.x > 50 + this.BIRD_SIZE) {
                    pipe.passed = true;
                    this.score++;
                    this.scoreDisplay.textContent = this.score;
                    this.checkDifficulty(); 
                }

                if (pipe.x > this.GAME_WIDTH + 100) {
                    pipe.element.remove();
                    this.pipes.splice(i, 1);
                }
            }
        }
        
        createPipe() {
             const minHeight = 80;
            const maxHeight = this.GAME_HEIGHT - this.PIPE_GAP - this.GROUND_HEIGHT - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
            const bottomTop = topHeight + this.PIPE_GAP;

            const pipePair = document.createElement('div');
            pipePair.className = 'pipe-pair';
            pipePair.style.right = '0px';

            pipePair.innerHTML = `
                <div class="pipe top" style="height: ${topHeight}px"></div>
                <div class="pipe bottom" style="height: ${this.GAME_HEIGHT - bottomTop - this.GROUND_HEIGHT}px"></div>
            `;

            this.pipeContainer.appendChild(pipePair);

            this.pipes.push({
                element: pipePair,
                x: 0,
                topHeight: topHeight,
                bottomTop: bottomTop,
                passed: false
            });
        }
        checkCollision() {
            const birdRect = {
                left: 50 + 5,
                right: 50 + this.BIRD_SIZE - 5,
                top: this.birdY + 10,
                bottom: this.birdY + this.BIRD_SIZE - 35
            };

            if (birdRect.bottom >= this.GAME_HEIGHT - this.GROUND_HEIGHT) {
                return true;
            }
            if (birdRect.top <= 0) {
                 this.birdY = 0;
                 this.velocity = 0;
                 return false;
            }

            for (let pipe of this.pipes) {
                const pipeLeft = this.GAME_WIDTH - pipe.x - this.PIPE_WIDTH;
                const pipeRight = this.GAME_WIDTH - pipe.x;
                
                const topPipeBottom = pipe.topHeight;
                const bottomPipeTop = pipe.bottomTop;

                const horizontalCollision = birdRect.right > pipeLeft && birdRect.left < pipeRight;
                
                if (horizontalCollision) {
                    if (birdRect.top < topPipeBottom || birdRect.bottom > bottomPipeTop) {
                        return true;
                    }
                }
            }
            return false;
        }
        gameLoop() {
            if (!this.isRunning || this.isPaused) return;

            this.velocity += this.GRAVITY;
            this.birdY += this.velocity;

            const rotation = Math.min(90, this.velocity * 4);
            this.bird.style.transform = `rotate(${rotation}deg)`;
            
            this.bird.style.top = this.birdY + 'px';

            this.movePipes();

            if (this.checkCollision()) {
                this.gameOver();
            }
        }
        gameOver() {
            this.stop();
            this.message.textContent = `Game Over! Score: ${this.score}. Press START to play again.`;
            this.message.style.display = 'block';
            
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
        resetGame() {
            this.birdY = this.GAME_HEIGHT / 2 - this.BIRD_SIZE / 2;
            this.velocity = 0;
            this.bird.style.top = this.birdY + 'px';
            this.bird.style.transform = 'rotate(0deg)';
            this.bird.classList.remove('flying');
            
            this.score = 0;
            this.scoreDisplay.textContent = '0';
            
            this.pipeContainer.innerHTML = '';
            this.pipes = [];
            
            // Hız değişkenlerini başlangıç değerlerine getir
            this.PIPE_SPEED = this.BASE_PIPE_SPEED; 
            this.PIPE_INTERVAL_MS = this.PIPE_INTERVAL_MS_INITIAL; 
            this.lastDifficultyScore = 0;
            
            this.isRunning = false;
            this.isPaused = false;
            
            this.message.textContent = "Press START to play";
            this.message.style.display = 'block'; 
        }
    }


    // =======================================================
    // === PONG GAME CLASS & LOADER (HIZ VE AI DÜZELTİLDİ) ===
    // =======================================================

    function loadPong() {
        const gameArea = document.getElementById('pong-game-area');
        gameArea.innerHTML = `
            <div class="pong-container game-container" id="pong-game">
                <div class="pong-score" id="pong-score-l">0</div>
                <div class="pong-score" id="pong-score-r">0</div>
                <div class="paddle" id="pong-paddle-l"></div>
                <div class="paddle" id="pong-paddle-r"></div>
                <div class="ball" id="pong-ball"></div>
                <div class="pong-message" id="pong-message">Press START to play (UP/DOWN to control)</div>
            </div>
        `;
        gameInstances.pong = new Pong(startBtn, pauseBtn);
    }

    class Pong {
        constructor(startBtn, pauseBtn) {
            this.container = document.getElementById('pong-game');
            this.ball = document.getElementById('pong-ball');
            this.paddleL = document.getElementById('pong-paddle-l');
            this.paddleR = document.getElementById('pong-paddle-r');
            this.scoreL = document.getElementById('pong-score-l');
            this.scoreR = document.getElementById('pong-score-r');
            this.message = document.getElementById('pong-message');

            this.GAME_WIDTH = 800;
            this.GAME_HEIGHT = 500;
            this.PADDLE_HEIGHT = 100;
            this.PADDLE_SPEED = 8;
            this.BALL_SIZE = 15;
            
            // ZORLUK AYARLARI
            this.INITIAL_BALL_SPEED = 5;
            this.MAX_BALL_SPEED = 15; 
            this.SPEED_INCREASE_ON_HIT = 0.5; 
            this.AI_PRECISION_FACTOR = 0.7; // 1.0 = Mükemmel, 0.5 = Çok Hata Yapar

            this.isRunning = false;
            this.isPaused = false;
            this.gameLoopId = null;
            this.keys = {}; 

            this.resetGame();
            this.setupEventListeners();
        }

        setupEventListeners() {
            this.handleKeyDown = (e) => { this.keys[e.key] = true; };
            this.handleKeyUp = (e) => { this.keys[e.key] = false; };
            
            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('keyup', this.handleKeyUp);
        }
        
        removeEventListeners() {
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);
        }

        resetGame() {
            this.scoreLeft = 0;
            this.scoreRight = 0;
            this.scoreL.textContent = 0;
            this.scoreR.textContent = 0;
            
            this.paddleLY = this.GAME_HEIGHT / 2 - this.PADDLE_HEIGHT / 2;
            this.paddleRY = this.GAME_HEIGHT / 2 - this.PADDLE_HEIGHT / 2;
            this.paddleL.style.top = this.paddleLY + 'px';
            this.paddleR.style.top = this.paddleRY + 'px';
            
            this.resetBall();
        }

        resetBall(direction = 1) { 
            this.ballX = this.GAME_WIDTH / 2 - this.BALL_SIZE / 2;
            this.ballY = this.GAME_HEIGHT / 2 - this.BALL_SIZE / 2;
            
            this.ballSpeedX = this.INITIAL_BALL_SPEED * direction; 
            this.ballSpeedY = Math.random() * 4 - 2; 

            this.ball.style.left = this.ballX + 'px';
            this.ball.style.top = this.ballY + 'px';
        }

        start = () => {
            if (this.isRunning) return;
            
            if (this.scoreLeft > 0 || this.scoreRight > 0) {
                this.resetGame();
            } else {
                this.resetBall(); 
            }

            this.isRunning = true;
            this.isPaused = false;
            this.message.style.display = 'none';

            this.gameLoopId = setInterval(() => this.gameLoop(), 1000 / 60);
        };

        pause = () => {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                clearInterval(this.gameLoopId);
                this.message.textContent = "GAME PAUSED";
                this.message.style.display = 'block';
            } else {
                this.gameLoopId = setInterval(() => this.gameLoop(), 1000 / 60);
                this.message.style.display = 'none';
            }
        };

        stop = () => { 
            this.isRunning = false;
            this.isPaused = false;
            if (this.gameLoopId) clearInterval(this.gameLoopId);
            this.message.textContent = "Press START to play (UP/DOWN to control)";
            this.message.style.display = 'block';
        };

        movePaddles() {
            // Sol Raket (Oyuncu Kontrolü: YUKARI/AŞAĞI)
            if (this.keys['ArrowUp']) {
                this.paddleLY = Math.max(0, this.paddleLY - this.PADDLE_SPEED);
            }
            if (this.keys['ArrowDown']) {
                this.paddleLY = Math.min(this.GAME_HEIGHT - this.PADDLE_HEIGHT, this.paddleLY + this.PADDLE_SPEED);
            }
            
            // Sağ Raket (Güncellenmiş AI Kontrolü)
            const ballCenterY = this.ballY + this.BALL_SIZE / 2;
            const paddleRCenterY = this.paddleRY + this.PADDLE_HEIGHT / 2;
            
            // AI hareket sapması hesaplama
            const deviation = (Math.random() - 0.5) * (1 - this.AI_PRECISION_FACTOR) * this.PADDLE_HEIGHT;
            const targetY = ballCenterY + deviation;

            let aiSpeed = this.PADDLE_SPEED * 0.5; // AI'ın raket hızı

            if (targetY > paddleRCenterY) {
                this.paddleRY = Math.min(this.GAME_HEIGHT - this.PADDLE_HEIGHT, this.paddleRY + aiSpeed); 
            } else if (targetY < paddleRCenterY) {
                this.paddleRY = Math.max(0, this.paddleRY - aiSpeed);
            }
            // Kaybetme şansı: Top çok uzaktayken AI'ı yavaşlat (daha insanvari hareket)
            if (Math.abs(ballCenterY - paddleRCenterY) > this.PADDLE_HEIGHT) {
                this.paddleRY += (ballCenterY > paddleRCenterY ? 1 : -1) * 0.1; 
            }

            this.paddleL.style.top = this.paddleLY + 'px';
            this.paddleR.style.top = this.paddleRY + 'px';
        }

        moveBall() {
            this.ballX += this.ballSpeedX;
            this.ballY += this.ballSpeedY;

            // Top Tavan/Zemin Çarpışması
            if (this.ballY <= 0 || this.ballY >= this.GAME_HEIGHT - this.BALL_SIZE) {
                this.ballSpeedY = -this.ballSpeedY; 
                this.ballY = Math.max(0, Math.min(this.GAME_HEIGHT - this.BALL_SIZE, this.ballY)); 
            }

            // Top Skoru
            if (this.ballX < -this.BALL_SIZE) {
                this.scoreRight++;
                this.scoreR.textContent = this.scoreRight;
                this.checkWin();
                this.resetBall(1); 
            } else if (this.ballX > this.GAME_WIDTH) {
                this.scoreLeft++;
                this.scoreL.textContent = this.scoreLeft;
                this.checkWin();
                this.resetBall(-1);
            }
            
            this.checkPaddleCollision();

            this.ball.style.left = this.ballX + 'px';
            this.ball.style.top = this.ballY + 'px';
        }
        
        checkPaddleCollision() {
            const hitTolerance = 1; 

            const ballR = { left: this.ballX, right: this.ballX + this.BALL_SIZE, top: this.ballY, bottom: this.ballY + this.BALL_SIZE };
            const paddleLR = { left: 10, right: 20, top: this.paddleLY, bottom: this.paddleLY + this.PADDLE_HEIGHT };
            const paddleRR = { left: this.GAME_WIDTH - 20, right: this.GAME_WIDTH - 10, top: this.paddleRY, bottom: this.paddleRY + this.PADDLE_HEIGHT };

            let hit = false;
            let paddleCenterY;

            // Sol raket çarpışması
            if (this.ballSpeedX < 0 && 
                ballR.left <= paddleLR.right + hitTolerance &&
                ballR.right >= paddleLR.left && 
                ballR.bottom > paddleLR.top && 
                ballR.top < paddleLR.bottom) 
            {
                hit = true;
                paddleCenterY = paddleLR.top + this.PADDLE_HEIGHT/2;
            } 
            
            // Sağ raket çarpışması
            else if (this.ballSpeedX > 0 && 
                ballR.right >= paddleRR.left - hitTolerance &&
                ballR.left <= paddleRR.right && 
                ballR.bottom > paddleRR.top && 
                ballR.top < paddleRR.bottom) 
            {
                hit = true;
                paddleCenterY = paddleRR.top + this.PADDLE_HEIGHT/2;
            }

            if (hit) {
                this.ballSpeedX = -this.ballSpeedX;
                this.adjustBallSpeed(ballR.top + this.BALL_SIZE/2, paddleCenterY);
            }
        }
        
        adjustBallSpeed(ballCenterY, paddleCenterY) {
            const relativeIntersectY = (ballCenterY - paddleCenterY);
            const normalizedRelativeIntersectionY = relativeIntersectY / (this.PADDLE_HEIGHT / 2);
            
            // Y ekseni hızını çarpışma noktasına göre ayarla
            this.ballSpeedY = normalizedRelativeIntersectionY * 5; 
            
            // X ekseni hızını artır, maksimum hızı geçmeyecek şekilde
            const currentAbsSpeedX = Math.abs(this.ballSpeedX);
            const newAbsSpeedX = Math.min(currentAbsSpeedX + this.SPEED_INCREASE_ON_HIT, this.MAX_BALL_SPEED);
            
            // Hızın yönünü koruyarak yeni hızı ata
            this.ballSpeedX = Math.sign(this.ballSpeedX) * newAbsSpeedX;
        }

        checkWin() {
            if (this.scoreLeft >= 10) {
                this.gameOver("Player Left Wins!");
            } else if (this.scoreRight >= 10) {
                this.gameOver("Player Right (AI) Wins!");
            }
        }
        
        gameOver(message) {
            this.stop();
            this.message.textContent = `${message} Press START to play again.`;
            this.message.style.display = 'block';
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }

        gameLoop() {
            if (!this.isRunning || this.isPaused) return;

            this.movePaddles();
            this.moveBall();
        }
    }


    // =======================================================
    // === MEMORY GAME CLASS & LOADER ===
    // =======================================================

    function loadMemoryGame() {
        const gameArea = document.getElementById('memory-game-area');
        gameArea.innerHTML = `
            <div class="memory-container game-container" id="memory-game">
                <div class="memory-title-bar">
                    <h1>Memory Game</h1>
                    <div class="score">Attempts: <span id="memory-attempts">0</span></div>
                </div>
                <div class="memory-board" id="memory-board">
                    </div>
                <div class="memory-message" id="memory-message">Press START to play</div>
            </div>
        `;
        gameInstances.memory = new MemoryGame(startBtn, pauseBtn);
    }

    class MemoryGame {
        constructor(startBtn, pauseBtn) {
            this.board = document.getElementById('memory-board');
            this.attemptsDisplay = document.getElementById('memory-attempts');
            this.message = document.getElementById('memory-message');
            this.startBtn = startBtn;
            this.pauseBtn = pauseBtn;

            this.cardContent = ['⭐', '🚀', '💡', '🤖', '🐱', '🍎', '🌈', '🔥', '⭐', '🚀', '💡', '🤖', '🐱', '🍎', '🌈', '🔥'];
            this.flippedCards = [];
            this.lockBoard = false;
            this.attempts = 0;
            this.isRunning = false;
            this.isPaused = false;

            this.setupEventListeners();
            this.resetGame();
        }
        setupEventListeners() {
            this.board.addEventListener('click', this.handleBoardClick);
        }
        handleBoardClick = (e) => {
            if (!this.isRunning || this.isPaused) return;
            const clickedCard = e.target.closest('.card');
            if (!clickedCard) return;
            this.flipCard(clickedCard);
        }
        resetGame() {
            this.board.innerHTML = '';
            this.attempts = 0;
            this.attemptsDisplay.textContent = 0;
            this.flippedCards = [];
            this.lockBoard = false;
            this.isRunning = false;
            this.isPaused = false;
            this.message.textContent = "Press START to play";
            this.message.style.display = 'block';
            this.createBoard();
        }
        shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        createBoard() {
            this.shuffle(this.cardContent);
            this.cardContent.forEach(content => {
                const card = document.createElement('div');
                card.classList.add('card');
                card.dataset.content = content;
                card.innerHTML = `
                    <div class="card-face card-front">${content}</div>
                    <div class="card-face card-back">?</div>
                `;
                this.board.appendChild(card);
            });
        }
        flipCard(card) {
            if (this.lockBoard) return;
            if (card === this.flippedCards[0]) return; 
            if (card.classList.contains('match')) return;
            card.classList.add('flip');
            this.flippedCards.push(card);
            if (this.flippedCards.length === 2) {
                this.lockBoard = true;
                this.attempts++;
                this.attemptsDisplay.textContent = this.attempts;
                this.checkForMatch();
            }
        }
        checkForMatch() {
            const [card1, card2] = this.flippedCards;
            const isMatch = card1.dataset.content === card2.dataset.content;
            if (isMatch) {
                this.disableCards();
            } else {
                this.unflipCards();
            }
        }
        disableCards() {
            this.flippedCards[0].classList.add('match');
            this.flippedCards[1].classList.add('match');
            this.checkWin();
            this.resetFlipped();
        }
        unflipCards() {
            setTimeout(() => {
                this.flippedCards[0].classList.remove('flip');
                this.flippedCards[1].classList.remove('flip');
                this.resetFlipped();
            }, 1000); 
        }
        resetFlipped() {
            this.flippedCards = [];
            this.lockBoard = false;
        }
        checkWin() {
            const matchedCards = this.board.querySelectorAll('.card.match');
            if (matchedCards.length === this.cardContent.length) {
                this.gameOver();
            }
        }
        start = () => { 
            if (this.isRunning) return;
            this.resetGame();
            this.isRunning = true;
            this.isPaused = false;
            this.message.style.display = 'none';
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
        };
        pause = () => { 
            this.isPaused = !this.isPaused;
            this.lockBoard = this.isPaused;
            this.message.style.display = this.isPaused ? 'block' : 'none';
            this.message.textContent = this.isPaused ? 'PAUSED' : '';
        };
        stop = () => { 
            this.isRunning = false;
            this.isPaused = false;
            this.board.querySelectorAll('.card').forEach(card => card.classList.remove('flip', 'match'));
            this.message.textContent = "Press START to play";
            this.message.style.display = 'block';
        };
        gameOver() {
            this.stop();
            this.message.textContent = `TEBRİKLER! Oyunu ${this.attempts} denemede bitirdiniz!`;
            this.message.style.display = 'block';
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
    }


    // =======================================================
    // === MENU VE GLOBAL KONTROLLER ===
    // =======================================================

    function getCurrentGameInstance() {
        return gameInstances[currentGame];
    }

    startBtn.addEventListener('click', () => {
        const game = getCurrentGameInstance();
        if (game && game.start) {
            game.start();
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = 'PAUSE';
        }
    });

    pauseBtn.addEventListener('click', () => {
        const game = getCurrentGameInstance();
        if (game && game.pause) {
            game.pause();
            if (game.isPaused !== undefined) {
                pauseBtn.textContent = game.isPaused ? 'RESUME' : 'PAUSE';
            }
        }
    });

    backBtn.addEventListener('click', () => {
        const game = getCurrentGameInstance();
        if (game && game.stop) {
            game.stop();
        }
        showMenu();
    });

    // MENU FUNCTIONS
    function showGame(gameId) {
        currentGame = gameId;
        
        menuScreen.classList.add('hidden');
        globalControls.classList.remove('hidden');
        
        gameAreas.forEach(area => area.classList.add('hidden'));
        
        const gameArea = document.getElementById(`${gameId}-game-area`);
        gameArea.classList.remove('hidden');
        
        // Oyun yükleyiciyi çağır
        if (gameLoaders[gameId]) {
            gameLoaders[gameId]();
        }
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = 'START';
        pauseBtn.textContent = 'PAUSE';
    }

    function showMenu() {
        const game = getCurrentGameInstance();
        if (game && game.stop) {
            game.stop();
        }
        
        gameAreas.forEach(area => area.classList.add('hidden'));
        globalControls.classList.add('hidden');
        
        menuScreen.classList.remove('hidden');
        
        currentGame = null;
    }

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.getAttribute('data-game');
            showGame(gameId);
        });
    });

    showMenu();
});