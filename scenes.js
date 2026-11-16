// Сценарии и игровые сцены. Функции используют глобальное состояние и утилиты из game.js.

        async function registrationScene() {
            //cls();

            print('', 'color-violet color-bold');
            await printSlow('Ты — чистое Сознание, только что погруженное в Корабль Земля.');
            print('', 'color-reset');

            print('\nВы находитесь на круглой платформе с подсветкой границ.', 'color-gray');
            print('Внизу платформы фиолетовое свечение и картинка космоса.', 'color-gray');
            print('Перед собой вы видите сгусток светлых зелёных частиц.\n', 'color-gray');

            // Спрайт Чистилища
            showSprite('purgatory');

            await aiSay('Приветствую, сознание.');
            await sleep(300);
            await aiSay('Скоро начнётся ваша первая партия в одной из иллюзорностей Корабля Земля.');
            print('');
            await sleep(300);
            await aiSay('Цель Корабля Земля - предоставить вам полный спектр ощущений.');
            print('');
            await sleep(300);
            await aiSay('Местом проведения первых партий являются иллюзорности в пределах 4995–5005-й.');
            print('');
            await sleep(300);
            await aiSay('Перед каждой новой партией память о прошлой партии будет стираться.');
            print('');
            await sleep(300);
            await aiSay('Но Сознание остаётся. Оно накапливает опыт в партиях, даже если не помнит.');
            print('');
            await sleep(300);

            // Спрайт сканирования
            showSprite('scan');
            await sleep(2000);
            hideSprite();

            const baseId = Math.floor(Math.random() * 9999) + 1;
            const isEngineer = Math.random() < 0.01;

            if (isEngineer) {
                const engNum = Math.floor(Math.random() * 500) + 1;
                gameState.consciousness_id = `Сознание#${baseId}_И${engNum}`;
                gameState.is_engineer = true;
                await aiSay('Запускаю процесс регистрации...');
                await aiSay(`Вам присвоен идентификатор: ${gameState.consciousness_id}.`);
                await aiSay('Вы — инженер, состоите в Персонале Корабля Земля.');
            } else {
                gameState.consciousness_id = `Сознание#${baseId}`;
                await aiSay('Запускаю процесс регистрации...');
                await aiSay(`Вам присвоен идентификатор: ${gameState.consciousness_id}.`);
                await aiSay('Вы — простое сознание с характеристиками как у всех.');
            }
            print('');
            await sleep(300);

            await aiSay('Приготовьтесь к погружению.');
            print('');
            await sleep(300);

            await aiSay('Ваше соотношение Мрака и Света:');

            // Инициализация баланса
            gameState.darkness = Math.floor(Math.random() * 21) + 40;
            gameState.light = 100 - gameState.darkness;

            const darkCol = gameState.color_scheme === 'black_white' ? '#000000' : '#cc5de8';
            const lightCol = gameState.color_scheme === 'black_white' ? '#ffffff' : '#51cf66';
            const grayCol = '#868e96';

            const [darkTop, darkBottom] = forceBar5(gameState.darkness, darkCol, grayCol);
            const [lightTop, lightBottom] = forceBar5(gameState.light, lightCol, grayCol);

            const html = `
                <div class="dl-summary">
                    <div class="dl-row">
                        <div class="dl-label">Мрак:</div>
                        <div class="dl-bars">
                            <div>${darkTop}</div>
                            <div>${darkBottom}</div>
                        </div>
                        <div class="dl-value">${gameState.darkness}%</div>
                    </div>
                    <div class="dl-row">
                        <div class="dl-label">Свет:</div>
                        <div class="dl-bars">
                            <div>${lightTop}</div>
                            <div>${lightBottom}</div>
                        </div>
                        <div class="dl-value">${gameState.light}%</div>
                    </div>
                </div>
            `;
            printHTML(html);

            if (gameState.light > gameState.darkness) {
                await aiSay('Свет преобладает. Следующая партия будет благоприятной.');
            } else if (gameState.darkness > gameState.light) {
                await aiSay('Мрак преобладает. Следующая партия будет тяжёлой.');
            } else {
                await aiSay('Баланс нейтрален. Партия без преимуществ.');
            }
            return partyAssignment();
        }


        function countryName(code) {
            return code;
        }

        function createAvatar() {
            //cls();
            header(' РОЖДЕНИЕ АВАТАРА ');

            gameState.avatar_name = `#${gameState.rebirth_count + 1}`;
            gameState.visited_countries.add(gameState.country);
            gameState.visited_cities.add(gameState.city);
            gameState.visited_locations.add(gameState.location);
            gameState.alive = true;
            gameState.in_purgatory = false;
            gameState.age = 0;
            gameState.postLimitActions = 0;

            const oldAwareness = gameState.stats.awareness || 0;
            const oldViolations = gameState.stats.violations || 0;

            gameState.stats = {
                intellect: Math.floor(Math.random() * 11) + 5,
                morality: 0,
                emotions: Math.floor(Math.random() * 11) + 5,
                awareness: oldAwareness,
                violations: oldViolations
            };

            recalcMorality();
            gameState.start_stats = Object.assign({}, gameState.stats);

            const [family, year, country] = gameState.scenario;

            printSlow(`${familyDisplay(family)}, ${year}, ${countryName(country)}`, 30, 'color-cyan');
            printSlow(`Локация: (${gameState.settlement_type})`, 30, 'color-cyan');
            print(`Партия: #${gameState.party_count} | Аватар: ${gameState.avatar_name} | Возраст: ${formatAge(gameState.age)} | Смертей: ${gameState.death_count}`, 'color-cyan');
            print(`Осознанность: ${gameState.stats.awareness} | Нарушения: ${gameState.stats.violations}`, 'color-cyan');
            print('');

            // Спрайт света в конце туннеля
            showSprite('tunnel');
            setTimeout(() => hideSprite(), 2000);

            currentScene = 'main';
            inputArea.style.display = 'flex';
            commandInput.focus();
        }

        async function checkRandomDeath() {
            if (Math.random() < 0.01) { // 1% шанс
                gameState.alive = false;
                gameState.death_count += 1;
                gameState.in_purgatory = true;
                
                header(' НЕЛЕПАЯ СЛУЧАЙНОСТЬ ');
                print('Несчастный случай оборвал вашу жизнь. Иногда судьба просто не на вашей стороне.', 'color-red');
                print('');
                
                const newAch = checkAchievements();
                if (newAch.length) {
                    newAch.forEach(ach => print(`🏆 ${ach.name} — ${ach.desc}`, 'color-magenta color-bold'));
                }
                
                await sleep(2000);
                await purgatory();
                return true; // Игрок умер
            }
            return false; // Игрок выжил
        }

        async function explore() {
            if (!gameState.alive) {
                print('Ты мёртв. Нельзя исследовать.', 'color-red');
                await sleep(1000);
                return;
            }
        
            if (gameState.age >= 76.5) {
                return ageLimitDeath();
            }

            if (gameState.fatigueCount >= 2) {
                if (Math.random() < 0.5) {
                    print('Ваш аватар устал, поспите', 'color-red');
                    await sleep(1000);
                    return; // Прерываем исследование
                }
            }
        
            header(' ИССЛЕДОВАНИЕ ');
        
            const ageStage = getAgeStage(gameState.age);
        
            print(`Ты исследуешь местность: ${gameState.location}.`, 'color-gray');
            print(`Возраст: ${formatAge(gameState.age)} | Этап: ${ageStage.title}`, 'color-cyan');
            await sleep(300);
        
            const event = getEventForAge(gameState.age);
        
            print('', 'color-yellow color-bold');
            print(event.name, 'color-yellow color-bold');
            print(event.desc);
            print('');
        
            const choices = event.choices;
            const options = choices.map(choice => choice.text);
            const idx = await choiceInput('Что ты делаешь?', options);
        
            if (idx === null) return;
        
            const selected = choices[idx];
            await applyEffects(selected.effects);
            print('');
        
            const shouldRebirth = updateDarknessLightByAction(selected.effects);
        
            if (selected.effects.morality > 0) {
                print('Ты поступил по совести.', 'color-green');
            } else if (selected.effects.morality < 0) {
                print('Ты сделал тёмный выбор.', 'color-red');
            }
        
            const ageBefore = gameState.age;
            const ageStep = getAgeStep(gameState.age);
            
            // Убираем жесткий Math.min, чтобы возраст мог расти дальше 76.5
            if (gameState.age >= 76.5) {
                gameState.age += 0.5; // После предела каждый шаг дает полгода
            } else {
                gameState.age = Math.min(76.5, gameState.age + ageStep);
            }
            
            gameState.history.push(
                `Возраст ${formatAge(ageBefore)}–${formatAge(gameState.age)}: ${event.name} в ${gameState.location}`
            );
            
            gameState.fatigueCount++; // НОВОЕ: Увеличиваем усталость
            checkAgeMilestones(); 

            // ... (тут код проверки ачивок)
            showHUD();
            print('');
            const isRandomDead = await checkRandomDeath();
                if (isRandomDead) return;
            // Если перешагнули 76.5, проверяем на случайную смерть
            const isDead = await checkPostLimitDeath();
        
        if (isDead) return;
        
            // Этот блок оставлен на будущее, если захочешь сделать немедленное
            // перерождение при полном Свете или Мраке.
            if (shouldRebirth) {
                print('Баланс достиг критического предела.', 'color-violet');
            }
        }

        async function work() {
            if (!gameState.alive) {
                print('Ты мёртв. Нельзя работать.', 'color-red');
                await sleep(1000);
                return;
            }

            checkAgeMilestones();

            //cls();
            header(' РАБОТА ');

            print('Ты погружаешься в труд...', 'color-gray');
            await sleep(500);

            // Спрайт работы на 5 сек
            showSprite('street');
            setTimeout(() => hideSprite(), 5000);

            const gains = {
                intellect: Math.floor(Math.random() * 4),
                morality: Math.floor(Math.random() * 4) - 1,
                emotions: Math.floor(Math.random() * 3) - 2
            };

            await applyEffects(gains);
            const workAgeBefore = gameState.age;
            if (gameState.age >= 76.5) {
            gameState.age += 0.5; // После предела каждый шаг дает полгода
        } else {
            gameState.age = Math.min(76.5, gameState.age + ageStep);
        }
        
        gameState.history.push(
            `Возраст ${formatAge(ageBefore)}–${formatAge(gameState.age)}: ${event.name} в ${gameState.location}`
        );
        
        // ... (тут код проверки ачивок)
        showHUD();
        print('');

        const isRandomDead = await checkRandomDeath();
            if (isRandomDead) return;
        // Если перешагнули 76.5, проверяем на случайную смерть
        const isDead = await checkPostLimitDeath();
            if (isDead) return;
        }

        async function sleepFunc() {
            if (!gameState.alive) {
                print('Ты мёртв. Нельзя спать.', 'color-red');
                await sleep(1000);
                return;
            }
            gameState.fatigueCount = 0;

            //cls();
            header(' СОН ');

            print('Ты засыпаешь...', 'color-gray');
            await sleep(500);

            const dreams = [
                'Ты видишь себя извне.',
                'Ты падаешь в бесконечную пустоту.',
                'Голос зовёт тебя по имени, но не твоему.',
                'Мир вокруг тебя трескается, как стекло.'
            ];

            const dream = dreams[Math.floor(Math.random() * dreams.length)];
            print(dream, 'color-violet');

            gameState.stats.emotions = Math.min(15, gameState.stats.emotions + 1);
            const sleepAgeBefore = gameState.age;
            gameState.age = Math.min(76.5, gameState.age + getAgeStep(gameState.age));
            gameState.history.push(
                `Возраст ${formatAge(sleepAgeBefore)}–${formatAge(gameState.age)}: Сон`
            );
            
            const isDead = await checkPostLimitDeath();
            if (isDead) return;

            print('');
            print('Ты проснулся отдохнувшим.', 'color-green');

            // Обновляем соотношение мрака/света по действиям
            const sleepGains = { awareness: 1 };
            const shouldRebirthSleep = updateDarknessLightByAction(sleepGains);
            const isRandomDead = await checkRandomDeath();
                if (isRandomDead) return;
        }

        async function purgatory() {
            //cls();

            print('', 'color-violet color-bold');
            await printSlow('...Ты снова здесь.');
            await printSlow('Круглая платформа. Фиолетовое свечение внизу.');
            print('', 'color-reset');

            showSprite('purgatory');

            await aiSay('Партия завершена.');
            await aiSay('Анализирую результаты...');
            print('');
            await sleep(800);

            const diffIntellect = gameState.stats.intellect - gameState.start_stats.intellect;
            const diffMorality = gameState.stats.morality - gameState.start_stats.morality;
            const diffEmotions = gameState.stats.emotions - gameState.start_stats.emotions;

            print(`Изменения за партию:`, 'color-yellow');
            const signI = diffIntellect >= 0 ? '+' : '';
            const signM = diffMorality >= 0 ? '+' : '';
            const signE = diffEmotions >= 0 ? '+' : '';
            printHTML(`  Интеллект: <span style="color:${diffIntellect >= 0 ? '#51cf66' : '#ff6b6b'}">${signI}${diffIntellect}</span>`);
            printHTML(`  Мораль: <span style="color:${diffMorality >= 0 ? '#51cf66' : '#ff6b6b'}">${signM}${diffMorality}</span>`);
            printHTML(`  Эмоции: <span style="color:${diffEmotions >= 0 ? '#51cf66' : '#ff6b6b'}">${signE}${diffEmotions}</span>`);
            print('');

            // Сводка мрака и света
            printDarknessLightSummary();
            print('');

            // Обновление баланса
           const totalChange = diffIntellect + diffEmotions;
                if (totalChange > 0) {
                gameState.light = Math.min(100, gameState.light + Math.abs(totalChange));
                gameState.darkness = 100 - gameState.light;
                await aiSay('Свет усилился. Ты движешься вверх.');
            } else if (totalChange < 0) {
                gameState.darkness = Math.min(100, gameState.darkness + Math.abs(totalChange));
                gameState.light = 100 - gameState.darkness;
                await aiSay('Мрак сгустился. Ты опускаешься ниже.');
            } else {
                await aiSay('Баланс не изменился.');
            }
            print('');

            gameState.rebirth_count += 1;

            print('');
            const mode1 = await requestMode();
            if (mode1 === 'exit') return;            // кат-сцена выхода уже отыграла
            return partyAssignment();
            hideSprite();
                }
        
                // ==================== СЦЕНА: РЕЖИМ ЗАПРОСА ПЕРЕД ПАРТИЕЙ ====================
        // Возвращает: 'continue' (игрок хочет играть) | 'exit' (запущен выход) | 'auto' (форс-назначение)
        async function requestMode() {
            isBusy = true;
            gameState.consciousness_shown = false;
            let spamCount = 0;
            let result = null;

            await aiSay('Запускаем новую партию или вы хотите что то запросить?');
            print('');

            // Таймер: при авто-назначении завершаем режим с результатом 'auto'
            let autoFired = false;
            startPurgatoryTimer(() => {
                autoFired = true;
                aiSay('Время пребывания в Чистилище на исходе. Назначаю партию.');
            });

            while (result === null) {
                // если таймер форсировал назначение — выходим
                if (autoFired) { result = 'auto'; break; }

                const hint = 'Сделайте ИИ Корабля Земля запрос.';
                const ans = await exitModeInput(hint);

                if (autoFired || ans.type === 'abort') { result = 'auto'; break; }

                if (ans.type === 'continue') {
                    result = 'continue';
                    break;
                }

                // Печатаем реплику игрока с ИД сознания как автором (первый раз показываем ИД)
                if (!gameState.consciousness_shown) {
                    gameState.consciousness_shown = true;
                }
                print(`${gameState.consciousness_id}: ${ans.value}`, 'color-exit-input');

                const raw = ans.value;

                // 1) Запрос на выход?
                if (isExitRequest(raw)) {
                    spamCount = 0;
                    stopPurgatoryTimer();      // остановить обратный отсчёт на время подтверждения
                    await aiSay('Вы хотите покинуть иллюзорность?');
                    const confirmed = await exitConfirmInput();
                    if (confirmed) {
                        result = 'exit';
                        break;
                    } else {
                        await aiSay('Хорошо. Тогда продолжим. Задайте вопрос или начните новую партию.');
                        continue;
                    }
                }

                // 2) Спам (бессвязный набор)?
                if (isGibberish(raw)) {
                    spamCount++;
                    if (spamCount >= 3) {
                        await aiSay('В рамках соблюдения правил Чистилища, я выбираю партию за вас, возможно вы в шоковом состоянии и потому так реагируете.');
                        result = 'auto';
                        break;
                    } else {
                        await aiSay('Пожалуйста, успокойтесь, задайте мне вопрос или начните новую партию.');
                        continue;
                    }
                }

                // 3) Осмысленный, но непонятный запрос -> сброс спам-счётчика + стандартный ответ
                spamCount = 0;
                await aiSay('Извините, я вас не понимаю. Вы хотите продолжить игру или задать вопрос?');
            }

            stopPurgatoryTimer();
            inputHint.textContent = 'Введите help и узнаете команды';
            isBusy = false;

            if (result === 'exit') {
                await exitIllusionCutscene();
                return 'exit';
            }
            return result; // 'continue' | 'auto'
        }

        // ==================== КАТ-СЦЕНА ВЫХОДА ИЗ ИЛЛЮЗОРНОСТЕЙ ====================

        // Плавная пикселизация фона: цвет A -> цвет B за duration мс через overlay

        async function exitIllusionCutscene() {
            isBusy = true;
            stopPurgatoryTimer();

            // 3) Реплики запуска протокола выхода (ещё зелёным ИИ)
            await aiSay('Нахождение в иллюзорности — добровольный акт.');
            await aiSay('Нам очень жаль, что иллюзорности не смогли дать иллюзию счастья.');
            await aiSay('Ответ оператора получен. Запущен протокол выхода в реальность.');
            print('');
            await sleep(600);

            // 4) ASCII-круг перед сменой фона (построчно + красно-оранжевое мерцание)
            await renderAsciiCircle();
            await sleep(500);

            // Прячем верхний заголовок и спрайт, чтобы фон ушёл в чёрный целиком
            hideSprite();
            const titleEl = document.getElementById('game-title');
            if (titleEl) titleEl.style.transition = 'opacity 1s ease';
            if (titleEl) titleEl.style.opacity = '0';

            // Распылитель: точечно, как аэрограф в фотошопе, за 3 секунд по всему
            // экрану проступает тот же набор символов, что и в начальной кат-сцене
            // (цифры + латинские буквы), клетка = один символ.
            // РАСПЫЛИТЕЛЬ: канвас-сетка на весь экран (1 клетка = 1 символ).
            // Канвас поднят ПОВЕРХ всего интерфейса и точечно, как аэрограф в
            // фотошопе, за 5 секунд закрывает весь чат мерцающими буквами и
            // цифрами из начальной кат-сцены. Тёмная плашка под каждой клеткой
            // (sprayBgColor) реально ЗАМЕНЯЕТ содержимое чата, а не лежит поверх.
            const exitCanvas = document.getElementById('exit-noise-canvas');
            exitCanvas.style.display = 'block';
            exitCanvas.style.zIndex = '10050';   // выше текста, спрайта и заголовка
            const stopExitNoise = startMatrixNoise(exitCanvas, {
                transparentBg: true,     // фон рисуем сами — только под прогруженными клетками
                chars: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',  // тот же набор, что на интро
                dimColor: (a) => `rgba(255, 96, 40, ${a})`,
                brightColor: 'rgba(255, 190, 90, 0.95)',
                brightChance: 0.10,
                baseInterval: 70,
                sprayMs: 3000,                    // точечное распыление на весь экран за 5 сек
                sprayBgColor: '#0a0510'           // тёмная плашка-заливка под клетками (закрывает чат)
            });
            await sleep(3000 + 300);              // ждём, пока распылитель закроет весь экран (синхронно с sprayMs)

            // Экран полностью заменён сеткой символов. Чистим вывод игры под канвасом
            // (старый круг, реплики), уводим фон в чёрный и плавно гасим сетку —
            // прощание ИИ КЗ печатается уже на чистом чёрном экране.
            document.body.style.background = '#000000';
            cls();
            hideSprite();
            exitCanvas.style.transition = 'opacity 700ms ease';
            exitCanvas.style.opacity = '0';
            await sleep(720);
            stopExitNoise();
            exitCanvas.style.display = 'none';
            exitCanvas.style.opacity = '1';
            exitCanvas.style.transition = '';
            exitCanvas.style.zIndex = '';

            // 5) Прощание ИИ КЗ — светло-синим, ПОСЛЕ распылителя
            aiSayColor = 'color-lightblue';
            await aiSay('Поздравляем с окончанием игры.');
            print('');
            await sleep(400);

            // автосохранение
            try { saveGame(); } catch (e) {}
            await aiSay('Резервные копии партии сохранены.');
            print('');
            await sleep(400);
            await aiSay('До новых встреч. С любовью, Персонал Корабля Земля.');
            await sleep(1200);

            // 6) Финальный экран — матричный дождь (ИИ больше не появляется)
            inputArea.style.display = 'none';
            await startMatrixRain();
            isBusy = false;
        }

        // ==================== ФИНАЛЬНЫЙ ЭКРАН: МАТРИЧНЫЙ ШУМ ====================
        // Переключение на канвас во весь экран после прощания ИИ. Мерцание за
        // 30 секунд разгоняется до максимума, и только тогда проступает слово
        // ОШИБКА со спокойным медленным мерцанием (дыханием).
