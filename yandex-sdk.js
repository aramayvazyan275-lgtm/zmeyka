// Файл для интеграции Yandex SDK в игру "Змейка"

// Инициализация Yandex SDK
function initYandexSDK() {
    // Проверяем, что Yandex SDK доступен
    if (window.ymobile) {
        console.log('Yandex SDK успешно загружен');
        
        // Инициализация SDK
        ymobile.init({
            // Настройки SDK
            gameId: 'your-game-id', // Замените на реальный ID игры из Яндекс.Игры
            version: '1.0.0',
            platform: 'web',
            debug: true
        });
        
        // Загружаем данные пользователя
        loadPlayerData();
        
        // Загружаем сохраненные данные
        loadGameProgress();
        
        // Подписываемся на события SDK
        setupSDKEvents();
        
    } else {
        console.warn('Yandex SDK недоступен. Работаем в режиме веб-сайта.');
        // Если SDK недоступен, используем localStorage для сохранения данных
    }
}

// Загрузка данных пользователя
function loadPlayerData() {
    if (window.ymobile) {
        ymobile.player.getAuthenticatedPlayer()
            .then(player => {
                console.log('Игрок аутентифицирован:', player);
                // Сохраняем ID игрока
                window.playerId = player.getUniqueId();
                window.playerName = player.getName();
            })
            .catch(error => {
                console.error('Ошибка получения данных игрока:', error);
            });
    }
}

// Сохранение прогресса игры
function saveGameProgress() {
    const gameData = {
        score: window.score || 0,
        level: window.level || 1,
        highScore: window.highScore || 0,
        timestamp: Date.now()
    };

    if (window.ymobile) {
        // Сохраняем в облаке Яндекса
        ymobile.player.getDataAsync(['progress'])
            .then(response => {
                const data = response.getData();
                data.progress = gameData;
                return ymobile.player.setDataAsync({ data });
            })
            .then(() => {
                console.log('Прогресс успешно сохранен в облаке');
            })
            .catch(error => {
                console.error('Ошибка сохранения прогресса:', error);
            });
    } else {
        // Сохраняем в localStorage
        localStorage.setItem('snakeGameProgress', JSON.stringify(gameData));
        console.log('Прогресс сохранен в localStorage');
    }
}

// Загрузка прогресса игры
function loadGameProgress() {
    if (window.ymobile) {
        // Загружаем из облака Яндекса
        ymobile.player.getDataAsync(['progress'])
            .then(response => {
                const data = response.getData();
                if (data.progress) {
                    const gameData = data.progress;
                    window.score = gameData.score;
                    window.level = gameData.level;
                    window.highScore = gameData.highScore;
                    console.log('Прогресс загружен из облака:', gameData);
                    
                    // Обновляем UI
                    updateGameUI();
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки прогресса:', error);
            });
    } else {
        // Загружаем из localStorage
        const savedData = localStorage.getItem('snakeGameProgress');
        if (savedData) {
            const gameData = JSON.parse(savedData);
            window.score = gameData.score;
            window.level = gameData.level;
            window.highScore = gameData.highScore;
            console.log('Прогресс загружен из localStorage:', gameData);
            
            // Обновляем UI
            updateGameUI();
        }
    }
}

// Обновление UI после загрузки данных
function updateGameUI() {
    if (window.score !== undefined && document.getElementById('score')) {
        document.getElementById('score').textContent = window.score;
    }
    
    if (window.level !== undefined && document.getElementById('level')) {
        document.getElementById('level').textContent = window.level;
    }
    
    if (window.highScore !== undefined && document.getElementById('highScore')) {
        document.getElementById('highScore').textContent = window.highScore;
    }
    
    // Обновляем прогресс
    if (typeof updateLevelProgress === 'function') {
        updateLevelProgress();
    }
    if (typeof updateTopProgress === 'function') {
        updateTopProgress();
    }
}

// Показ рекламы
function showRewardedAd() {
    if (window.ymobile) {
        ymobile.ad.showRewarded({
            callback: (result) => {
                if (result === 'rewarded') {
                    console.log('Реклама просмотрена, игрок получает награду');
                    // Добавляем бонус игроку
                    addRewardToPlayer();
                } else {
                    console.log('Реклама не была просмотрена:', result);
                }
            }
        });
    } else {
        console.log('Yandex SDK недоступен, реклама не показана');
        // В режиме веб-сайта можно показать альтернативную рекламу или просто сообщение
    }
}

// Добавление награды игроку за просмотр рекламы
function addRewardToPlayer() {
    // Например, добавляем 50 очков
    if (window.score !== undefined) {
        window.score += 50;
        if (window.scoreElement) {
            window.scoreElement.textContent = window.score;
        }
        console.log('Игрок получил 50 бонусных очков');
    }
}

// Показываем таблицу лидеров
function showLeaderboard() {
    if (window.ymobile) {
        ymobile.leaderboard.getLeaderboard('snake_highscore')
            .then(leaderboard => {
                return leaderboard.getEntries({
                    includeUser: true,
                    quantityTop: 10
                });
            })
            .then(entries => {
                console.log('Таблица лидеров:', entries);
                // Здесь можно отобразить таблицу лидеров
                displayLeaderboard(entries);
            })
            .catch(error => {
                console.error('Ошибка получения таблицы лидеров:', error);
            });
    } else {
        console.log('Yandex SDK недоступен, таблица лидеров не доступна');
    }
}

// Отображение таблицы лидеров
function displayLeaderboard(entries) {
    // Создаем или обновляем элемент с таблицей лидеров
    let leaderboardElement = document.getElementById('leaderboard');
    if (!leaderboardElement) {
        leaderboardElement = document.createElement('div');
        leaderboardElement.id = 'leaderboard';
        leaderboardElement.className = 'leaderboard';
        document.body.appendChild(leaderboardElement);
    }
    
    let html = '<h3>Таблица лидеров</h3><ul>';
    entries.forEach((entry, index) => {
        html += `<li>${index + 1}. ${entry.player.getName()} - ${entry.score}</li>`;
    });
    html += '</ul>';
    
    leaderboardElement.innerHTML = html;
    
    // Добавляем кнопку для закрытия таблицы
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.onclick = () => {
        leaderboardElement.style.display = 'none';
    };
    leaderboardElement.appendChild(closeBtn);
}

// Отправка рекорда в таблицу лидеров
function submitScoreToLeaderboard() {
    const currentScore = window.score || 0;
    
    if (window.ymobile && currentScore > 0) {
        ymobile.leaderboard.getLeaderboard('snake_highscore')
            .then(leaderboard => {
                return leaderboard.setScore(currentScore);
            })
            .then(() => {
                console.log('Рекорд отправлен в таблицу лидеров:', currentScore);
            })
            .catch(error => {
                console.error('Ошибка отправки рекорда:', error);
            });
    }
}

// Настройка событий SDK
function setupSDKEvents() {
    if (window.ymobile) {
        // Подписываемся на события жизненного цикла
        ymobile.lifecycle.on('pause', () => {
            console.log('Игра приостановлена');
            // Сохраняем прогресс при паузе
            saveGameProgress();
        });
        
        ymobile.lifecycle.on('resume', () => {
            console.log('Игра возобновлена');
        });
        
        ymobile.lifecycle.on('destroy', () => {
            console.log('Игра закрыта');
            // Сохраняем прогресс перед закрытием
            saveGameProgress();
        });
    }
}

// Функция для вызова при завершении игры
function onGameOver() {
    // Сохраняем прогресс
    saveGameProgress();
    
    // Отправляем рекорд в таблицу лидеров
    submitScoreToLeaderboard();
    
    // Можно предложить игроку посмотреть рекламу за награду
    // showRewardedAd();
}

// Функция для вызова при перезапуске игры
function onGameRestart() {
    // Загружаем прогресс при перезапуске
    loadGameProgress();
}

// Инициализация SDK при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем Yandex SDK
    const script = document.createElement('script');
    script.src = 'https://yandex.ru/games/sdk/v2';
    script.async = true;
    script.onload = () => {
        console.log('Yandex SDK загружен');
        // Ждем полной инициализации SDK
        if (window.ymobile) {
            window.ymobile.ready()
                .then(() => {
                    console.log('Yandex SDK готов к работе');
                    initYandexSDK();
                })
                .catch(error => {
                    console.error('Ошибка инициализации Yandex SDK:', error);
                    // Работаем без SDK
                    initYandexSDK();
                });
        } else {
            // Работаем без SDK
            initYandexSDK();
        }
    };
    script.onerror = () => {
        console.warn('Не удалось загрузить Yandex SDK');
        // Работаем без SDK
        initYandexSDK();
    };
    document.head.appendChild(script);
});

// Экспортируем функции для использования в основном скрипте
window.YandexSDK = {
    saveGameProgress,
    loadGameProgress,
    showRewardedAd,
    showLeaderboard,
    submitScoreToLeaderboard,
    onGameOver,
    onGameRestart
};

// Глобальные функции для вызова из HTML
window.showRewardedAd = function() {
    if (window.YandexSDK && typeof window.YandexSDK.showRewardedAd === 'function') {
        window.YandexSDK.showRewardedAd();
    } else {
        console.log('Yandex SDK недоступен, реклама не показана');
    }
};

window.showLeaderboard = function() {
    if (window.YandexSDK && typeof window.YandexSDK.showLeaderboard === 'function') {
        window.YandexSDK.showLeaderboard();
    } else {
        console.log('Yandex SDK недоступен, таблица лидеров не доступна');
    }
};