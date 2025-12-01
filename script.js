const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            throw new Error('Canvas element is required');
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2d context from canvas!');
            throw new Error('Canvas 2d context is required');
        }
        
        const scoreElement = document.getElementById('score');
        const gameOverElement = document.getElementById('gameOver');
        const finalScoreElement = document.getElementById('finalScore');
        const levelElement = document.getElementById('level');
        const levelProgressElement = document.getElementById('levelProgress');
        const currentXPElement = document.getElementById('currentXP');
        const nextLevelXPElement = document.getElementById('nextLevelXP');
        const levelContainerElement = document.querySelector('.level-container');
        const topProgressElement = document.getElementById('topProgress');
        const titleElement = document.querySelector('h1');
        const highScoreElement = document.getElementById('highScore');
        const controlsElement = document.getElementById('controls');
        const closeControlsBtn = document.getElementById('closeControlsBtn');
        
        // Убеждаемся, что необходимые элементы найдены
        if (!scoreElement) {
            console.error('score element not found!');
        }
        if (!gameOverElement) {
            console.error('gameOver element not found!');
        }
        if (!finalScoreElement) {
            console.error('finalScore element not found!');
        }
        if (!levelElement) {
            console.warn('level element not found');
        }
        if (!levelProgressElement) {
            console.warn('levelProgress element not found');
        }
        if (!currentXPElement) {
            console.warn('currentXP element not found');
        }
        if (!nextLevelXPElement) {
            console.warn('nextLevelXP element not found');
        }
        if (!topProgressElement) {
            console.warn('topProgress element not found');
        }
        if (!titleElement) {
            console.warn('title element not found');
        }
        if (!highScoreElement) {
            console.warn('highScore element not found');
        }
        if (!controlsElement) {
            console.warn('controls element not found');
        }
        if (!closeControlsBtn) {
            console.warn('closeControlsBtn element not found');
        }

        // Функция для сохранения состояния закрытия блока инструкций
        function saveControlsVisibility(isVisible) {
            localStorage.setItem('controlsVisible', isVisible ? 'true' : 'false');
        }
        
        // Функция для загрузки состояния видимости блока инструкций
        function loadControlsVisibility() {
            const saved = localStorage.getItem('controlsVisible');
            return saved !== 'false'; // По умолчанию показываем, если не было сохранено
        }
        
        // Обработчик закрытия блока с инструкциями
        if (closeControlsBtn && controlsElement) {
            closeControlsBtn.addEventListener('click', () => {
                controlsElement.classList.add('hidden');
                saveControlsVisibility(false); // Сохраняем, что блок закрыт
            });
        }
        
        // Проверяем сохраненное состояние при загрузке
        if (controlsElement) {
            if (!loadControlsVisibility()) {
                controlsElement.classList.add('hidden');
            }
        }

        const gridSize = 20;
        
        // Функция для загрузки максимального счета из localStorage
        function loadHighScore() {
            const savedHighScore = localStorage.getItem('snakeHighScore');
            return savedHighScore ? parseInt(savedHighScore, 10) : 0;
        }
        
        // Функция для сохранения максимального счета в localStorage
        function saveHighScore(highScore) {
            localStorage.setItem('snakeHighScore', highScore.toString());
        }
        
        // Функция для обновления максимального счета
        function updateHighScore() {
            const currentHighScore = loadHighScore();
            if (score > currentHighScore) {
                saveHighScore(score);
                if (highScoreElement) {
                    highScoreElement.textContent = score;
                    // Добавляем анимацию при новом рекорде
                    highScoreElement.classList.add('new-record');
                    setTimeout(() => {
                        highScoreElement.classList.remove('new-record');
                    }, 1000);
                }
            } else {
                if (highScoreElement) {
                    highScoreElement.textContent = currentHighScore;
                }
            }
        }
        
        // Инициализация максимального счета при загрузке
        let highScore = loadHighScore();
        if (highScoreElement) {
            highScoreElement.textContent = highScore;
        }
        let tileCountX, tileCountY;

        // Функция для установки размера canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            tileCountX = Math.floor(canvas.width / gridSize);
            tileCountY = Math.floor(canvas.height / gridSize);
        }

        // Инициализация размера canvas
        resizeCanvas();

        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            resizeCanvas();
        });

        let snake = [
            {x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2)}
        ];
        let foods = []; // Массив звезд (еды): [{x, y}, ...]
        const MAX_FOODS = 50; // Максимальное количество звезд одновременно
        let bombs = []; // Массив бомб: {x, y, timer}
        let dx = 0;
        let dy = 0;
        let score = 0;
        let level = 1;
        let gameRunning = true;
        let isPaused = false;
        let bombSpawnInterval = null;
        let currentSkin = 0; // Текущий скин змейки (меняется каждые 10 звезд)
        let snakeDisappearing = false; // Флаг исчезновения змейки
        let snakeDisappearStartTime = 0; // Время начала исчезновения
        
        // Массив скинов змейки с разными цветовыми схемами
        const SNAKE_SKINS = [
            {
                name: 'Космический голубой',
                headColors: {
                    shadow: 'rgba(0, 255, 255, 0.8)',
                    gradient: [
                        {stop: 0, color: 'rgba(0, 255, 255, 0.9)'},
                        {stop: 0.3, color: 'rgba(0, 191, 255, 0.8)'},
                        {stop: 0.6, color: 'rgba(138, 43, 226, 0.7)'},
                        {stop: 1, color: 'rgba(75, 0, 130, 0.6)'}
                    ],
                    stroke: 'rgba(0, 255, 255, 0.9)',
                    highlight: 'rgba(0, 255, 255, 0)'
                },
                bodyColors: {
                    shadow: 'rgba(138, 43, 226, 0.6)',
                    gradient: [
                        {stop: 0, color: 'rgba(0, 191, 255, 0.7)'},
                        {stop: 0.5, color: 'rgba(138, 43, 226, 0.6)'},
                        {stop: 1, color: 'rgba(75, 0, 130, 0.5)'}
                    ],
                    stroke: 'rgba(138, 43, 226, 0.6)',
                    highlight: 'rgba(0, 191, 255, 0)'
                }
            },
            {
                name: 'Огненный красный',
                headColors: {
                    shadow: 'rgba(255, 100, 0, 0.8)',
                    gradient: [
                        {stop: 0, color: 'rgba(255, 200, 0, 0.9)'},
                        {stop: 0.3, color: 'rgba(255, 140, 0, 0.8)'},
                        {stop: 0.6, color: 'rgba(255, 69, 0, 0.7)'},
                        {stop: 1, color: 'rgba(139, 0, 0, 0.6)'}
                    ],
                    stroke: 'rgba(255, 100, 0, 0.9)',
                    highlight: 'rgba(255, 200, 0, 0)'
                },
                bodyColors: {
                    shadow: 'rgba(255, 69, 0, 0.6)',
                    gradient: [
                        {stop: 0, color: 'rgba(255, 140, 0, 0.7)'},
                        {stop: 0.5, color: 'rgba(255, 69, 0, 0.6)'},
                        {stop: 1, color: 'rgba(139, 0, 0, 0.5)'}
                    ],
                    stroke: 'rgba(255, 69, 0, 0.6)',
                    highlight: 'rgba(255, 140, 0, 0)'
                }
            },
            {
                name: 'Зеленый неон',
                headColors: {
                    shadow: 'rgba(0, 255, 127, 0.8)',
                    gradient: [
                        {stop: 0, color: 'rgba(0, 255, 200, 0.9)'},
                        {stop: 0.3, color: 'rgba(0, 255, 127, 0.8)'},
                        {stop: 0.6, color: 'rgba(0, 200, 100, 0.7)'},
                        {stop: 1, color: 'rgba(0, 100, 50, 0.6)'}
                    ],
                    stroke: 'rgba(0, 255, 127, 0.9)',
                    highlight: 'rgba(0, 255, 200, 0)'
                },
                bodyColors: {
                    shadow: 'rgba(0, 255, 127, 0.6)',
                    gradient: [
                        {stop: 0, color: 'rgba(0, 255, 200, 0.7)'},
                        {stop: 0.5, color: 'rgba(0, 255, 127, 0.6)'},
                        {stop: 1, color: 'rgba(0, 200, 100, 0.5)'}
                    ],
                    stroke: 'rgba(0, 255, 127, 0.6)',
                    highlight: 'rgba(0, 255, 200, 0)'
                }
            },
            {
                name: 'Розовый космос',
                headColors: {
                    shadow: 'rgba(255, 20, 147, 0.8)',
                    gradient: [
                        {stop: 0, color: 'rgba(255, 105, 180, 0.9)'},
                        {stop: 0.3, color: 'rgba(255, 20, 147, 0.8)'},
                        {stop: 0.6, color: 'rgba(199, 21, 133, 0.7)'},
                        {stop: 1, color: 'rgba(75, 0, 130, 0.6)'}
                    ],
                    stroke: 'rgba(255, 20, 147, 0.9)',
                    highlight: 'rgba(255, 105, 180, 0)'
                },
                bodyColors: {
                    shadow: 'rgba(255, 20, 147, 0.6)',
                    gradient: [
                        {stop: 0, color: 'rgba(255, 105, 180, 0.7)'},
                        {stop: 0.5, color: 'rgba(255, 20, 147, 0.6)'},
                        {stop: 1, color: 'rgba(199, 21, 133, 0.5)'}
                    ],
                    stroke: 'rgba(255, 20, 147, 0.6)',
                    highlight: 'rgba(255, 105, 180, 0)'
                }
            },
            {
                name: 'Золотой дракон',
                headColors: {
                    shadow: 'rgba(255, 215, 0, 0.8)',
                    gradient: [
                        {stop: 0, color: 'rgba(255, 255, 200, 0.9)'},
                        {stop: 0.3, color: 'rgba(255, 215, 0, 0.8)'},
                        {stop: 0.6, color: 'rgba(255, 165, 0, 0.7)'},
                        {stop: 1, color: 'rgba(184, 134, 11, 0.6)'}
                    ],
                    stroke: 'rgba(255, 215, 0, 0.9)',
                    highlight: 'rgba(255, 255, 200, 0)'
                },
                bodyColors: {
                    shadow: 'rgba(255, 215, 0, 0.6)',
                    gradient: [
                        {stop: 0, color: 'rgba(255, 255, 150, 0.7)'},
                        {stop: 0.5, color: 'rgba(255, 215, 0, 0.6)'},
                        {stop: 1, color: 'rgba(255, 165, 0, 0.5)'}
                    ],
                    stroke: 'rgba(255, 215, 0, 0.6)',
                    highlight: 'rgba(255, 255, 150, 0)'
                }
            }
        ];
        
        // Функция для получения текущего скина
        function getCurrentSkin() {
            return SNAKE_SKINS[currentSkin % SNAKE_SKINS.length];
        }
        
        // Функция для обновления скина при поедании звезд
        function updateSkin() {
            const newSkinIndex = Math.floor(score / 10);
            if (newSkinIndex !== currentSkin) {
                currentSkin = newSkinIndex;
                console.log(`Новый скин: ${getCurrentSkin().name}`);
            }
        }
        
        // Функция для расчета уровня на основе очков
        function calculateLevel(score) {
            // Уровень увеличивается каждые 10 очков
            // Формула: level = floor(score / 10) + 1
            return Math.floor(score / 10) + 1;
        }
        
        // Функция для расчета опыта до следующего уровня
        function getXPForNextLevel(score) {
            const currentLevel = calculateLevel(score);
            // Очки, необходимые для текущего уровня
            const xpForCurrentLevel = (currentLevel - 1) * 10;
            // Очки, необходимые для следующего уровня
            const xpForNextLevel = currentLevel * 10;
            // Текущий прогресс в рамках текущего уровня
            const currentXP = score - xpForCurrentLevel;
            // Сколько очков нужно для перехода на следующий уровень
            const xpNeeded = xpForNextLevel - xpForCurrentLevel;
            // Процент прогресса (от 0 до 100)
            const progress = xpNeeded > 0 ? (currentXP / xpNeeded) * 100 : 0;
            
            return {
                current: Math.max(0, currentXP),
                needed: xpNeeded,
                progress: Math.max(0, Math.min(100, progress))
            };
        }
        
        // Функция для обновления шкалы уровня
        function updateLevelProgress() {
            if (!levelElement || !levelProgressElement || !currentXPElement || !nextLevelXPElement) {
                return; // Элементы еще не загружены
            }
            
            const newLevel = calculateLevel(score);
            
            // Если уровень изменился, обновляем отображение и параметры сложности
            if (newLevel !== level) {
                level = newLevel;
                if (levelElement) {
                    levelElement.textContent = level;
                }
                // Интервал генерации бомб отключен - бомбы циклически обновляются
                // updateBombSpawnInterval();
            }
            
            const xpInfo = getXPForNextLevel(score);
            const progressPercent = Math.max(0, Math.min(100, xpInfo.progress)); // Ограничиваем от 0 до 100
            
            // Обновляем ширину прогресс-бара (минимум 2% для видимости даже при 0%)
            const displayWidth = progressPercent > 0 ? Math.max(progressPercent, 2) : 2;
            levelProgressElement.style.width = displayWidth + '%';
            // Убеждаемся, что элемент виден
            levelProgressElement.style.display = 'block';
            levelProgressElement.style.visibility = 'visible';
            levelProgressElement.style.opacity = '1';
            // Обновляем текст опыта
            currentXPElement.textContent = xpInfo.current;
            nextLevelXPElement.textContent = xpInfo.needed;
        }
        
        // Функция для обновления верхней шкалы прогресса
        function updateTopProgress() {
            if (!topProgressElement) {
                console.warn('topProgressElement not found');
                return; // Элемент еще не загружен
            }
            
            // Шкала заполняется за каждые 50 очков (можно изменить)
            const progressPerCycle = 50;
            const currentProgress = score % progressPerCycle;
            const progressPercent = (currentProgress / progressPerCycle) * 100;
            
            // Обновляем ширину верхней шкалы (минимум 1% для видимости, если есть очки)
            const displayWidth = score > 0 ? Math.max(progressPercent, 1) : 0;
            topProgressElement.style.width = displayWidth + '%';
            
            // Убеждаемся, что элемент виден
            topProgressElement.style.display = 'block';
            topProgressElement.style.visibility = 'visible';
            topProgressElement.style.opacity = '1';
        }
        
        // Функция для расчета скорости игры на основе уровня
        function getGameSpeed() {
            // Более плавное усложнение на основе уровня
            // Используем логарифмическую формулу для более постепенного увеличения скорости
            const baseSpeed = 120; // Начальная скорость (медленнее для комфорта)
            const minSpeed = 30; // Минимальная скорость (быстрее на высоких уровнях)
            
            // Логарифмическое уменьшение скорости для более плавного усложнения
            // На уровне 1: скорость = 120мс
            // На уровне 5: скорость ≈ 80мс
            // На уровне 10: скорость ≈ 50мс
            // На уровне 20+: скорость ≈ 30мс
            const speedReduction = Math.log(level + 1) * 15; // Логарифмическое уменьшение
            const calculatedSpeed = baseSpeed - speedReduction;
            
            return Math.max(calculatedSpeed, minSpeed);
        }
        
        // Функция для расчета интервала появления бомб на основе уровня
        function getBombSpawnInterval() {
            // Более плавное уменьшение интервала на основе уровня
            const baseMin = 4000; // Начальный минимальный интервал (4 секунды)
            const baseMax = 6000; // Начальный максимальный интервал (6 секунд)
            const minInterval = 800; // Минимальный интервал на высоких уровнях
            const maxInterval = 1500; // Максимальный интервал на высоких уровнях
            
            // Логарифмическое уменьшение интервала
            // На уровне 1: 4-6 секунд
            // На уровне 5: ~2-3 секунды
            // На уровне 10: ~1.2-1.8 секунды
            // На уровне 20+: ~0.8-1.5 секунды
            const reduction = Math.log(level + 1) * 800;
            
            return {
                min: Math.max(baseMin - reduction, minInterval),
                max: Math.max(baseMax - reduction, maxInterval)
            };
        }
        
        // Функция для расчета времени жизни звезды
        function getFoodLifetime() {
            // Время жизни звезды (немного дольше, чем у бомб)
            const baseLifetime = 8000; // Начальное время жизни (8 секунд)
            const minLifetime = 3000; // Минимальное время жизни на высоких уровнях (3 секунды)
            
            // Логарифмическое уменьшение времени жизни
            const lifetime = baseLifetime - (Math.log(level) / Math.log(2)) * 1000;
            return Math.max(minLifetime, lifetime);
        }
        
        // Функция для расчета времени жизни бомбы на основе уровня
        function getBombLifetime() {
            // Более плавное уменьшение времени жизни бомб
            const baseLifetime = 6000; // Начальное время жизни (6 секунд)
            const minLifetime = 2000; // Минимальное время жизни на высоких уровнях (2 секунды)
            
            // Логарифмическое уменьшение времени жизни
            // На уровне 1: 6 секунд
            // На уровне 5: ~4 секунды
            // На уровне 10: ~3 секунды
            // На уровне 20+: ~2 секунды
            const reduction = Math.log(level + 1) * 1000;
            
            return Math.max(baseLifetime - reduction, minLifetime);
        }
        
        // Функция для расчета максимального количества бомб на экране
        function getMaxBombsOnScreen() {
            // Увеличиваем максимальное количество бомб с уровнем
            // На уровне 1-3: 3 бомбы
            // На уровне 4-7: 4 бомбы
            // На уровне 8-12: 5 бомб
            // На уровне 13-18: 6 бомб
            // На уровне 19+: 7 бомб
            const baseMax = 3;
            const additionalBombs = Math.floor((level - 1) / 4);
            return Math.min(baseMax + additionalBombs, 7);
        }
        
        // Функция для расчета минимального расстояния от змейки для бомб
        function getMinDistanceFromSnake() {
            // Уменьшаем минимальное расстояние с уровнем (бомбы появляются ближе)
            // На уровне 1-5: 3 клетки
            // На уровне 6-10: 2 клетки
            // На уровне 11+: 1 клетка
            if (level <= 5) return 3;
            if (level <= 10) return 2;
            return 1;
        }
        
        // Функция для определения, нужно ли спавнить несколько бомб одновременно
        function shouldSpawnMultipleBombs() {
            // Начиная с уровня 15, иногда появляется 2 бомбы одновременно
            // На уровне 20+ вероятность увеличивается
            if (level < 15) return false;
            if (level >= 20) return Math.random() < 0.4; // 40% шанс
            return Math.random() < 0.2; // 20% шанс
        }
        
        // Функция для обновления интервала генерации бомб
        // ОТКЛЮЧЕНО: бомбы теперь только циклически исчезают и появляются
        function updateBombSpawnInterval() {
            // Останавливаем интервал, если он был запущен
            if (bombSpawnInterval) {
                clearInterval(bombSpawnInterval);
                bombSpawnInterval = null;
            }
            // Не запускаем новый интервал - бомбы будут только циклически обновляться
        }

        // Генерация одной звезды
        function spawnSingleFood(shouldHaveLifetime = null, ignoreGameRunning = false) {
            if (!ignoreGameRunning && !gameRunning) return false;
            
            let newFood;
            let attempts = 0;
            const maxAttempts = 100;
            
            do {
                newFood = {
                    x: Math.floor(Math.random() * tileCountX),
                    y: Math.floor(Math.random() * tileCountY)
                };
                attempts++;
            } while (
                attempts < maxAttempts && 
                (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
                 foods.some(f => f.x === newFood.x && f.y === newFood.y) ||
                 bombs.some(bomb => bomb.x === newFood.x && bomb.y === newFood.y))
            );
            
            if (attempts < maxAttempts) {
                // Если shouldHaveLifetime не указан, случайно определяем (50% вероятность)
                const hasLifetime = shouldHaveLifetime !== null ? shouldHaveLifetime : Math.random() < 0.5;
                
                const food = {
                    x: newFood.x,
                    y: newFood.y
                };
                
                // Если звезда должна исчезать, добавляем lifetime и spawnTime
                if (hasLifetime) {
                    food.spawnTime = Date.now();
                    food.lifetime = getFoodLifetime();
                }
                
                foods.push(food);
                
                // Если звезда имеет lifetime, настраиваем таймер для исчезновения и появления новой
                if (hasLifetime) {
                    const foodId = {x: food.x, y: food.y, spawnTime: food.spawnTime};
                    setTimeout(() => {
                        const index = foods.findIndex(f => 
                            f.x === foodId.x && 
                            f.y === foodId.y && 
                            f.spawnTime === foodId.spawnTime
                        );
                        if (index !== -1) {
                            foods.splice(index, 1);
                            // Создаем новую звезду на месте исчезнувшей (тоже с lifetime)
                            // Используем ignoreGameRunning = true, чтобы звезда создалась даже если игра на паузе
                            // (но только если игра вообще запущена)
                            if (gameRunning) {
                                // Функция для создания новой исчезающей звезды с повторными попытками
                                function trySpawnDisappearingFood(retries = 5) {
                                    if (retries <= 0) return;
                                    if (!spawnSingleFood(true, true)) { // shouldHaveLifetime=true, ignoreGameRunning=true
                                        setTimeout(() => {
                                            if (gameRunning) {
                                                trySpawnDisappearingFood(retries - 1);
                                            }
                                        }, 200);
                                    }
                                }
                                trySpawnDisappearingFood();
                            }
                        }
                    }, food.lifetime);
                }
                
                return true;
            }
            return false;
        }
        
        // Генерация нескольких звезд (3-4 штуки)
        function randomFood() {
            // Удаляем все старые звезды
            foods = [];
            
            // Генерируем звезды
            const foodCount = MAX_FOODS;
            // Половина звезд будет с lifetime (исчезающие), половина без (постоянные)
            const disappearingCount = Math.floor(foodCount / 2);
            
            let spawnedCount = 0;
            let attempts = 0;
            const maxAttempts = foodCount * 20; // Еще больше попыток для надежности
            
            // Сначала создаем все звезды без lifetime
            while (spawnedCount < foodCount && attempts < maxAttempts) {
                if (spawnSingleFood(false, true)) { // Сначала все без lifetime
                    spawnedCount++;
                }
                attempts++;
            }
            
            // Теперь случайно выбираем половину звезд и добавляем им lifetime
            if (foods.length > 0) {
                // Перемешиваем массив звезд случайным образом
                const shuffled = [...foods].sort(() => Math.random() - 0.5);
                
                // Выбираем случайную половину для исчезновения
                const toMakeDisappearing = Math.min(disappearingCount, shuffled.length);
                
                for (let i = 0; i < toMakeDisappearing; i++) {
                    const food = shuffled[i];
                    const index = foods.findIndex(f => f.x === food.x && f.y === food.y);
                    if (index !== -1 && !foods[index].lifetime) {
                        // Добавляем lifetime и spawnTime
                        foods[index].spawnTime = Date.now();
                        foods[index].lifetime = getFoodLifetime();
                        
                        // Настраиваем таймер для исчезновения и появления новой
                        const foodId = {x: foods[index].x, y: foods[index].y, spawnTime: foods[index].spawnTime};
                        setTimeout(() => {
                            const foodIndex = foods.findIndex(f => 
                                f.x === foodId.x && 
                                f.y === foodId.y && 
                                f.spawnTime === foodId.spawnTime
                            );
                            if (foodIndex !== -1) {
                                foods.splice(foodIndex, 1);
                                // Создаем новую звезду на месте исчезнувшей (тоже с lifetime)
                                if (gameRunning) {
                                    // Функция для создания новой исчезающей звезды с повторными попытками
                                    function trySpawnDisappearingFood(retries = 5) {
                                        if (retries <= 0) return;
                                        if (!spawnSingleFood(true, true)) { // shouldHaveLifetime=true, ignoreGameRunning=true
                                            setTimeout(() => {
                                                if (gameRunning) {
                                                    trySpawnDisappearingFood(retries - 1);
                                                }
                                            }, 200);
                                        } else {
                                            // Новая звезда создана, добавляем ей lifetime
                                            const newFood = foods[foods.length - 1];
                                            if (newFood && !newFood.lifetime) {
                                                newFood.spawnTime = Date.now();
                                                newFood.lifetime = getFoodLifetime();
                                                // Настраиваем таймер для новой звезды
                                                const newFoodId = {x: newFood.x, y: newFood.y, spawnTime: newFood.spawnTime};
                                                setTimeout(() => {
                                                    const newFoodIndex = foods.findIndex(f => 
                                                        f.x === newFoodId.x && 
                                                        f.y === newFoodId.y && 
                                                        f.spawnTime === newFoodId.spawnTime
                                                    );
                                                    if (newFoodIndex !== -1) {
                                                        foods.splice(newFoodIndex, 1);
                                                        if (gameRunning) {
                                                            trySpawnDisappearingFood(5);
                                                        }
                                                    }
                                                }, newFood.lifetime);
                                            }
                                        }
                                    }
                                    trySpawnDisappearingFood();
                                }
                            }
                        }, foods[index].lifetime);
                    }
                }
            }
            
            // Проверяем, что звезды действительно созданы
            const actualDisappearing = foods.filter(f => f.lifetime && f.spawnTime).length;
            const actualPermanent = foods.length - actualDisappearing;
            console.log(`Создано ${spawnedCount} звезд из ${foodCount} запрошенных (исчезающих: ${actualDisappearing}, постоянных: ${actualPermanent})`);
        }

        // Функция для проверки расстояния от змейки
        function isFarFromSnake(x, y, minDistance) {
            for (let segment of snake) {
                const distance = Math.abs(segment.x - x) + Math.abs(segment.y - y);
                if (distance < minDistance) {
                    return false;
                }
            }
            return true;
        }

        // Генерация одной бомбы
        function spawnSingleBomb(ignoreMaxLimit = false) {
            if (!gameRunning) return false;
            
            // Проверяем максимальное количество бомб на экране (если не игнорируем лимит)
            if (!ignoreMaxLimit) {
                const maxBombs = getMaxBombsOnScreen();
                if (bombs.length >= maxBombs) {
                    return false; // Достигнут лимит бомб
                }
            }
            
            const minDistance = getMinDistanceFromSnake();
            let newBomb;
            let attempts = 0;
            const maxAttempts = 100; // Увеличиваем попытки для более сложных условий
            
            do {
                newBomb = {
                    x: Math.floor(Math.random() * tileCountX),
                    y: Math.floor(Math.random() * tileCountY)
                };
                attempts++;
            } while (
                attempts < maxAttempts && 
                (!isFarFromSnake(newBomb.x, newBomb.y, minDistance) || 
                 foods.some(f => f.x === newBomb.x && f.y === newBomb.y) ||
                 bombs.some(bomb => bomb.x === newBomb.x && bomb.y === newBomb.y))
            );
            
            if (attempts < maxAttempts) {
                const bomb = {
                    x: newBomb.x,
                    y: newBomb.y,
                    spawnTime: Date.now(),
                    lifetime: getBombLifetime()
                };
                bombs.push(bomb);
                
                // Удаление бомбы через время жизни и создание новой (цикл)
                setTimeout(() => {
                    const index = bombs.findIndex(b => b.x === bomb.x && b.y === bomb.y && b.spawnTime === bomb.spawnTime);
                    if (index !== -1) {
                        bombs.splice(index, 1);
                        // Создаем новую бомбу на месте исчезнувшей (цикл)
                        // Игнорируем лимит, чтобы поддерживать постоянное количество бомб
                        if (gameRunning && !isPaused) {
                            spawnSingleBomb(true); // true = игнорируем лимит для поддержания цикла
                        }
                    }
                }, bomb.lifetime);
                
                return true;
            }
            return false;
        }

        // Генерация бомб (может быть несколько одновременно на высоких уровнях)
        function spawnBomb() {
            if (!gameRunning) return;
            
            // Пытаемся заспавнить первую бомбу
            const firstBombSpawned = spawnSingleBomb();
            
            // На высоких уровнях иногда спавним несколько бомб одновременно
            if (firstBombSpawned && shouldSpawnMultipleBombs()) {
                // Небольшая задержка перед спавном второй бомбы для визуального эффекта
                setTimeout(() => {
                    spawnSingleBomb();
                }, 200 + Math.random() * 300); // Задержка 200-500мс
            }
        }
        
        // Генерация множества бомб сразу (для начальной загрузки)
        function spawnInitialBombs(count = 40) {
            if (!gameRunning) return;
            
            let spawned = 0;
            let attempts = 0;
            const maxAttempts = count * 5; // Максимальное количество попыток (увеличено для надежности)
            
            // Пытаемся создать указанное количество бомб
            // Игнорируем лимит максимального количества бомб для начальной загрузки
            while (spawned < count && attempts < maxAttempts) {
                if (spawnSingleBomb(true)) { // true = игнорируем лимит
                    spawned++;
                }
                attempts++;
            }
            
            console.log(`Создано ${spawned} бомб из ${count} запрошенных`);
        }

        function drawGame() {
            clearCanvas();
            drawSnake();
            drawFood();
            drawBombs();
        }

        function clearCanvas() {
            // Очищаем canvas полностью прозрачным, чтобы космические тела были видны
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Только легкие туманности для атмосферы (полупрозрачные)
            const nebula1 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.3, 0, canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.5);
            nebula1.addColorStop(0, 'rgba(138, 43, 226, 0.1)');
            nebula1.addColorStop(1, 'transparent');
            ctx.fillStyle = nebula1;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const nebula2 = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.7, 0, canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.4);
            nebula2.addColorStop(0, 'rgba(0, 191, 255, 0.08)');
            nebula2.addColorStop(1, 'transparent');
            ctx.fillStyle = nebula2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Звезды на canvas (дополнительные к фону)
            const time = Date.now() / 1000;
            for (let i = 0; i < 50; i++) {
                const x = (Math.sin(i * 137.5) * canvas.width * 0.5 + canvas.width * 0.5 + time * 10) % canvas.width;
                const y = (Math.cos(i * 137.5) * canvas.height * 0.5 + canvas.height * 0.5 + time * 5) % canvas.height;
                const brightness = (Math.sin(time * 2 + i) + 1) / 2;
                ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function drawSnake() {
            // Не рисуем змейку, если она полностью исчезла
            if (snake.length === 0) {
                return;
            }
            
            const skin = getCurrentSkin();
            const disappearTime = snakeDisappearing ? (Date.now() - snakeDisappearStartTime) / 1000 : 0;
            const disappearAlpha = snakeDisappearing ? Math.max(0, 1 - disappearTime * 2) : 1; // Исчезает за 0.5 секунды
            
            snake.forEach((segment, index) => {
                const x = segment.x * gridSize;
                const y = segment.y * gridSize;
                const size = gridSize - 2;
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                const time = Date.now() / 100;
                
                // Применяем эффект исчезновения (уменьшение прозрачности)
                const segmentAlpha = disappearAlpha * (1 - (index / snake.length) * 0.1); // Хвост исчезает быстрее
                
                if (index === 0) {
                    // 3D голова змейки в космическом стиле
                    const radius = size / 2 - 1;
                    const glowIntensity = (Math.sin(time) + 1) / 2 * 0.3 + 0.7;
                    
                    // Внешнее свечение (неоновое) - используем цвета из скина
                    const shadowColorWithAlpha = skin.headColors.shadow.replace(/[\d.]+\)$/, `${0.8 * segmentAlpha})`);
                    ctx.shadowColor = shadowColorWithAlpha;
                    ctx.shadowBlur = 15 * glowIntensity * segmentAlpha;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    
                    // Основной 3D градиент (цилиндр) - используем цвета из скина
                    const headGradient = ctx.createRadialGradient(
                        centerX - 2, centerY - 2, 0,
                        centerX, centerY, radius
                    );
                    skin.headColors.gradient.forEach(colorStop => {
                        const baseAlpha = parseFloat(colorStop.color.match(/[\d.]+\)$/)[0].replace(')', ''));
                        const finalAlpha = baseAlpha * glowIntensity * segmentAlpha;
                        const color = colorStop.color.replace(/[\d.]+\)$/, `${finalAlpha})`);
                        headGradient.addColorStop(colorStop.stop, color);
                    });
                    ctx.fillStyle = headGradient;
                    
                    // Рисуем 3D сферу
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Верхний блик для 3D эффекта - используем цвета из скина
                    const highlightGradient = ctx.createRadialGradient(
                        centerX - radius * 0.3, centerY - radius * 0.3, 0,
                        centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.6
                    );
                    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * segmentAlpha})`);
                    highlightGradient.addColorStop(1, skin.headColors.highlight);
                    ctx.fillStyle = highlightGradient;
                    ctx.beginPath();
                    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Граница с неоновым свечением - используем цвета из скина
                    const strokeColor = skin.headColors.stroke.replace(/[\d.]+\)$/, `${0.9 * glowIntensity * segmentAlpha})`);
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.shadowBlur = 0;
                    
                    // Космические глаза - применяем эффект исчезновения
                    const eyeSize = 3;
                    const eyeOffset = 5;
                    const eyeGlow = `rgba(255, 255, 255, ${0.9 * segmentAlpha})`;
                    
                    ctx.shadowColor = `rgba(255, 255, 255, ${0.8 * segmentAlpha})`;
                    ctx.shadowBlur = 5 * segmentAlpha;
                    
                    if (dx === 1) { // Движение вправо
                        ctx.fillStyle = eyeGlow;
                        ctx.beginPath();
                        ctx.arc(x + size - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(x + size - eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (dx === -1) { // Движение влево
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (dy === -1) { // Движение вверх
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(x + size - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (dy === 1) { // Движение вниз
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(x + size - eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                    } else { // Начальная позиция
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(x + size - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    ctx.shadowBlur = 0;
                } else {
                    // 3D тело змейки в космическом стиле - используем цвета из скина
                    const radius = size / 2 - 1;
                    const intensity = 1 - (index / snake.length) * 0.3;
                    const alpha = 0.7 * intensity;
                    const bodyGlow = (Math.sin(time + index) + 1) / 2 * 0.2 + 0.6;
                    
                    // Внешнее свечение - используем цвета из скина
                    const shadowColor = skin.bodyColors.shadow.replace(/[\d.]+\)$/, `${0.6 * bodyGlow * segmentAlpha})`);
                    ctx.shadowColor = shadowColor;
                    ctx.shadowBlur = 10 * bodyGlow * segmentAlpha;
                    
                    // Градиент для тела - используем цвета из скина
                    const bodyGradient = ctx.createRadialGradient(
                        centerX - 1, centerY - 1, 0,
                        centerX, centerY, radius
                    );
                    skin.bodyColors.gradient.forEach((colorStop, i) => {
                        const baseAlpha = parseFloat(colorStop.color.match(/[\d.]+\)$/)[0].replace(')', ''));
                        let finalAlpha = baseAlpha * alpha * bodyGlow * segmentAlpha;
                        if (i === 1) finalAlpha *= 0.8; // Средний цвет немного темнее
                        if (i === 2) finalAlpha *= 0.6; // Внешний цвет еще темнее
                        const color = colorStop.color.replace(/[\d.]+\)$/, `${finalAlpha})`);
                        bodyGradient.addColorStop(colorStop.stop, color);
                    });
                    ctx.fillStyle = bodyGradient;
                    
                    // Рисуем 3D сегмент
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Верхний блик - используем цвета из скина
                    const highlightGradient = ctx.createRadialGradient(
                        centerX - radius * 0.3, centerY - radius * 0.3, 0,
                        centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.5
                    );
                    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 * intensity * segmentAlpha})`);
                    highlightGradient.addColorStop(1, skin.bodyColors.highlight);
                    ctx.fillStyle = highlightGradient;
                    ctx.beginPath();
                    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Граница - используем цвета из скина
                    const bodyStrokeColor = skin.bodyColors.stroke.replace(/[\d.]+\)$/, `${0.6 * bodyGlow * segmentAlpha})`);
                    ctx.strokeStyle = bodyStrokeColor;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.shadowBlur = 0;
                }
            });
        }

        function drawFood() {
            // Рисуем все звезды
            foods.forEach(food => {
                const x = food.x * gridSize;
                const y = food.y * gridSize;
                const size = gridSize - 2;
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                
                // Расчет времени жизни и эффекта мигания перед исчезновением (только для звезд с lifetime)
                let fadeAlpha = 1;
                if (food.lifetime && food.spawnTime) {
                    const elapsed = Date.now() - food.spawnTime;
                    const timeLeft = food.lifetime - elapsed;
                    const fadeStart = food.lifetime * 0.3; // Начинаем мигать за 30% времени до исчезновения
                    
                    if (timeLeft < fadeStart && timeLeft > 0) {
                        // Эффект мигания перед исчезновением
                        const fadeProgress = Math.max(0, timeLeft / fadeStart); // Ограничиваем от 0 до 1
                        const blinkSpeed = 10; // Скорость мигания
                        const blink = Math.sin((timeLeft / fadeStart) * Math.PI * blinkSpeed);
                        fadeAlpha = Math.max(0.1, fadeProgress * (0.3 + blink * 0.7)); // Мигание от 0.3 до 1.0, минимум 0.1
                    } else if (timeLeft <= 0) {
                        // Звезда должна была исчезнуть, но еще не удалена
                        fadeAlpha = 0.01; // Минимальное значение для предотвращения ошибок
                    }
                }
                
                // Анимация пульсации для свечения
                const time = Date.now() / 500;
                const pulse = Math.sin(time) * 0.3 + 0.7; // От 0.4 до 1.0
                const glowIntensity = Math.max(0.1, (0.8 + pulse * 0.2) * fadeAlpha); // От 0.8 до 1.0, умноженное на fadeAlpha, минимум 0.1
                const rotation = (Date.now() / 2000) % (Math.PI * 2); // Медленное вращение
                
                // Функция для рисования звезды
                function drawStar(cx, cy, outerRadius, innerRadius, points, rotation) {
                    ctx.beginPath();
                    for (let i = 0; i < points * 2; i++) {
                        const angle = (i * Math.PI / points) + rotation;
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const px = cx + Math.cos(angle) * radius;
                        const py = cy + Math.sin(angle) * radius;
                        if (i === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    }
                    ctx.closePath();
                }
                
                const outerRadius = Math.max(1, (size / 2 - 1) * glowIntensity); // Минимум 1 пиксель
                const innerRadius = Math.max(0.5, outerRadius * 0.4); // Минимум 0.5 пикселя
                const points = 5;
                
                // Пропускаем отрисовку, если радиус слишком маленький
                if (outerRadius < 0.5) {
                    return; // Не рисуем звезду, если она почти исчезла
                }
                
                // Внешнее свечение (самое яркое)
                ctx.shadowColor = `rgba(255, 215, 0, ${0.9 * glowIntensity})`;
                ctx.shadowBlur = 20 * glowIntensity;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Внешний слой свечения
                drawStar(centerX, centerY, outerRadius + 4, innerRadius + 2, points, rotation);
                ctx.fillStyle = `rgba(255, 255, 200, ${0.5 * glowIntensity})`;
                ctx.fill();
                
                // Средний слой свечения
                drawStar(centerX, centerY, outerRadius + 2, innerRadius + 1, points, rotation);
                ctx.fillStyle = `rgba(255, 255, 150, ${0.7 * glowIntensity})`;
                ctx.fill();
                
                // Основная звезда с градиентом
                const starGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(1, outerRadius));
                starGradient.addColorStop(0, `rgba(255, 255, 100, ${glowIntensity})`);
                starGradient.addColorStop(0.5, `rgba(255, 215, 0, ${glowIntensity * 0.9})`);
                starGradient.addColorStop(1, `rgba(255, 165, 0, ${glowIntensity * 0.8})`);
                ctx.fillStyle = starGradient;
                
                drawStar(centerX, centerY, outerRadius, innerRadius, points, rotation);
                ctx.fill();
                
                // Дополнительное свечение вокруг звезды
                ctx.shadowColor = `rgba(255, 215, 0, ${0.8 * glowIntensity})`;
                ctx.shadowBlur = 25 * glowIntensity;
                ctx.fill();
                
                // Яркое внутреннее свечение
                const innerGlowRadius = Math.max(1, outerRadius * 0.6);
                const innerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerGlowRadius);
                innerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.9 * glowIntensity})`);
                innerGlow.addColorStop(0.5, `rgba(255, 255, 200, ${0.6 * glowIntensity})`);
                innerGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = innerGlow;
                drawStar(centerX, centerY, outerRadius * 0.6, innerRadius * 0.6, points, rotation);
                ctx.fill();
                
                // Центральный блик
                ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity})`;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Дополнительные маленькие звездочки вокруг (эффект искр)
                const sparkleCount = 4;
                for (let i = 0; i < sparkleCount; i++) {
                    const sparkleAngle = (i * Math.PI * 2 / sparkleCount) + rotation;
                    const sparkleDist = outerRadius + 3;
                    const sparkleX = centerX + Math.cos(sparkleAngle) * sparkleDist;
                    const sparkleY = centerY + Math.sin(sparkleAngle) * sparkleDist;
                    const sparkleSize = 1.5 * glowIntensity;
                    
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * glowIntensity})`;
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Сброс теней
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            });
        }

        function drawBombs() {
            bombs.forEach(bomb => {
                const x = bomb.x * gridSize;
                const y = bomb.y * gridSize;
                const size = gridSize - 2;
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                
                // Вычисляем время до исчезновения для эффекта мигания
                const timeLeft = bomb.lifetime - (Date.now() - bomb.spawnTime);
                const blinkRate = Math.sin((bomb.lifetime - timeLeft) / bomb.lifetime * Math.PI * 8) * 0.3 + 0.7;
                
                // Градиент для бомбы
                const bombGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
                bombGradient.addColorStop(0, `rgba(33, 33, 33, ${blinkRate})`);
                bombGradient.addColorStop(0.5, `rgba(66, 66, 66, ${blinkRate})`);
                bombGradient.addColorStop(1, `rgba(0, 0, 0, ${blinkRate})`);
                ctx.fillStyle = bombGradient;
                
                // Рисуем бомбу
                ctx.beginPath();
                ctx.arc(centerX, centerY, size / 2 - 1, 0, Math.PI * 2);
                ctx.fill();
                
                // Эффект свечения
                ctx.shadowColor = `rgba(255, 0, 0, ${blinkRate * 0.5})`;
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Фитиль бомбы
                ctx.fillStyle = `rgba(255, 200, 0, ${blinkRate})`;
                ctx.beginPath();
                ctx.arc(centerX, centerY - size / 3, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Искры (когда осталось меньше 40% времени жизни)
                if (timeLeft < bomb.lifetime * 0.4) {
                    ctx.fillStyle = `rgba(255, 100, 0, ${blinkRate})`;
                    ctx.beginPath();
                    ctx.arc(centerX - 3, centerY - size / 3 - 2, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(centerX + 3, centerY - size / 3 - 2, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        function moveSnake() {
            // Не двигаться, если направление не задано
            if (dx === 0 && dy === 0) {
                return;
            }

            const head = {x: snake[0].x + dx, y: snake[0].y + dy};

            // Проверка столкновения со стенами
            if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
                gameOver();
                return;
            }

            // Проверка столкновения с телом (начинаем с индекса 1, так как новая голова не может столкнуться со старой)
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    gameOver();
                    return;
                }
            }

            // Проверка столкновения с бомбами
            for (let bomb of bombs) {
                if (head.x === bomb.x && head.y === bomb.y) {
                    gameOver();
                    return;
                }
            }

            snake.unshift(head);

            // Проверка поедания еды (проверяем все звезды)
            const eatenFoodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
            if (eatenFoodIndex !== -1) {
                // Удаляем съеденную звезду
                foods.splice(eatenFoodIndex, 1);
                
                score++;
                if (scoreElement) {
                    scoreElement.textContent = score;
                }
                updateLevelProgress(); // Обновляем уровень и прогресс
                updateTopProgress(); // Обновляем верхнюю шкалу
                updateSkin(); // Обновляем скин каждые 10 звезд
                
                // Добавляем новую звезду, если их стало меньше максимума
                // Определяем, нужна ли новая исчезающая звезда или постоянная
                if (foods.length < MAX_FOODS) {
                    // Подсчитываем количество исчезающих и постоянных звезд
                    const disappearingCount = foods.filter(f => f.lifetime && f.spawnTime).length;
                    const disappearingTarget = Math.floor(MAX_FOODS / 2);
                    const shouldHaveLifetime = disappearingCount < disappearingTarget;
                    spawnSingleFood(shouldHaveLifetime);
                }
                
                // Интервал генерации бомб отключен - бомбы циклически обновляются
                // updateBombSpawnInterval();
            } else {
                snake.pop();
            }
        }

        function gameOver() {
            gameRunning = false;
            
            // Обновляем максимальный счет
            updateHighScore();
            
            // Запускаем анимацию исчезновения змейки
            snakeDisappearing = true;
            snakeDisappearStartTime = Date.now();
            
            // Останавливаем движение змейки
            dx = 0;
            dy = 0;
            
            // Постепенно удаляем сегменты змейки с конца
            const disappearInterval = setInterval(() => {
                if (snake.length > 0) {
                    snake.pop(); // Удаляем последний сегмент
                } else {
                    clearInterval(disappearInterval);
                    snakeDisappearing = false;
                }
            }, 50); // Удаляем сегмент каждые 50мс
            
            // Показываем экран проигрыша через небольшую задержку
            setTimeout(() => {
                if (finalScoreElement) {
                    finalScoreElement.textContent = score;
                }
                if (gameOverElement) {
                    gameOverElement.classList.add('show');
                }
                
                // Показываем заголовок и скрываем шкалу уровня когда игра окончена
                if (titleElement) {
                    titleElement.classList.remove('hidden');
                }
                if (levelContainerElement) {
                    levelContainerElement.classList.remove('visible');
                }
            }, 300); // Задержка 300мс для эффекта исчезновения
            
            // Остановка генерации бомб
            if (bombSpawnInterval) {
                clearInterval(bombSpawnInterval);
                bombSpawnInterval = null;
            }
        }

        function restartGame() {
            snake = [{x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2)}];
            bombs = [];
            dx = 0;
            dy = 0;
            score = 0;
            level = 1;
            currentSkin = 0; // Сбрасываем скин при перезапуске
            snakeDisappearing = false; // Сбрасываем флаг исчезновения
            snakeDisappearStartTime = 0;
            
            // Не показываем блок с инструкциями при перезапуске, если он был закрыт
            // (состояние сохраняется в localStorage)
            
            if (scoreElement) {
                scoreElement.textContent = score;
            }
            updateLevelProgress(); // Обновляем уровень и прогресс при перезапуске
            updateTopProgress(); // Обновляем верхнюю шкалу при перезапуске
            gameRunning = true;
            isPaused = false; // Сбрасываем паузу при перезапуске
            if (gameOverElement) {
                gameOverElement.classList.remove('show');
            }
            
            // Скрываем оверлей паузы при перезапуске
            const pauseElement = document.getElementById('pauseOverlay');
            if (pauseElement) {
                pauseElement.classList.remove('show');
            }
            
            // Скрываем заголовок и показываем шкалу уровня при старте игры
            if (titleElement) {
                titleElement.classList.add('hidden');
            }
            if (levelContainerElement) {
                levelContainerElement.classList.add('visible');
            }
            
            randomFood();
            
            // Очистка предыдущего интервала
            if (bombSpawnInterval) {
                clearInterval(bombSpawnInterval);
            }
            
            // Генерация начальных бомб (40 штук) при перезапуске
            spawnInitialBombs(40);
            
            // Интервал генерации бомб отключен - бомбы циклически обновляются
            updateBombSpawnInterval();
            
            gameLoop();
        }

        function gameLoop() {
            // Продолжаем отрисовку даже после gameOver, пока змейка исчезает
            if (isPaused) return;
            
            // Двигаем змейку только если игра запущена
            if (gameRunning) {
                moveSnake();
            }
            
            // Всегда отрисовываем игру (включая анимацию исчезновения)
            drawGame();

            // Продолжаем цикл, пока змейка не исчезла полностью
            if (gameRunning || snakeDisappearing) {
                const speed = gameRunning ? getGameSpeed() : 50; // Быстрее во время исчезновения
                setTimeout(gameLoop, speed);
            }
        }
        
        // Функция для паузы/возобновления игры
        function togglePause() {
            // Нельзя ставить на паузу, если игра не запущена или уже окончена
            if (!gameRunning) return;
            
            isPaused = !isPaused;
            const pauseElement = document.getElementById('pauseOverlay');
            
            if (isPaused) {
                // Показываем оверлей паузы
                if (pauseElement) {
                    pauseElement.classList.add('show');
                }
                // Останавливаем генерацию бомб
                if (bombSpawnInterval) {
                    clearInterval(bombSpawnInterval);
                    bombSpawnInterval = null;
                }
            } else {
                // Скрываем оверлей паузы
                if (pauseElement) {
                    pauseElement.classList.remove('show');
                }
                // Интервал генерации бомб отключен - бомбы циклически обновляются
                // updateBombSpawnInterval();
                // Возобновляем игровой цикл
                gameLoop();
            }
        }

        document.addEventListener('keydown', (e) => {
            // Обработка паузы (работает даже когда игра на паузе)
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                togglePause();
                return;
            }
            
            // Если игра не запущена или на паузе, игнорируем остальные клавиши
            if (!gameRunning || isPaused) return;

            // Предотвращение движения в противоположном направлении
            if (e.key === 'ArrowUp' && dy !== 1) {
                dx = 0;
                dy = -1;
                // Скрываем заголовок и показываем шкалу уровня когда игра начинается
                if (titleElement) titleElement.classList.add('hidden');
                if (levelContainerElement) levelContainerElement.classList.add('visible');
            } else if (e.key === 'ArrowDown' && dy !== -1) {
                dx = 0;
                dy = 1;
                if (titleElement) titleElement.classList.add('hidden');
                if (levelContainerElement) levelContainerElement.classList.add('visible');
            } else if (e.key === 'ArrowLeft' && dx !== 1) {
                dx = -1;
                dy = 0;
                if (titleElement) titleElement.classList.add('hidden');
                if (levelContainerElement) levelContainerElement.classList.add('visible');
            } else if (e.key === 'ArrowRight' && dx !== -1) {
                dx = 1;
                dy = 0;
                if (titleElement) titleElement.classList.add('hidden');
                if (levelContainerElement) levelContainerElement.classList.add('visible');
            }
        });

        // Сенсорное управление
        const touchButtons = document.querySelectorAll('.d-pad-button[data-direction]');
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        // Обработка нажатий на кнопки
        touchButtons.forEach(button => {
            const direction = button.getAttribute('data-direction');
            
            // Обработка нажатия мыши/тача
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleDirection(direction);
            });
            
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                handleDirection(direction);
            });
            
            // Отпускание кнопки
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
            });
        });

        // Функция обработки направления
        function handleDirection(direction) {
            if (!gameRunning) return;
            
            // Скрываем заголовок и показываем шкалу уровня когда игра начинается
            if (titleElement) titleElement.classList.add('hidden');
            if (levelContainerElement) levelContainerElement.classList.add('visible');
            
            switch(direction) {
                case 'up':
                    if (dy !== 1) {
                        dx = 0;
                        dy = -1;
                    }
                    break;
                case 'down':
                    if (dy !== -1) {
                        dx = 0;
                        dy = 1;
                    }
                    break;
                case 'left':
                    if (dx !== 1) {
                        dx = -1;
                        dy = 0;
                    }
                    break;
                case 'right':
                    if (dx !== -1) {
                        dx = 1;
                        dy = 0;
                    }
                    break;
            }
        }

        // Обработка свайпов (жесты)
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!gameRunning) return;
            
            const touch = e.changedTouches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
            
            handleSwipe();
        }, { passive: false });

        function handleSwipe() {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 30; // Минимальное расстояние для свайпа
            
            // Определяем направление свайпа
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Горизонтальный свайп
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0 && dx !== -1) {
                        // Свайп вправо
                        dx = 1;
                        dy = 0;
                        if (titleElement) titleElement.classList.add('hidden');
                        if (levelContainerElement) levelContainerElement.classList.add('visible');
                    } else if (deltaX < 0 && dx !== 1) {
                        // Свайп влево
                        dx = -1;
                        dy = 0;
                        if (titleElement) titleElement.classList.add('hidden');
                        if (levelContainerElement) levelContainerElement.classList.add('visible');
                    }
                }
            } else {
                // Вертикальный свайп
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0 && dy !== -1) {
                        // Свайп вниз
                        dx = 0;
                        dy = 1;
                        if (titleElement) titleElement.classList.add('hidden');
                        if (levelContainerElement) levelContainerElement.classList.add('visible');
                    } else if (deltaY < 0 && dy !== 1) {
                        // Свайп вверх
                        dx = 0;
                        dy = -1;
                        if (titleElement) titleElement.classList.add('hidden');
                        if (levelContainerElement) levelContainerElement.classList.add('visible');
                    }
                }
            }
        }

        // Предотвращаем скролл страницы при свайпах
        document.addEventListener('touchmove', (e) => {
            if (e.target === canvas || e.target.closest('.d-pad')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Инициализация игры
        randomFood();
        
        // Генерация начальных бомб (40 штук)
        spawnInitialBombs(40);
        
        // Инициализация уровня и прогресса после загрузки DOM
        function initializeProgress() {
            // Убеждаемся, что элементы видны
            if (levelProgressElement) {
                levelProgressElement.style.display = 'block';
                levelProgressElement.style.visibility = 'visible';
            }
            if (topProgressElement) {
                topProgressElement.style.display = 'block';
                topProgressElement.style.visibility = 'visible';
            }
            const levelContainer = document.querySelector('.level-container');
            if (levelContainer) {
                // Используем классы для управления видимостью
                if (gameRunning) {
                    levelContainer.classList.add('visible');
                    if (titleElement) {
                        titleElement.classList.add('hidden');
                    }
                }
            }
            const topProgressBar = document.querySelector('.top-progress-bar');
            if (topProgressBar) {
                topProgressBar.style.display = 'block';
                topProgressBar.style.visibility = 'visible';
            }
            
            updateLevelProgress();
            updateTopProgress();
        }
        
        // Вызываем сразу и после загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeProgress);
        } else {
            initializeProgress();
        }
        
        // Дополнительный вызов через небольшую задержку для надежности
        setTimeout(initializeProgress, 100);
        setTimeout(initializeProgress, 500);
        
        // Интервал генерации бомб отключен - бомбы циклически обновляются
        updateBombSpawnInterval();
        
        gameLoop();