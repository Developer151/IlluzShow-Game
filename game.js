// Основная логика, интерфейс, состояние и игровой цикл.

        // ==================== ДАННЫЕ ИГРЫ ====================
        function getAgeStageIndex(age) {
            const index = AGE_STAGES.findIndex(stage => age >= stage.min && age < stage.max);
            return index === -1 ? AGE_STAGES.length - 1 : index;
        }
        
        function getAgeStage(age) {
            return AGE_STAGES[getAgeStageIndex(age)];
        }
        
        function formatAge(age) {
            return Number.isInteger(age) ? String(age) : age.toFixed(1);
        }
        
        /*
            Плавный переход:
            последние 25% каждого этапа начинают подмешивать события следующего.
            Пример:
            возраст 8.75–10 — постепенно появляются события диапазона 10–15;
            возраст 14–15 — события подросткового периода начинают появляться раньше.
        */
        function getEventForAge(age) {
            const stageIndex = getAgeStageIndex(age);
            const currentStage = AGE_STAGES[stageIndex];
            const nextStage = AGE_STAGES[stageIndex + 1];
        
            let allowedStageIds = [currentStage.id];
        
            if (nextStage) {
                const stageLength = currentStage.max - currentStage.min;
                const transitionStart = currentStage.max - stageLength * 0.25;
        
                if (age >= transitionStart) {
                    const transitionProgress =
                        (age - transitionStart) / (currentStage.max - transitionStart);
        
                    // Вероятность события следующего этапа растёт от 0% до 70%.
                    if (Math.random() < transitionProgress * 0.7) {
                        allowedStageIds = [nextStage.id];
                    }
                }
            }
        
            const availableEvents = EVENTS_POOL.filter(event =>
                event.stages.some(stageId => allowedStageIds.includes(stageId))
            );
        
            return availableEvents[Math.floor(Math.random() * availableEvents.length)];
        }
        
        function getAgeStep(age) {
            const stage = getAgeStage(age);
            return stage.step;
        }
        
        function calculateDeathChance(actions) {
            const baseChance = 1; // Начальный шанс 5%
            const growthRate = 1.5; // Каждый шаг умножает шанс на 1.5
            const chance = baseChance * Math.pow(growthRate, actions);
            return Math.min(100, chance); // Максимум 100%
        }

        // Проверка на случайную смерть после 76.5 лет
        async function checkPostLimitDeath() {
            if (gameState.age >= 76.5) {
                gameState.postLimitActions++;
                const chance = calculateDeathChance(gameState.postLimitActions);
                const roll = Math.random() * 100; // Бросаем кубик от 0 до 100

                // Выводим предупреждение игроку
                print(`⚠️ Твоё тело изношено. Риск смерти: ${chance.toFixed(1)}%`, 'color-red');

                if (roll < chance) {
                    // Смерть наступила
                    header(' СМЕРТЬ ОТ ИЗНОСА ТЕЛА ');
                    print('Твой организм исчерпал свои ресурсы. Иллюзорность больше не может удерживать эту оболочку.', 'color-gray');
                    print('Последние ощущения растворяются в тишине.', 'color-violet');
                    print('');

                    gameState.alive = false;
                    gameState.death_count += 1;
                    gameState.in_purgatory = true;

                    const newAch = checkAchievements();
                    if (newAch.length) {
                        newAch.forEach(ach => {
                            print(`🏆 Скрытое достижение: ${ach.name} — ${ach.desc}`, 'color-magenta color-bold');
                        });
                    }

                    await sleep(2000);
                    await purgatory();
                    return true; // Игрок умер
                } else {
                    print('Ты выжил... пока что.', 'color-gray');
                    print('');
                }
            }
            return false; // Игрок жив
        }

        async function ageLimitDeath() {
            gameState.age = 76.5;
            gameState.alive = false;
            gameState.death_count += 1;
            gameState.in_purgatory = true;
        
            header(' ЗАВЕРШЕНИЕ ЖИЗНИ ');
            print('Твоё тело дошло до предела этой иллюзорности.', 'color-gray');
            print('Последние ощущения растворяются в тишине.', 'color-violet');
            print('');
        
            const newAch = checkAchievements();
            newAch.forEach(ach => {
                print(`${ach.name} — ${ach.desc}`, 'color-magenta color-bold');
            });
        
            await sleep(1800);
            return purgatory();
        }

        // ==================== СОСТОЯНИЕ ИГРЫ ====================
        let gameState = {
            consciousness_id: "",
            is_engineer: false,
            avatar_name: "",
            country: "",
            city: "",
            location: "",
            settlement_type: "",
            party_number: 0,
            party_count: 0,
            scenario: ["", "", ""],
            darkness: 50,
            light: 50,
            illusion_level: 5000,
            party_direction: "neutral",
            stats: { intellect: 10, morality: 10, emotions: 10, awareness: 0, violations: 0 },
            start_stats: {},
            inventory: [],
            visited_countries: new Set(),
            visited_cities: new Set(),
            visited_locations: new Set(),
            rebirth_count: 0,
            death_count: 0,
            age: 0,
            alive: true,
            in_purgatory: false,
            kz_verdict: "",
            history: [],
            color_scheme: "",
            achievements: JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)),
            postLimitActions: 0,
            fatigueCount: 0, 
            workUnlockedNotificationShown: false, 
            workHighlightActive: false,
            workHighlightUses: 0
        };

        let currentScene = "intro";
        let isBusy = false;
        let typingTimeout = null;

        // ==================== УТИЛИТЫ ====================
        const output = document.getElementById('game-output');
        const inputArea = document.getElementById('input-area');
        const commandInput = document.getElementById('command-input');
        const inputHint = document.getElementById('input-hint');
        let aiSayColor = 'color-lime';   // цвет реплик ИИ (меняется на светло-синий в кат-сцене выхода)
        let activeExitInputAbort = null; // функция прерывания текущего ввода режима запроса (для форса по таймеру)
        const spriteLayer = document.getElementById('sprite-layer');
        const spriteContent = document.getElementById('sprite-content');

        function getSaveKey() {
            // Если пульт передал флаг, используем ключ для тестов, иначе — для прода
            return window.__dbg_save_key || 'IlluzGameSave';
        }

        function cls() {
            output.innerHTML = '';
        }

        function print(text, className = '') {
            const div = document.createElement('div');
            div.className = className;
            div.textContent = text;
            output.appendChild(div);
            output.scrollTop = output.scrollHeight;
            return div;
        }

        function printHTML(html) {
            const div = document.createElement('div');
            div.innerHTML = html.trim()
            output.appendChild(div);
            output.scrollTop = output.scrollHeight;
        }

        async function printSlow(text, delay = 25, className = '') {
            return new Promise(resolve => {
                const div = document.createElement('div');
                div.className = className;
                output.appendChild(div);

                let i = 0;
                function type() {
                    if (i < text.length) {
                        div.textContent += text.charAt(i);
                        i++;
                        output.scrollTop = output.scrollHeight;
                        typingTimeout = setTimeout(type, delay);
                    } else {
                        resolve();
                    }
                }
                type();
            });
        }

        function stopTyping() {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
                typingTimeout = null;
            }
        }

        function header(title) {
            printHTML(`<div class="stage-header"> ${title.trim().toUpperCase()}</div>`);
        }

        String.prototype.centerPad = function(totalWidth) {
            const str = this.toString();
            const padding = totalWidth - str.length;
            const left = Math.floor(padding / 2);
            const right = padding - left;
            return ' '.repeat(Math.max(0, left)) + str + ' '.repeat(Math.max(0, right));
        };

        function divider() {
            printHTML('<div class="divider-line"></div>');        
        }

        function aiSay(text, delay = 20) {
            return printSlow(`◈ ИИ Корабля Земля: ${text}`, delay, aiSayColor);
        }

        function showSprite(type) {
            spriteContent.style.background = getSpriteBackground(type);
            spriteLayer.classList.add('visible');
        }

        function hideSprite() {
            spriteLayer.classList.remove('visible');
        }

        function getSpriteBackground(type) {
            switch(type) {
                case 'purgatory':
                    return 'radial-gradient(ellipse at center, rgba(128, 0, 128, 0.4) 0%, transparent 70%)';
                case 'scan':
                    return 'radial-gradient(ellipse at center, rgba(0, 255, 0, 0.3) 0%, transparent 70%)';
                case 'street':
                    return 'linear-gradient(180deg, rgba(100, 100, 150, 0.3) 0%, transparent 100%)';
                case 'tunnel':
                    return 'radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0%, rgba(100, 100, 100, 0.2) 50%, transparent 100%)';
                default:
                    return 'transparent';
            }
        }

        function getRandomLocation(country) {
            if (!LOCATIONS[country]) {
                console.warn(`Страна "${country}" не найдена в LOCATIONS!`);
                return { city: "Неизвестно", address: "Неизвестно" };
            }
            const cities = Object.keys(LOCATIONS[country]);
            const city = cities[Math.floor(Math.random() * cities.length)];
            const addresses = LOCATIONS[country][city];
            const address = addresses[Math.floor(Math.random() * addresses.length)];
            return { city, address };
        }

        function buildFamilyString(baseProfession) {
            const others = PROFESSIONS.filter(p => p !== baseProfession);
            const second = others[Math.floor(Math.random() * others.length)];
            return `семье ${baseProfession} и ${second}`;
        }

        function familyDisplay(family) {
            if (family.startsWith("семье ")) {
                return "Семья " + family.slice(6);
            }
            return family.charAt(0).toUpperCase() + family.slice(1);
        }

        function directionDisplay(direction) {
            const mapping = { "ascend": "Возвышение", "descend": "Падение", "neutral": "Нейтральный" };
            return mapping[direction] || direction;
        }

        function printDarknessLightSummary() {
            const d = gameState.darkness;
            const l = gameState.light;
        
            const darkCol = gameState.color_scheme === 'black_white' ? '#000000' : '#cc5de8';
            const lightCol = gameState.color_scheme === 'black_white' ? '#ffffff' : '#51cf66';
            const grayCol = '#868e96';
        
            const [darkTop, darkBottom] = forceBar5(d, darkCol, grayCol);
            const [lightTop, lightBottom] = forceBar5(l, lightCol, grayCol);
        
            // Верстка через классы
            const html = `
                <div class="dl-summary">
                    <div class="dl-row">
                        <div class="dl-label">Мрак:</div>
                        <div class="dl-bars">
                            <div>${darkTop}</div>
                            <div>${darkBottom}</div>
                        </div>
                        <div class="dl-value">${d}%</div>
                    </div>
                    <div class="dl-row">
                        <div class="dl-label">Свет:</div>
                        <div class="dl-bars">
                            <div>${lightTop}</div>
                            <div>${lightBottom}</div>
                        </div>
                        <div class="dl-value">${l}%</div>
                    </div>
                </div>
            `;
            
            printHTML(html);
        }

        function forceBar5(value, filledColor, emptyColor) {
            const tens = Math.floor(value / 10);
            const rem = value % 10;
            let top, bottom;

            if (rem === 0) {
                top = tens;
                bottom = tens;
            } else if (rem <= 5) {
                top = tens + 1;
                bottom = tens;
            } else {
                top = tens + 1;
                bottom = tens + 1;
            }

            top = Math.min(10, Math.max(0, top));
            bottom = Math.min(10, Math.max(0, bottom));

            const topLine = `<span style="color:${filledColor}">${'■'.repeat(top)}</span><span style="color:${emptyColor}">${'■'.repeat(10 - top)}</span>`;
            const bottomLine = `<span style="color:${filledColor}">${'■'.repeat(bottom)}</span><span style="color:${emptyColor}">${'■'.repeat(10 - bottom)}</span>`;

            return [topLine, bottomLine];
        }

        function statBar(val, color) {
            const total = 10;                          // ← 10 кубиков вместо 15
            const filled = Math.min(total, Math.floor(val / 5));  // ← 1 кубик = 5 очков
            const empty = total - filled;
            return `<span style="color:${color}">${'█'.repeat(filled)}</span><span class="color-gray">${'░'.repeat(empty)}</span> ${val}`;
        }

        function checkAchievements() {
            const unlocked = [];

            if (gameState.death_count >= 1 && !gameState.achievements["first_death"].unlocked) {
                gameState.achievements["first_death"].unlocked = true;
                unlocked.push(gameState.achievements["first_death"]);
            }
            if (gameState.stats.awareness >= 50 && !gameState.achievements["awareness_50"].unlocked) {
                gameState.achievements["awareness_50"].unlocked = true;
                unlocked.push(gameState.achievements["awareness_50"]);
            }
            if (gameState.stats.violations >= 10 && !gameState.achievements["violations_10"].unlocked) {
                gameState.achievements["violations_10"].unlocked = true;
                unlocked.push(gameState.achievements["violations_10"]);
            }
            if (gameState.stats.morality >= 30 && !gameState.achievements["moral_paragon"].unlocked) {
                gameState.achievements["moral_paragon"].unlocked = true;
                unlocked.push(gameState.achievements["moral_paragon"]);
            }
            if (gameState.rebirth_count >= 5 && !gameState.achievements["rebirth_5"].unlocked) {
                gameState.achievements["rebirth_5"].unlocked = true;
                unlocked.push(gameState.achievements["rebirth_5"]);
            }

            return unlocked;
        }

        function saveGame() {
            const saveData = Object.assign({}, gameState, {
                visited_countries: Array.from(gameState.visited_countries),
                visited_cities: Array.from(gameState.visited_cities),
                visited_locations: Array.from(gameState.visited_locations)
            });
            localStorage.setItem(getSaveKey(), JSON.stringify(saveData));
            print('💾 Прогресс сохранён', 'color-green');
        }
        function loadGame() {
            const saved = localStorage.getItem(getSaveKey());
            if (saved) {
                const data = JSON.parse(saved);
                gameState = Object.assign({}, data, {
                    visited_countries: new Set(data.visited_countries || []),
                    visited_cities: new Set(data.visited_cities || []),
                    visited_locations: new Set(data.visited_locations || [])
                });
                return true;
            }
            return false;
        }

        function deleteSave() {
            localStorage.removeItem(getSaveKey());
        }

        // ==================== ВВОД/ВЫБОР ====================
        function choiceInput(prompt, options) {
        return new Promise(resolve => {
            print('', 'color-yellow');
            print(`${prompt}`, 'color-yellow');
    
            const container = document.createElement('div');
            container.className = 'choice-buttons';
            const buttons = [];
    
            let locked = false;          // финальная блокировка: выбор уже принят
            let pending = [];            // нажатые индексы, ждущие подтверждения
            let commitTimer = null;      // таймер окна сбора нажатий
    
            function lockAllButtons() {
                document.querySelectorAll('.choice-btn').forEach(b => {
                    b.disabled = true;
                    b.style.pointerEvents = 'none';
                    b.style.opacity = '0.5';
                });
            }
    
            function cleanup() {
                window.removeEventListener('keydown', onKey);
                if (commitTimer) { clearTimeout(commitTimer); commitTimer = null; }
            }
    
            // Принять окончательное решение: один индекс из pending
            function commit() {
                if (locked) return;
                locked = true;
                cleanup();
    
                // случайный из нажатых
                const chosen = pending[Math.floor(Math.random() * pending.length)];
                const btn = buttons[chosen];
    
                // визуальный отклик
                btn.style.transition = 'background 0.1s, transform 0.1s, border-color 0.1s';
                btn.style.background = 'rgba(99, 230, 182, 0.4)';
                btn.style.borderColor = '#ffffff';
                btn.style.transform = 'scale(0.97)';
    
                setTimeout(() => {
                    btn.style.transform = '';
                    lockAllButtons();
                    resolve(chosen);
                }, 130);
            }
    
            // Регистрация нажатия (по цифре или по клику). Если locked — игнор.
            function registerChoice(i) {
                if (locked) return;
                if (!pending.includes(i)) pending.push(i);
    
                // Первое нажатие открывает короткое окно сбора.
                // Если игрок нажал вторую клавишу — она попадёт в pending.
                if (!commitTimer) {
                    commitTimer = setTimeout(commit, 120);
                }
            }
    
            function onKey(e) {
                if (locked) return;
                if (e.ctrlKey || e.altKey || e.metaKey) return;
    
                const n = parseInt(e.key, 10);
                if (isNaN(n) || n < 1 || n > buttons.length) return;
    
                e.preventDefault();
                registerChoice(n - 1);
            }
    
            options.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = `[${i + 1}] ${opt}`;
                btn.onclick = () => registerChoice(i);
                container.appendChild(btn);
                buttons.push(btn);
            });
    
            output.appendChild(container);
            output.scrollTop = output.scrollHeight;
    
            window.addEventListener('keydown', onKey);
        });
        }

        function waitEnter(promptText = '') {
            return new Promise(resolve => {
                inputArea.style.display = 'flex';

                if (promptText) {
                    print(promptText, 'color-gray');
                }

                const handler = (e) => {
                    if (e.key === 'Enter') {
                        commandInput.removeEventListener('keydown', handler);
                        inputArea.style.display = 'none';
                        commandInput.blur();
                        resolve();
                    }
                };

                commandInput.addEventListener('keydown', handler);
                commandInput.focus();
            });
        }

        // ==================== РЕЖИМ ЗАПРОСА К ИИ + КАТ-СЦЕНА ВЫХОДА ====================

        // Нормализация ввода: нижний регистр, только буквы/цифры/пробелы, схлопнутые пробелы
        function normalizeText(t) {
            return (t || '')
                .toLowerCase()
                .replace(/ё/g, 'е')
                .replace(/[^a-zа-я0-9\s]/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        // Ключевые фразы/слова, означающие желание выйти из иллюзорности
        const EXIT_PHRASES = [
            'можно выйти', 'выйти из иллюзорности', 'выйти из игры', 'хочу выйти',
            'не хочу играть', 'не хочу в это играть', 'не хочу жить в иллюзиях',
            'выпустите меня', 'выпусти меня', 'выпустите', 'выход из иллюзорности',
            'надоело играть', 'надоело жить', 'хочу выйти из этой жести'
        ];
        // «Сильные» слова, однозначно указывающие на желание выйти (без общих слов игры)
        const EXIT_STRONG_WORDS = ['выйти', 'выход', 'выпустите', 'выпусти', 'выпустить',
            'покинуть', 'покину', 'надоело'];

        // Определяем: это запрос на выход? Только явное намерение —
        // прямая фраза, сильная пара слов или высокая доля «сильных» слов выхода.
        function isExitRequest(raw) {
            const t = normalizeText(raw);
            if (!t) return false;

            // 1) прямое совпадение фраз выхода
            for (const p of EXIT_PHRASES) {
                if (t.includes(p)) return true;
            }

            // 2) сильные смысловые пары
            const hasStrong =
                (t.includes('выйти') && (t.includes('иллюз') || t.includes('игр') || t.includes('жест') || t.includes('это'))) ||
                (t.includes('не') && t.includes('хоч') && (t.includes('игр') || t.includes('это') || t.includes('жи'))) ||
                (t.includes('выпуст')) ||
                (t.includes('надоело') && (t.includes('игр') || t.includes('жи') || t.includes('иллюз')));
            if (hasStrong) return true;

            // 3) доля «сильных» слов выхода среди всех слов (обычные вопросы про игру сюда не попадают)
            const words = t.split(' ').filter(Boolean);
            if (words.length === 0) return false;
            let hits = 0;
            for (const w of words) {
                if (w.length < 4) continue;                       // короткие слова ("вы","не") не считаем
                if (EXIT_STRONG_WORDS.some(k => w.includes(k))) hits++;  // слово содержит ключ целиком
            }
            return (hits / words.length) >= 0.25 && hits >= 1;
        }

        // Подтверждение выхода: "да" + (хочу выйти | надоело играть | надоело жить в иллюзиях)
        function isExitConfirm(raw) {
            const t = normalizeText(raw);
            if (!t) return false;
            if (!/(^|\s)да(\s|$)/.test(t) && !t.startsWith('да')) return false;
            return t.includes('хочу выйти') || t.includes('надоело играть') ||
                   t.includes('надоело жить') || t.includes('надоело') || t.includes('выйти');
        }

        // Осмысленность: есть ли гласные и разумная структура (иначе — спам-набор)
        function isGibberish(raw) {
            const t = normalizeText(raw);
            if (!t) return true;
            const compact = t.replace(/\s/g, '');
            if (compact.length < 2) return true;

            const cyr = (compact.match(/[а-я]/g) || []).length;
            const lat = (compact.match(/[a-z]/g) || []).length;
            const digits = (compact.match(/[0-9]/g) || []).length;

            // почти всё цифры -> спам
            if (digits / compact.length > 0.5) return true;
            // латиница в русскоязычной игре без единого русского слова -> набор
            if (lat > 0 && cyr === 0) return true;
            // одна буква размножена ("аааааа")
            if (/^(.)\1{4,}$/.test(compact)) return true;

            if (cyr > 0) {
                const vowels = (compact.match(/[аеиоуыэюя]/g) || []).length;
                // нет гласных при длине > 3 -> набор согласных
                if (vowels === 0 && cyr > 3) return true;
                // доля гласных слишком мала для осмысленной русской речи
                if (vowels / cyr < 0.15) return true;
            }
            return false;
        }

        // ---------- Ввод в режиме запроса к ИИ ----------
        // Возвращает Promise<{type:'text'|'continue', value:string}>
        function exitModeInput(hintText) {
            return new Promise(resolve => {
                inputArea.style.display = 'flex';
                inputHint.textContent = hintText;
                commandInput.classList.add('color-exit-input');
                commandInput.value = '';

                const btnRow = document.createElement('div');
                btnRow.className = 'choice-buttons';
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = '[1] Продолжить игру';
                btnRow.appendChild(btn);
                output.appendChild(btnRow);
                output.scrollTop = output.scrollHeight;

                function cleanup() {
                    commandInput.removeEventListener('keydown', onKey);
                    btn.onclick = null;
                    btnRow.remove();
                    commandInput.classList.remove('color-exit-input');
                    activeExitInputAbort = null;
                }
                function onKey(e) {
                    if (e.key === 'Enter') {
                        const v = commandInput.value.trim();
                        if (!v) return;
                        commandInput.value = '';
                        cleanup();
                        resolve({ type: 'text', value: v });
                    }
                }
                btn.onclick = () => { cleanup(); resolve({ type: 'continue', value: '' }); };
                // Таймер может форсировать назначение — тогда прерываем ожидание ввода
                activeExitInputAbort = () => { cleanup(); resolve({ type: 'abort', value: '' }); };

                commandInput.addEventListener('keydown', onKey);
                commandInput.focus();
            });
        }

        // ---------- Подтверждение выхода: кнопка "Да" + строка ----------
        function exitConfirmInput() {
            return new Promise(resolve => {
                inputArea.style.display = 'flex';
                inputHint.textContent = 'Подтвердите: введите «Да, хочу выйти», либо нажмите кнопку';
                commandInput.classList.add('color-exit-input');
                commandInput.value = '';

                const btnRow = document.createElement('div');
                btnRow.className = 'choice-buttons';
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = '[1] Да';
                btnRow.appendChild(btn);
                output.appendChild(btnRow);
                output.scrollTop = output.scrollHeight;

                function cleanup() {
                    commandInput.removeEventListener('keydown', onKey);
                    btn.onclick = null;
                    btnRow.remove();
                    commandInput.classList.remove('color-exit-input');
                }
                function onKey(e) {
                    if (e.key === 'Enter') {
                        const v = commandInput.value.trim();
                        if (!v) return;
                        commandInput.value = '';
                        if (isExitConfirm(v)) { cleanup(); resolve(true); }
                        else { cleanup(); resolve(false); }
                    }
                }
                btn.onclick = () => { cleanup(); resolve(true); };

                commandInput.addEventListener('keydown', onKey);
                commandInput.focus();
            });
        }

        async function loadVersion() {
            try {
                // Запрашиваем файл VERSION.json (с кэш-бастингом, чтобы не брало старую версию)
                const response = await fetch('version.json?t=' + Date.now());
                if (!response.ok) throw new Error('Файл версии не найден');
                
                const data = await response.json();

                currentVersion = data.version; 
                
                // Вставляем версию в HTML
                const versionEl = document.getElementById('game-version');
                if (versionEl) {
                    versionEl.textContent = `v${data.version}`;
                }
            } catch (error) {
                console.warn('Не удалось загрузить версию:', error);
                // Если файла нет (например, при локальном запуске без сервера), пишем дефолт
                const versionEl = document.getElementById('game-version');
                if (versionEl) versionEl.textContent = 'v0.3.7-dev';
            }
        }

        // Запускаем загрузку версии при старте
        loadVersion();

        // ==================== ТАЙМЕР ЧИСТИЛИЩА ====================
        // Всего 200 сек (3:20). Показ с самого начала (уже <= 3:20).
        // <=20с и >10с: авто-назначение партии. <=10с: отсчёт как перед партией (10с).
        let purgatoryTimer = {
            remaining: 480,
            intervalId: null,
            expired: false,
            autoAssigned: false,
            warned3min: false,
            onExpire: null
        };

        function fmtTime(sec) {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        }

        function startPurgatoryTimer(onAutoAssign) {
            const el = document.getElementById('purgatory-timer');
            purgatoryTimer.remaining = 480; // Сбрасываем на 8 минут при старте
            purgatoryTimer.expired = false;
            purgatoryTimer.autoAssigned = false;
            purgatoryTimer.warned3min = false;
            purgatoryTimer.onExpire = onAutoAssign;
            
            // Изначально таймер скрыт
            el.style.display = 'none'; 

            purgatoryTimer.intervalId = setInterval(() => {
                purgatoryTimer.remaining--;
                if (purgatoryTimer.remaining < 0) purgatoryTimer.remaining = 0;

                // ФИШКА: Показываем таймер только когда осталось <= 200 секунд (3:20)
                if (purgatoryTimer.remaining <= 200) {
                    el.style.display = 'block';
                    purgatoryTimer.warned3min = true;
                    el.textContent = `Время в Чистилище: ${fmtTime(purgatoryTimer.remaining)}`;
                }
                if (purgatoryTimer.remaining == 200) {
                        purgatoryTimer.warned3min = true;
                        aiSay('Извините! Время пребывания в Чистилище ограничено. Осталось 3 минуты и 20 секунд. Вы хотите продолжить игру или задать какой нибудь вопрос?');
                }
                // За 20с до истечения (и пока > 10с) — автоматически назначаем иллюзорность
                if (purgatoryTimer.remaining <= 20 && purgatoryTimer.remaining > 10
                    && !purgatoryTimer.autoAssigned) {
                    purgatoryTimer.autoAssigned = true;
                    stopPurgatoryTimer();
                    if (typeof purgatoryTimer.onExpire === 'function') {
                        purgatoryTimer.onExpire();
                    }
                    if (typeof activeExitInputAbort === 'function') {
                        activeExitInputAbort();  // прерываем ожидание ввода игрока
                    }
                }
            }, 1000);
        }

        function stopPurgatoryTimer() {
            if (purgatoryTimer.intervalId) {
                clearInterval(purgatoryTimer.intervalId);
                purgatoryTimer.intervalId = null;
            }
            const el = document.getElementById('purgatory-timer');
            if (el) el.style.display = 'none';
        }

        // истёк ли таймер (для выбора длительности отсчёта: 10с вместо 5с)
        function timerExpired() {
            return purgatoryTimer.autoAssigned === true;
        }

        // ==================== СЦЕНЫ ====================
        async function chooseColorScheme() {
            //cls();
            header('ВЫБОР СТИЛЯ');

            print('\nИИ Корабля Земля: Выберите визуальный стиль отображения баланса.\n', 'color-cyan');

            print('  1. Классический', 'color-magenta');
            print('     Мрак: ■■■░░░ (Фиолетовый)');
            print('     Свет: ■■■░░░ (Зелёный)\n');

            print('  2. Монохромный', 'color-gray');
            print('     Мрак: ■■■░░░ (Чёрный)');
            print('     Свет: ■■■░░░ (Белый)\n');

            const idx = await choiceInput("Нажмите на номер варианта (1 или 2):", ["Классический", "Монохромный"]);
            return idx === 1 ? "black_white" : "violet_green";
        }

        async function partyAssignment() {
            //cls();
            header(' НАЗНАЧЕНИЕ ПАРТИИ ');

            await aiSay('Анализирую доступные иллюзорности в диапазоне 4995–5005...');
            print('');
            await sleep(800);

            gameState.party_number = Math.floor(Math.random() * 11) + 4995;
            gameState.party_count = gameState.rebirth_count + 1;

            const scenario = ILLUSION_SCENARIOS[Math.floor(Math.random() * ILLUSION_SCENARIOS.length)];
            const family = buildFamilyString(scenario[0]);
            gameState.scenario = [family, scenario[1], scenario[2]];
            gameState.country = scenario[2];

            const loc = getRandomLocation(gameState.country);
            gameState.city = loc.city;
            gameState.location = loc.address;
            gameState.settlement_type = SETTLEMENT_TYPES[Math.floor(Math.random() * SETTLEMENT_TYPES.length)];

            // Вектор партии
            if (gameState.light > gameState.darkness) {
                gameState.party_direction = 'ascend';
            } else if (gameState.darkness > gameState.light) {
                gameState.party_direction = 'descend';
            } else {
                gameState.party_direction = 'neutral';
            }

            // Спрайт улицы/двора
            showSprite('street');

            await aiSay(`Назначена иллюзорность #${gameState.party_number}.`);
            await aiSay(`Партия #${gameState.party_count}.`);
            await aiSay(`Вектор партии: ${directionDisplay(gameState.party_direction)}.`);
            await aiSay(`Вы начнёте партию в ${family}, ${scenario[1]} год, ${countryName(gameState.country)}.`);
            print('');
            await sleep(300);

            const dive = timerExpired() ? 10 : 5;
            await aiSay(`Погружение через ${dive} секунд. Память о регистрации будет стёрта.`);
            await aiSay('Сознание сохранит следы.');
            print('');

            for (let i = dive; i > 0; i--) {
                printHTML(`<span class="color-red color-bold">  ${i}...</span>`);
                await sleep(1000);
            }

            print('');
            print('Платформа под вами гаснет.', 'color-gray');
            print('Зелёные частицы рассеиваются.', 'color-gray');
            print('Вы падаете...', 'color-gray');
            print('');
            await sleep(500);

            hideSprite();
            return createAvatar();
        }

        function showHUD() {
            const [family, year, country] = gameState.scenario;

            const lines = [
                `<div class="hud-line color-cyan color-bold">■ Партия: #${gameState.party_count} ■</div>`,
                `<div class="hud-line">${familyDisplay(family)}, ${year}, ${countryName(country)}</div>`,
                `<div class="hud-line">Аватар: ${gameState.avatar_name} | Возраст: ${gameState.age} | Смертей: ${gameState.death_count}</div>`,
                `<div class="hud-line">Осознанность: ${gameState.stats.awareness} | Нарушения: ${gameState.stats.violations}</div>`,
            ];
            printHTML(`<div class="hud-header">${lines.join('')}</div>`);
        }

        function showProfile() {
            //cls();
            header(' ПРОФИЛЬ ');

            const [family, year, country] = gameState.scenario;

            const rows = [
                ['ID:', gameState.consciousness_id],
                ['Аватар:', gameState.avatar_name],
                ['Партия:', `#${gameState.party_count}`],
                ['Иллюзорность:', `#${gameState.party_number}`],
                ['Старт:', `${familyDisplay(family)}, ${year}, ${countryName(country)}`],
                ['Локация:', `${gameState.city} (${gameState.settlement_type})`],
                ['Адрес:', gameState.location],
                ['Возраст:', `${gameState.age} циклов`],
                ['Перерождения:', gameState.rebirth_count],
                ['Смертей:', gameState.death_count],
            ];        

            let html = '<div class="info-grid">';
            rows.forEach(([label, value]) => {
                html += `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`;
            });
            html += '</div>';
        
            printHTML(html);
            divider();

            print(`  Вектор: ${directionDisplay(gameState.party_direction)}`, 'color-gray');
            divider();
            print(`  Посещено стран: ${gameState.visited_countries.size}/${Object.keys(LOCATIONS).length}`, 'color-gray');
            print('');
        }

        function showStats() {
            //cls();
            header(' СТАТИСТИКА ');

            const s = gameState.stats;

            printHTML(`Интеллект:   ${statBar(s.intellect, '#74c0fc')}`);
            printHTML(`Мораль:      ${statBar(s.morality, '#51cf66')}`);
            printHTML(`Эмоции:      ${statBar(s.emotions, '#fcc419')}`);
            printHTML(`Осознанность:${statBar(s.awareness, '#cc5de8')}`);
            printHTML(`Нарушения:   ${statBar(s.violations, '#ff6b6b')}`);
            divider();
            print(`Вектор: ${directionDisplay(gameState.party_direction)}`);
            print('');
        }

        function showInventory() {
            //cls();
            header(' ИНВЕНТАРЬ ');

            if (!gameState.inventory.length) {
                print('  (пусто)', 'color-gray');
            } else {
                gameState.inventory.forEach(item => {
                    print(`  • ${item}`);
                });
            }
            showHUD();
            print('');
        }

        function showAchievements() {
            //cls();
            header(' ДОСТИЖЕНИЯ ');

            let found = false;
            for (const key in gameState.achievements) {
                const ach = gameState.achievements[key];
                if (ach.unlocked) {
                    print(`🏆 ${ach.name} — ${ach.desc}`, 'color-magenta color-bold');
                    found = true;
                }
            }
            showHUD();
            print('');

            if (!found) {
                print('Нет открытых достижений', 'color-gray');
            }
            print('');
        }

        function checkAgeMilestones() {
            if (gameState.age >= 16 && !gameState.workUnlockedNotificationShown) {
                gameState.workUnlockedNotificationShown = true;
                gameState.workHighlightActive = true;
                gameState.workHighlightUses = 0;
                
                header(' НОВАЯ ФУНКЦИЯ ');
                print('Появилась новая команда, введите h или help чтобы её увидеть', 'color-yellow');
                print('');
            }
        }

        function showHelp() {
            header(' СПРАВКА ');

            const commands = [
                ['help', 'Эта справка'],
                ['profile', 'Профиль персонажа'],
                ['stats', 'Статистика'],
                ['explore', 'Исследовать местность'],
                ['sleep', 'Спать'],
                ['inventory', 'Инвентарь'],
                ['achieve', 'Достижения'],
                ['info', 'Об игре и авторе'],
                ['save', 'Сохранить игру'],
            ];

            // Добавляем work только если возраст 16+
            if (gameState.age >= 16) {
                let workLabel = 'work';
                
                // Если нужно показать выделение
                if (gameState.workHighlightActive) {
                    workLabel = `<span class="help-cmd-wrapper">work <span class="new-badge">Новое</span></span>`;
                    gameState.workHighlightUses++;
                    
                    // Если это 3-й или более вывод help, убираем выделение
                    if (gameState.workHighlightUses >= 3) {
                        gameState.workHighlightActive = false;
                    }
                }
                
                // Вставляем work после explore (индекс 3, значит вставляем на 4-ю позицию)
                commands.splice(4, 0, [workLabel, 'Работать']);
            }

            let html = '<div class="help-grid">';
            commands.forEach(([cmd, desc]) => {
                html += `<div class="help-row">`;
                html += `<span class="help-cmd">${cmd}</span>`;
                html += `<span class="help-arrow">→</span>`;
                html += `<span class="help-desc">${desc}</span>`;
                html += `</div>`;
            });
            html += '</div>';
        
            printHTML(html);
            print('');
        }

        function info() {
            divider()
            printHTML(`<b>Версия игры:</b> v${currentVersion}`, 'color-cyan');
            printHTML(''); // Пустая строка для отступа
            printHTML("Игра ИЛЛЮЗGAME запущена в разработку 19.08.2026 и развивается с участием нескольких нейросетей: Kimi, Claude, Chat GPT, DeepSeek, Qwen, причем полностью на бесплатных тарифах.")
            printHTML("Нейросети не задают ОР, а лишь реализуют его!!! На момент 19 сентября: Сегодня, 19.09., ИГРЕ ИСПОЛНИЛСЯ МЕСЯЦ!")
            printHTML("Я вкладываю душу в опрятность UI, в логику и в целом стремлюсь улучшать UX. Состою в Ковчеге, Тайне, Красном Рынке, мой тг - @slava_kos_2006, а ник на GitHub - Developer151")
        }

        async function applyEffects(effects) {
            for (const [stat, delta] of Object.entries(effects)) {
                if (stat === 'morality') continue;   // ← мораль теперь производная
                if (gameState.stats.hasOwnProperty(stat)) {
                    gameState.stats[stat] = Math.max(0, gameState.stats[stat] + delta);
                    const color = delta > 0 ? '#51cf66' : delta < 0 ? '#ff6b6b' : '#868e96';
                    const sign = delta > 0 ? '+' : '';
                    printHTML(`  ${stat.charAt(0).toUpperCase() + stat.slice(1)}: <span style="color:${color}">${sign}${delta}</span>`);
                }
            }
            recalcMorality();   // ← пересчитываем мораль по новому балансу
        }

        function recalcMorality() {
          gameState.stats.morality = Math.round(gameState.light / 4);
        }

        function updateDarknessLightByAction(effects) {
            // Обновляем соотношение мрака и света по совершенным действиям
            let totalChange = 0;

            if (effects.morality) totalChange += effects.morality * 2;
            if (effects.violations) totalChange -= effects.violations * 3;
            if (effects.awareness) totalChange += effects.awareness;

            if (totalChange > 0) {
                // Хорошее дело - увеличиваем свет
                gameState.light = Math.min(100, gameState.light + Math.abs(totalChange));
                gameState.darkness = 100 - gameState.light;
            } else if (totalChange < 0) {
                // Плохое дело - увеличиваем мрак
                gameState.darkness = Math.min(100, gameState.darkness + Math.abs(totalChange));
                gameState.light = 100 - gameState.darkness;
            }

                recalcMorality();

            // Проверка на полную заполненность шкалы
            if (gameState.darkness >= 100 || gameState.light >= 100) {
            }
            return false;
        }

        function pixelTransition(fromColor, toColor, duration) {
            return new Promise(resolve => {
                const ov = document.getElementById('pixel-overlay');
                ov.style.opacity = '1';
                const start = performance.now();
                function step(now) {
                    let p = (now - start) / duration;
                    if (p > 1) p = 1;
                    const c = lerpColor(fromColor, toColor, p);
                    // квантование "пикселей": ступенчатая смена (эффект пикселизации по времени)
                    ov.style.background = c;
                    document.body.style.background = c;
                    if (p < 1) requestAnimationFrame(step);
                    else resolve();
                }
                requestAnimationFrame(step);
            });
        }

        function hex2rgb(h) {
            h = h.replace('#', '');
            return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
        }
        function lerpColor(a, b, t) {
            // квантуем t по 12 ступеням -> ступенчатая "пиксельная" смена
            const steps = 12;
            const qt = Math.round(t * steps) / steps;
            const ca = hex2rgb(a), cb = hex2rgb(b);
            const r = Math.round(ca[0] + (cb[0]-ca[0])*qt);
            const g = Math.round(ca[1] + (cb[1]-ca[1])*qt);
            const bl = Math.round(ca[2] + (cb[2]-ca[2])*qt);
            return `rgb(${r},${g},${bl})`;
        }

        // Плавное затемнение в чёрный через pixel-overlay (поверх цифр, под текстом)
        function fadeToBlack(duration) {
            return new Promise(resolve => {
                const ov = document.getElementById('pixel-overlay');
                ov.style.background = '#000000';
                ov.style.opacity = '0';
                const start = performance.now();
                function step(now) {
                    let p = (now - start) / duration;
                    if (p > 1) p = 1;
                    ov.style.opacity = String(p);
                    if (p < 1) requestAnimationFrame(step);
                    else resolve();
                }
                requestAnimationFrame(step);
            });
        }

        // ASCII-круг: наполнитель — серые 1/0, круг — половина красная / половина ярко-фиолетовая
        async function renderAsciiCircle() {
        const containerWidth = (output && output.clientWidth) || window.innerWidth;
        const R = 22;
        const cols = R * 2 + 1;
    
        // Реальное соотношение: ширина символа ≈ 0.6 * fontSize,
        // высота строки = lineHeight * fontSize = 1 * fontSize.
        // Значит клетка выше, чем шире, примерно в 1.6–1.7 раза.
        // Компенсируем это коэффициентом сжатия по Y.
        const cellAspect = 0.62;        // ширина / высота символа
        const ySquash = 2.0 / cellAspect; // ≈ 1.61 — во столько раз сжимаем Y
    
        let fontSize = containerWidth / (cols * (cellAspect + 0.06));
        fontSize = Math.max(8, Math.min(fontSize, 60));
        const letterSpacing = Math.max(0, Math.round(fontSize * 0.06));
    
        // Какие строки вообще содержат кольцо
        const ringRowsY = [];
        for (let y = -R; y <= R; y++) {
            let hasRing = false;
            for (let x = -R; x <= R; x++) {
                const dist = Math.sqrt(x * x + (y * ySquash) * (y * ySquash));
                if (Math.abs(dist - R) < 0.9) { hasRing = true; break; }
            }
            if (hasRing) ringRowsY.push(y);
        }
    
        const wrap = document.createElement('div');
        wrap.style.fontFamily = "'Arial', monospace";
        wrap.style.lineHeight = '1';
        wrap.style.fontSize = fontSize + 'px';
        wrap.style.letterSpacing = letterSpacing + 'px';
        wrap.style.whiteSpace = 'pre';
        wrap.style.textAlign = 'center';
        wrap.style.overflow = 'hidden';   // ← не даём кругу вылезти за контейнер
        output.appendChild(wrap);
    
        const ringSpans = [];
        let charCount = 0;
    
        for (const y of ringRowsY) {
            const rowDiv = document.createElement('div');
            for (let x = -R; x <= R; x++) {
                const dist = Math.sqrt(x * x + (y * ySquash) * (y * ySquash));
                if (Math.abs(dist - R) < 0.9) {
                    const span = document.createElement('span');
                    span.textContent = Math.random() < 0.5 ? '1' : '0';
                    span.style.color = 'rgba(255, 90, 40, .55)';
                    rowDiv.appendChild(span);
                    ringSpans.push(span);
                    charCount++;
                    if (charCount % 5 === 0) {
                        output.scrollTop = output.scrollHeight;
                        await sleep(28 + Math.random() * 22);
                    }
                } else {
                    rowDiv.appendChild(document.createTextNode(' '));
                }
            }
            wrap.appendChild(rowDiv);
            output.scrollTop = output.scrollHeight;
            await sleep(70 + Math.random() * 80);
        }
    
        // Мерцание кольца
        await new Promise(resolve => {
            const start = performance.now();
            const durationMs = 1000;
            let lastDraw = 0;
            let raf2 = null;   // ← объявляем ДО первого requestAnimationFrame
    
            function tick(now) {
                if (now - lastDraw > 110) {
                    lastDraw = now;
                    ringSpans.forEach(span => {
                        // иногда пробел — «дыхание»
                        const roll = Math.random();
                        if (roll < 0.08) {
                            span.textContent = ' ';
                        } else {
                            span.textContent = Math.random() < 0.5 ? '1' : '0';
                        }
                        const bright = Math.random() < 0.14;
                        span.style.color = bright
                            ? 'rgba(255, 150, 60, .95)'
                            : `rgba(255, 70, 30, ${(0.35 + Math.random() * 0.4).toFixed(2)})`;
                    });
                }
                if (now - start < durationMs) {
                    raf2 = requestAnimationFrame(tick);
                } else {
                    ringSpans.forEach(span => {
                        span.textContent = Math.random() < 0.5 ? '1' : '0';
                        span.style.color = 'rgba(255, 90, 40, .85)';
                    });
                    resolve();
                }
            }
            raf2 = requestAnimationFrame(tick);
        });
    
        output.scrollTop = output.scrollHeight;
        }

        function startMatrixRain() {
            return new Promise(resolve => {
                const canvas = document.getElementById('matrix-canvas');
                canvas.style.display = 'block';
        
                // ← сохраняем ссылку на stop первого запуска
                let stopNoise = startMatrixNoise(canvas, {
                    rampMultiplier: 5,
                    rampMs: 10000
                });
        
                const errorEl = document.getElementById('final-error');
                (async () => {
                    await sleep(10000);
                    errorEl.classList.add('breathing');
        
                    stopNoise();   // ← теперь работает — ссылка есть
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        
                    stopNoise = startMatrixNoise(canvas, {
                        baseInterval: 260,   // медленно, тягучее мерцание
                        brightChance: 0.02,
                        marginChance: 0.55
                    });
                })();
        
                resolve();
            });
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // ==================== ОБРАБОТКА КОМАНД ====================
        const COMMANDS = [
            "help", "profile", "stats", "explore", "work",
            "sleep", "inventory", "achieve",
            "save", "info"
        ];

        function findCommand(cmdInput) {
            if (!cmdInput) return null;

            cmdInput = cmdInput.trim().toLowerCase();

            if (COMMANDS.includes(cmdInput)) return cmdInput;

            const matches = COMMANDS.filter(c => c.startsWith(cmdInput));

            if (matches.length === 1) return matches[0];
            if (matches.length > 1) {
                print(`Неоднозначный ввод. Возможные варианты: ${matches.join(', ')}`, 'color-yellow');
                return null;
            }
            return null;
        }

        async function processCommand(cmd) {
            if (isBusy) return;
            isBusy = true;
            stopTyping();
        
            inputArea.style.display = 'none';
            commandInput.blur();
        
            document.querySelectorAll('.choice-btn').forEach(b => {
                b.disabled = true;
                b.style.opacity = '0.4';
                b.style.pointerEvents = 'none';
            });
        
            try {
                switch(cmd) {
                    case 'help':
                        showHelp();
                        break;
                    case 'profile':
                        showProfile();
                        break;
                    case 'stats':
                        showStats();
                        break;
                    case 'explore':
                        await explore();
                        break;
                    case 'work':
                        if (gameState.age < 16) {
                            print('Вы должны прожить до 16 лет для открытия команды', 'color-red');
                            await sleep(1000);
                        } else {
                            gameState.workHighlightActive = false; // Убираем выделение при использовании
                            await work();
                        }
                        break;
                    case 'sleep':
                        await sleepFunc();
                        break;
                    case 'inventory':
                        showInventory();
                        break;
                    case 'achieve':
                        showAchievements();
                        break;
                    case 'save':
                        saveGame();
                        await sleep(1000);
                        break;
                    case 'info':
                        info();
                        break;
                    default:
                        print('Неизвестная команда. Введи help для справки.', 'color-red');
                        await sleep(1000);
                }
            } finally {
                isBusy = false;
                commandInput.value = '';
                if (currentScene === 'main' && gameState.alive && !gameState.in_purgatory) {
                    inputArea.style.display = 'flex';
                    commandInput.focus();
                }
    }
}


        // ==================== ШУМ ЗАГРУЗКИ ИНТЕРФЕЙСА (переиспользуемый) ====================
        // Фон из цифр и заглавных латинских букв. Параметризован цветом и разгоном
        // скорости мерцания — используется и на интро, и на финальном экране.
        function startMatrixNoise(canvas, options = {}) {
            const {
                chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                bgColor = '#05030b',
                dimColor = (a) => `rgba(130, 130, 165, ${a})`,
                brightColor = 'rgba(225, 225, 240, 0.85)',
                brightChance = 0.035,
                marginChance = 0.34,
                baseInterval = 90,   // мс между перерисовками на старте
                rampMultiplier = 1,  // во сколько раз ускоряется мерцание к концу разгона
                rampMs = 0,          // за сколько мс достигается rampMultiplier (0 = без разгона)
                transparentBg = false, // true — не заливать фон (цифры поверх страницы)
                spreadMs = 0,        // >0 — цифры расползаются от центра за spreadMs мс
                sprayMs = 0,         // >0 — точечное распыление по всему экрану (аэрограф) за sprayMs мс
                sprayBgColor = null  // цвет, которым распылитель "закрашивает" уже прогруженные клетки
            } = options;

            const ctx = canvas.getContext('2d');
            let running = true;
            let raf = null;
            let lastDraw = 0;
            const startT = performance.now();
            // Пороги появления клеток для режима "распылитель": у каждой клетки
            // свой случайный момент, поэтому экран заполняется точечно, а не кругом.
            let sprayThresh = null;
            let sprayCols = 0;

            function resize() {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = canvas.clientWidth * dpr;
                canvas.height = canvas.clientHeight * dpr;
            }
            resize();
            window.addEventListener('resize', resize);

            function draw() {
                const dpr = window.devicePixelRatio || 1;
                const fontSize = 14 * dpr;
                const cellW = fontSize * 0.62;
                const cellH = fontSize * 1.15;

                if (transparentBg) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.font = `${fontSize}px 'Arial', monospace`;
                ctx.textBaseline = 'top';

                const cols = Math.ceil(canvas.width / cellW);
                const rows = Math.ceil(canvas.height / cellH);

                // Радиус распространения от центра (для spreadMs > 0): 0 -> весь экран
                const cc = cols / 2, cr = rows / 2;
                const maxDist = Math.sqrt(cc * cc + cr * cr);
                let radius = maxDist;
                if (spreadMs > 0) {
                    let p = (performance.now() - startT) / spreadMs;
                    if (p > 1) p = 1;
                    const eased = 1 - Math.pow(1 - p, 2); // ускоряющееся распространение
                    radius = maxDist * eased;
                }

                // Прогресс распыления (0..1): доля экрана, которая уже "прогрузилась"
                let sprayP = 1;
                if (sprayMs > 0) {
                    sprayP = (performance.now() - startT) / sprayMs;
                    if (sprayP > 1) sprayP = 1;
                    // раскладываем/пересоздаём пороги при изменении размера сетки
                    if (!sprayThresh || sprayCols !== cols || sprayThresh.length !== cols * rows) {
                        sprayCols = cols;
                        sprayThresh = new Float32Array(cols * rows);
                        for (let i = 0; i < sprayThresh.length; i++) sprayThresh[i] = Math.random();
                    }
                }

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (spreadMs > 0) {
                            const dc = c - cc, dr = r - cr;
                            if (Math.sqrt(dc * dc + dr * dr) > radius) continue;
                        }
                        // === РЕЖИМ РАСПЫЛИТЕЛЯ (аэрограф) ===
                        // Клетка "прогружается", когда прогресс времени дошёл до её
                        // случайного порога, и ПОСЛЕ этого остаётся занятой навсегда:
                        // никаких marginChance-пропусков, чтобы экран не мерцал дырами,
                        // а точечно и необратимо заполнялся сеткой символов.
                        if (sprayMs > 0 && sprayThresh) {
                            if (sprayThresh[r * cols + c] > sprayP) continue; // ещё не прогрузилась
                            // тёмная плашка под клеткой — закрывает чат под канвасом,
                            // так что распылитель реально ЗАМЕНЯЕТ экран, а не лежит поверх
                            if (sprayBgColor) {
                                ctx.fillStyle = sprayBgColor;
                                ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
                            }
                            const ch = chars[(Math.random() * chars.length) | 0];
                            const bright = Math.random() < brightChance;
                            ctx.fillStyle = bright ? brightColor : dimColor(0.35 + Math.random() * 0.55);
                            ctx.fillText(ch, c * cellW, r * cellH);
                            continue;
                        }

                        if (Math.random() < marginChance) continue; // пропуски, как на скриншоте-референсе
                        const ch = chars[(Math.random() * chars.length) | 0];
                        const bright = Math.random() < brightChance;
                        ctx.fillStyle = bright ? brightColor : dimColor(0.10 + Math.random() * 0.22);
                        ctx.fillText(ch, c * cellW, r * cellH);
                    }
                }
            }

            function currentInterval(now) {
                if (!rampMs || rampMultiplier <= 1) return baseInterval;
                let p = (now - startT) / rampMs;
                if (p > 1) p = 1;
                const mult = 1 + (rampMultiplier - 1) * p; // 1x -> rampMultiplier x
                return baseInterval / mult;
            }

            function loop(now) {
                if (!running) return;
                if (now - lastDraw > currentInterval(now)) { // редкая перерисовка — мерцание, а не анимация 60fps
                    lastDraw = now;
                    draw();
                }
                raf = requestAnimationFrame(loop);
            }
            raf = requestAnimationFrame(loop);

            return function stop() {
                running = false;
                if (raf) cancelAnimationFrame(raf);
                window.removeEventListener('resize', resize);
            };
        }

        // Промаргивание: несколько раз чередуем "видимое" и "скрытое" состояние
        // со случайным интервалом, как будто элемент не хочет прогрузиться,
        // и только потом оставляем его на экране насовсем.
        async function flickerToggle(showFn, hideFn, cycles, minDelay, maxDelay) {
            for (let i = 0; i < cycles; i++) {
                showFn();
                await sleep(minDelay + Math.random() * (maxDelay - minDelay));
                hideFn();
                await sleep((minDelay * 0.6) + Math.random() * (maxDelay - minDelay) * 0.6);
            }
            showFn();
        }

        // ==================== ASCII-ЗАСТАВКА ====================
        async function playIntroSplash() {
            const splash = document.getElementById('intro-splash');
            const frame = splash.querySelector('.splash-frame');
            const kicker = splash.querySelector('.splash-kicker');
            const matrixCanvas = document.getElementById('intro-matrix-canvas');
            const art = document.getElementById('splash-ascii');
            const bits = document.getElementById('splash-bits');
            const continueHint = document.getElementById('splash-continue');

            const asciiLogo = [
                " _   __   _____   _____   _   _  _    ____",
                " | | /  | |  _  | |  _  | | | / || \\  |    |",
                " | |/   | | | | | | | | | | |/  ||  \\ |_/\\ /",
                " | | /| | | | | | | | | | |     ||  |  _ < \\",
                " | |/ | | | | | | | | | | | |\\  ||  / / \\/ |",
                " |_/  |_|/__| |_|/__| |_| |_| \\_||_/  |____/",
                " _____      ___       _    _   ____",
                " | ____|    /   \\     | \\__/ | |  __|",
                "| |       /     \\    |      | | |__",
                " | |  _   /  /_\\  \\   | |\\/| | |  __|",
                " | |_| | /  _____  \\  | |  | | | |___",
                "  |_____//__/     \\__\\ |_|  |_| |_____|"
            ].join("\n");

            const binary = "01001001010100100100";

            // Массив строк не меняем — просто делим его на две смысловые части:
            // первые 6 строк это "ИЛЛЮЗ", последние 6 — "ГЕЙМ".
            const illuzLines = asciiLogo.split("\n").slice(0, 6);
            const gameLines = asciiLogo.split("\n").slice(6, 12);
            const illuzPart = illuzLines.join("\n");
            const gamePart = gameLines.join("\n");

            // "Пустые" версии — те же строки, но из пробелов той же длины.
            // Место под них уже зарезервировано, поэтому верстка не дёргается,
            // хотя текста на экране как бы нет.
            const blankLines = (lines) => lines.map(l => " ".repeat(l.length)).join("\n");
            const illuzBlank = blankLines(illuzLines);
            const gameBlank = blankLines(gameLines);

            // --- Начальное состояние: виден только шум, всё остальное скрыто ---
            const stopMatrix = startMatrixNoise(matrixCanvas);
            frame.style.opacity = '0';       // рамочка целиком (фон + border + outline + тень)
            kicker.style.opacity = '0';
            art.textContent = illuzBlank + "\n" + gameBlank; // высота уже зарезервирована
            bits.textContent = '';

            // --- Фаза 1: чистый шум загрузки интерфейса ---
            await sleep(1300);

            // --- Фаза 2: промаргивает рамочка целиком — фон, обе рамки (border+outline)
            // и свечение появляются вместе одним морганием, а не по отдельности ---
            await flickerToggle(
                () => { frame.style.opacity = '1'; },
                () => { frame.style.opacity = '0'; },
                6, 45, 150
            );
            await sleep(120);

            // --- Фаза 3: промаргивает заголовок "ЗАПУСК ИЛЛЮЗGAME" ---
            await flickerToggle(
                () => { kicker.style.opacity = '1'; },
                () => { kicker.style.opacity = '0'; },
                6, 45, 150
            );

            // --- Фаза 4: промаргивает ИЛЛЮЗ, затем ГЕЙМ (как и раньше) ---
            await flickerToggle(
                () => { art.textContent = illuzPart + "\n" + gameBlank; },
                () => { art.textContent = illuzBlank + "\n" + gameBlank; },
                6, 45, 150
            );
            await sleep(180);
            await flickerToggle(
                () => { art.textContent = illuzPart + "\n" + gamePart; },
                () => { art.textContent = illuzPart + "\n" + gameBlank; },
                6, 45, 150
            );

            // ВТОРАЯ ПОЛОВИНА ПРОГРУЖЕНА — теперь плавно гасим матричный шум
            matrixCanvas.style.transition = 'opacity 1000ms ease';
            matrixCanvas.style.opacity = '0';
            stopMatrix(); // Останавливаем рендер в фоне

            // Бинарная строка появляется после того, как обе части прогрузились.
            bits.textContent = binary;

            // --- Ждём действия игрока: клавиша, клик или тап — и сразу входим в игру,
            // чтобы не резать анимацию по таймеру и не заставлять ждать зря. ---
            continueHint.classList.add('visible');
            await new Promise(resolve => {
                function proceed() {
                    window.removeEventListener('keydown', proceed);
                    window.removeEventListener('mousedown', proceed);
                    window.removeEventListener('touchstart', proceed);
                    resolve();
                }
                window.addEventListener('keydown', proceed, { once: true });
                window.addEventListener('mousedown', proceed, { once: true });
                window.addEventListener('touchstart', proceed, { once: true });
            });

            splash.classList.add('fade-out');
            matrixCanvas.style.transition = 'opacity 450ms ease';
            matrixCanvas.style.opacity = '0';
        
            await new Promise(resolve => setTimeout(resolve, 450));
            splash.remove();
            stopMatrix(); // Останавливаем рендер, чтобы не жрал ресурсы в фоне
        }

        // ==================== ЗАПУСК ИГРЫ ====================
        async function initGame() {
            commandInput.addEventListener('keydown', async (e) => {
                // Пока активна модальная сцена (режим запроса, waitEnter, выбор) —
                // ввод обрабатывают их собственные слушатели, командный парсер молчит.
                if (isBusy) return;
                if (e.key === 'Enter' && commandInput.value.trim()) {
                    const cmd = findCommand(commandInput.value);
                    if (cmd) {
                        await processCommand(cmd);
                    } else if (commandInput.value.trim() !== '') {
                        print('Неизвестная команда. Введи help для справки.', 'color-red');
                        commandInput.value = '';
                    }
                }
            });

            // Проверка сохранения
            if (loadGame()) {
                //cls();
                print(`💾 Найдено сохранение: ${gameState.consciousness_id}`, 'color-green');

                const idx = await choiceInput('Что делаем?', ['Продолжить', 'Новая игра', 'Удалить сохранение']);

                if (idx === 1) {
                    deleteSave();
                    gameState = {
                        consciousness_id: "", is_engineer: false, avatar_name: "", country: "",
                        city: "", location: "", settlement_type: "", party_number: 0, party_count: 0,
                        scenario: ["", "", ""], darkness: 50, light: 50, illusion_level: 5000,
                        party_direction: "neutral", stats: { intellect: 10, morality: 10, emotions: 10, 
                        awareness: 0, violations: 0 }, start_stats: {}, inventory: [], visited_countries: new Set(), visited_cities: new Set(),
                        visited_locations: new Set(), rebirth_count: 0, death_count: 0, age: 0, alive: true,
                        in_purgatory: false, fatigueCount: 0, workUnlockedNotificationShown: false, 
                        workHighlightActive: false,workHighlightUses: 0, kz_verdict: "", history: [], color_scheme: "", 
                        achievements: JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS))
                    };
                } else if (idx === 2) {
                    deleteSave();
                    gameState = {
                        consciousness_id: "", is_engineer: false, avatar_name: "", country: "",
                        city: "", location: "", settlement_type: "", party_number: 0, party_count: 0,
                        scenario: ["", "", ""], darkness: 50, light: 50, illusion_level: 5000,
                        party_direction: "neutral", stats: { intellect: 10, morality: 10, emotions: 10, awareness: 0, 
                        violations: 0 }, start_stats: {}, inventory: [], visited_countries: new Set(), visited_cities: new Set(),
                        visited_locations: new Set(), rebirth_count: 0, death_count: 0, age: 0, alive: true,
                        in_purgatory: false, kz_verdict: "", history: [], color_scheme: "", fatigueCount: 0, 
                        workUnlockedNotificationShown: false, workHighlightActive: false, workHighlightUses: 0,
                        achievements: JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS))
                    };
                } else if (idx === null) {
                    //cls();
                    print('До встречи.', 'color-gray');
                    return;
                }
            }

            if (!gameState.consciousness_id) {
                gameState.color_scheme = await chooseColorScheme();
                print('');
                await sleep(500);
                await registrationScene();
            } else {
                createAvatar();
            }
        }

        // Запуск при загрузке страницы
        window.onload = async () => {
            await playIntroSplash();
            await initGame();
        };
