# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Игровые сцены
"""

import random
import time
from config import Colors, VERSION
from data import LOCATIONS, ILLUSION_SCENARIOS, EVENTS_POOL
from state import GameState
from utils import print_slow, header, divider, ai_say, choice_input

def get_random_location_for_country(country):
    """Возвращает (город, адрес) для заданной страны."""
    cities = LOCATIONS[country]
    city = random.choice(list(cities.keys()))
    address = random.choice(cities[city])
    return city, address

def get_all_cities():
    """Возвращает список всех (страна, город) пар."""
    result = []
    for country, cities in LOCATIONS.items():
        for city in cities:
            result.append((country, city))
    return result

def registration_scene(state):
    print()
    print(f"{Colors.VIOLET}{Colors.BOLD}")
    print_slow("...Ты не открываешь глаза.")
    print_slow("У тебя их нет.")
    print_slow("Ты — чистое Сознание, только что извлечённое из потока.")
    print(f"{Colors.RESET}")
    print()
    time.sleep(0.3)

    print(f"{Colors.GRAY}Вы находитесь на круглой платформе с подсветкой границ.")
    print(f"Внизу платформы фиолетовое свечение и космос.")
    print(f"Перед собой вы видите сгусток светлых зелёных частиц.{Colors.RESET}")
    print()
    time.sleep(0.3)

    ai_say("Приветствую, сознание.")
    time.sleep(0.3)
    ai_say("Скоро начнётся ваша первая партия в одной из иллюзорностей Корабля Земля.")
    print()
    time.sleep(0.3)

    ai_say("Местом проведения первых партий для сознаний являются иллюзорности в пределах 4995–5005-й.")
    ai_say("Мы автоматически выберем для вас иллюзорность в этом диапазоне.")
    print()
    time.sleep(0.3)

    ai_say("Перед каждой новой партией у вас будет стираться память.")
    print()
    time.sleep(0.3)

    ai_say("Но Сознание остаётся. Оно накапливает опыт, даже если не помнит.")
    ai_say("Каждое перерождение — новая маска. Но маска носит следы.")
    print()
    time.sleep(0.3)

    # Присвоение ID по документации v0.2.1
    # 50/50 шанс: обычное сознание или инженер
    base_id = random.randint(1, 9999)
    if random.random() < 0.5:
        # Обычное сознание
        state.consciousness_id = f"Сознание#{base_id}"
        state.is_engineer = False
        ai_say(f"Вам присвоен идентификатор: {state.consciousness_id}.")
        ai_say("Вы — простое сознание с характеристиками как у всех остальных.")
    else:
        # Инженер
        engineer_num = random.randint(1, 500)
        state.consciousness_id = f"Сознание#{base_id}_И#{engineer_num}"
        state.is_engineer = True
        ai_say(f"Вам присвоен идентификатор: {state.consciousness_id}.")
        ai_say("Вы — инженер, состоите в Персонале Корабля Земля.")
    print()
    time.sleep(0.3)

    ai_say("Приготовьтесь к погружению.")
    print()

    input(f"{Colors.GRAY}[Нажми Enter для назначения партии...]{Colors.RESET}")
    return party_assignment(state)

def party_assignment(state):
    header(" НАЗНАЧЕНИЕ ПАРТИИ ")

    ai_say("Анализирую доступные иллюзорности в диапазоне 4995–5005...")
    print()
    time.sleep(0.8)

    state.party_number = random.randint(4995, 5005)
    scenario = random.choice(ILLUSION_SCENARIOS)
    state.scenario = scenario
    family, year, country = scenario

    # СИНХРОНИЗАЦИЯ: город и адрес из той же страны
    state.country = country
    state.city, state.location = get_random_location_for_country(country)

    ai_say(f"Назначена иллюзорность #{state.party_number}.")
    ai_say(f"Вы начнёте партию в {family}, {year} год, {country}.")
    ai_say(f"Город: {state.city}. Адрес: {state.location}.")
    print()
    time.sleep(0.3)

    ai_say("Погружение через 5 секунд. Память о регистрации будет стёрта.")
    ai_say("Сознание сохранит следы.")
    print()

    for i in range(5, 0, -1):
        print(f"{Colors.RED}{Colors.BOLD}  {i}...{Colors.RESET}")
        time.sleep(1)

    print()
    print(f"{Colors.GRAY}Платформа под вами гаснет.")
    print(f"Зелёные частицы рассеиваются.")
    print(f"Вы падаете...{Colors.RESET}")
    print()
    time.sleep(0.5)

    return state

def create_avatar(state):
    header(" РОЖДЕНИЕ АВАТАРА ")

    avatar_name = f"Аватар #{state.rebirth_count + 1}"
    state.avatar_name = avatar_name
    state.visited_countries.add(state.country)
    state.visited_cities.add(state.city)
    state.visited_locations.add(state.location)
    state.alive = True
    state.in_purgatory = False
    state.age = 0

    old_awareness = state.stats.get("awareness", 0)
    old_violations = state.stats.get("violations", 0)
    state.stats = {
        "intellect": random.randint(5, 15),
        "morality": random.randint(5, 15),
        "emotions": random.randint(5, 15),
        "awareness": old_awareness,
        "violations": old_violations,
    }

    family, year, country = state.scenario
    print(f"{Colors.GRAY}Ты открываешь глаза...{Colors.RESET}")
    print()
    print_slow(f"{Colors.CYAN}Иллюзорность: #{state.party_number}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Старт: {family}, {year}, {country}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Страна: {state.country}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Город: {state.city}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Адрес: {state.location}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Аватар: {avatar_name}{Colors.RESET}")
    print()
    print(f"{Colors.GRAY}Память о регистрации стёрта. Остаётся только ощущение — ты здесь не впервые.{Colors.RESET}")
    print()
    time.sleep(0.3)
    return state

def show_profile(state):
    header(f" ПРОФИЛЬ: {state.consciousness_id} ")
    family, year, country = state.scenario
    print(f"  {Colors.CYAN}ID:{Colors.RESET}         {state.consciousness_id}")
    print(f"  {Colors.CYAN}Аватар:{Colors.RESET}      {state.avatar_name}")
    print(f"  {Colors.CYAN}Партия:{Colors.RESET}      #{state.party_number}")
    print(f"  {Colors.CYAN}Старт:{Colors.RESET}       {family}, {year}, {country}")
    print(f"  {Colors.CYAN}Страна:{Colors.RESET}      {state.country}")
    print(f"  {Colors.CYAN}Город:{Colors.RESET}       {state.city}")
    print(f"  {Colors.CYAN}Адрес:{Colors.RESET}       {state.location}")
    print(f"  {Colors.CYAN}Возраст:{Colors.RESET}     {state.age} циклов")
    print(f"  {Colors.CYAN}Перерождения:{Colors.RESET} {state.rebirth_count}")
    print(f"  {Colors.CYAN}Смертей:{Colors.RESET}     {state.death_count}")
    divider()
    print(f"  {Colors.YELLOW}Интеллект:{Colors.RESET}   {state.stats['intellect']}")
    print(f"  {Colors.YELLOW}Мораль:{Colors.RESET}      {state.stats['morality']}")
    print(f"  {Colors.YELLOW}Эмоции:{Colors.RESET}      {state.stats['emotions']}")
    print(f"  {Colors.YELLOW}Осознанность:{Colors.RESET} {state.stats['awareness']}")
    print(f"  {Colors.RED}Нарушения:{Colors.RESET}   {state.stats['violations']}{Colors.RESET}")
    divider()
    print(f"  {Colors.GRAY}Стран посещено: {len(state.visited_countries)}/{len(LOCATIONS)}{Colors.RESET}")
    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")

def show_stats(state):
    header(" СТАТИСТИКА ")
    s = state.stats
    # По документации v0.2.1: шкала 5 делений (не 20)
    max_bar = 5
    def bar(val, color):
        filled = min(max_bar, max(0, val // 4))  # примерно: 0-3=0, 4-7=1, 8-11=2, 12-15=3, 16-19=4, 20+=5
        empty = max_bar - filled
        return f"{color}{'█'*filled}{Colors.GRAY}{'░'*empty}{Colors.RESET} {val}"

    print(f"  Интеллект:   {bar(s['intellect'], Colors.BLUE)}")
    print(f"  Мораль:      {bar(s['morality'], Colors.GREEN)}")
    print(f"  Эмоции:      {bar(s['emotions'], Colors.YELLOW)}")
    print(f"  Осознанность:{bar(s['awareness'], Colors.MAGENTA)}")
    print(f"  Нарушения:   {bar(s['violations'], Colors.RED)}")
    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")

def show_inventory(state):
    header(" ИНВЕНТАРЬ ")
    if not state.inventory:
        print(f"{Colors.GRAY}  (пусто){Colors.RESET}")
    else:
        for item in state.inventory:
            print(f"  • {item}")
    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")

def explore(state):
    header(" ИССЛЕДОВАНИЕ ")
    print_slow(f"{Colors.GRAY}Ты бродишь по {state.location}...{Colors.RESET}")
    time.sleep(0.3)

    event = random.choice(EVENTS_POOL)
    print()
    print(f"{Colors.YELLOW}{Colors.BOLD}⚡ {event['name']}{Colors.RESET}")
    print(f"{Colors.WHITE}{event['desc']}{Colors.RESET}")

    if event.get("choice"):
        idx = choice_input("Что выберешь?", ["Принять", "Отказаться"])
        if idx is None:
            return state
        if idx == 0:
            apply_effects(state, event["effects"])
            print(f"{Colors.GREEN}Ты принял вызов.{Colors.RESET}")
        else:
            print(f"{Colors.GRAY}Ты отвернулся.{Colors.RESET}")
    else:
        apply_effects(state, event["effects"])

    if random.random() < 0.3:
        items = ["Осколок Памяти", "Кристалл Иллюзии", "Пепел Мира", "Эхо Голоса", "Нить Судьбы"]
        item = random.choice(items)
        state.inventory.append(item)
        print(f"{Colors.GREEN}📦 Найдено: {item}{Colors.RESET}")

    state.age += 1
    state.history.append(f"Цикл {state.age}: {event['name']} в {state.location}")

    new_ach = state.check_achievements()
    if new_ach:
        print()
        for ach in new_ach:
            print(f"{Colors.MAGENTA}{Colors.BOLD}🏆 Скрытое достижение: {ach['name']} — {ach['desc']}{Colors.RESET}")

    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")
    return state

def apply_effects(state, effects):
    for stat, delta in effects.items():
        state.stats[stat] = max(0, state.stats[stat] + delta)
        color = Colors.GREEN if delta > 0 else Colors.RED if delta < 0 else Colors.GRAY
        sign = "+" if delta > 0 else ""
        print(f"  {color}{stat.capitalize()}: {sign}{delta}{Colors.RESET}")

def travel(state):
    # По документации v0.2.1: travel пока не работает
    header(" ПУТЕШЕСТВИЕ ")
    print(f"{Colors.RED}Извините, данная функция временно недоступна.{Colors.RESET}")
    print(f"{Colors.GRAY}В разработке: система перемещения между адресами, городами и странами.{Colors.RESET}")
    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")
    return state

def work(state):
    header(" РАБОТА ")
    print_slow(f"{Colors.GRAY}Ты погружаешься в труд...{Colors.RESET}")

    gains = {
        "intellect": random.randint(0, 3),
        "morality": random.randint(-1, 2),
        "emotions": random.randint(-2, 1),
    }
    apply_effects(state, gains)
    state.age += 1
    state.history.append(f"Цикл {state.age}: Работа в {state.location}")

    print()
    print(f"{Colors.GREEN}Труд завершён.{Colors.RESET}")
    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")
    return state

def sleep(state):
    header(" СОН ")
    print_slow(f"{Colors.GRAY}Ты засыпаешь...{Colors.RESET}")
    time.sleep(0.5)

    dream = random.choice([
        "Ты видишь себя извне.",
        "Ты падаешь в бесконечную пустоту.",
        "Голос зовёт тебя по имени, но не твоему.",
        "Мир вокруг тебя трескается, как стекло.",
        "Ты стоишь перед зеркалом. В нём никого.",
        "Спокойствие. Ничего.",
    ])
    print()
    print(f"{Colors.MAGENTA}💭 {dream}{Colors.RESET}")

    if "Осколок Памяти" in state.inventory:
        state.stats["awareness"] += 2
        print(f"{Colors.GREEN}Осколок Памяти светится во сне. Осознанность +2{Colors.RESET}")

    state.stats["emotions"] = min(20, state.stats["emotions"] + 2)
    state.age += 1
    state.history.append(f"Цикл {state.age}: Сон в {state.location}")

    print()
    input(f"{Colors.GRAY}[Enter для пробуждения]{Colors.RESET}")
    return state

def die(state):
    header(" СМЕРТЬ ")
    print_slow(f"{Colors.RED}{Colors.BOLD}Твоё воплощение угасает...{Colors.RESET}")
    print()
    print_slow(f"{Colors.GRAY}Плоть рассыпается. Мир исчезает.{Colors.RESET}")
    print_slow(f"{Colors.GRAY}Остаётся только Сознание.{Colors.RESET}")
    print()

    state.alive = False
    state.death_count += 1
    state.in_purgatory = True
    state.history.append(f"Смерть аватара #{state.rebirth_count + 1} в {state.location}")

    new_ach = state.check_achievements()
    if new_ach:
        for ach in new_ach:
            print(f"{Colors.MAGENTA}{Colors.BOLD}🏆 Скрытое достижение: {ach['name']}{Colors.RESET}")

    print()
    input(f"{Colors.GRAY}[Enter для перехода в Чистилище]{Colors.RESET}")
    return purgatory(state)

def purgatory(state):
    header(" ЧИСТИЛИЩЕ ")
    print_slow(f"{Colors.GRAY}Белая пустота. Нет времени. Нет пространства.{Colors.RESET}")
    print_slow(f"{Colors.GRAY}Ты — лишь искра, плывущая в вечности.{Colors.RESET}")
    print()

    s = state.stats
    score = s["intellect"] + s["morality"] * 2 + s["awareness"] * 3 - s["violations"] * 2

    print(f"{Colors.CYAN}КЗ анализирует твою жизнь...{Colors.RESET}")
    print()
    time.sleep(0.5)

    print(f"  Интеллект:    {s['intellect']}")
    print(f"  Мораль:       {s['morality']}")
    print(f"  Осознанность: {s['awareness']}")
    print(f"  Нарушения:    {s['violations']}")
    print(f"  {Colors.YELLOW}Итоговый балл: {score}{Colors.RESET}")
    print()

    if score >= 80:
        verdict = "Возвышение"
        desc = "Твоё Сознание достаточно чисто. Ты можешь выбрать: остаться или переродиться ещё выше."
    elif score >= 40:
        verdict = "Перерождение"
        desc = "Средний путь. Новое воплощение, новый шанс."
    else:
        verdict = "Падение"
        desc = "Сознание загрязнено. Ты уйдёшь глубже в Иллюзорность."

    state.kz_verdict = verdict
    print(f"{Colors.MAGENTA}{Colors.BOLD}Вердикт КЗ: {verdict}{Colors.RESET}")
    print(f"{Colors.WHITE}{desc}{Colors.RESET}")
    print()

    input(f"{Colors.GRAY}[Enter для принятия вердикта]{Colors.RESET}")
    return rebirth(state)

def rebirth(state):
    header(" ПЕРЕРОЖДЕНИЕ ")
    state.rebirth_count += 1
    state.in_purgatory = False

    print_slow(f"{Colors.CYAN}Сознание {state.consciousness_id} возвращается на Корабль Земля...{Colors.RESET}")
    print()
    time.sleep(0.3)

    print(f"{Colors.GRAY}Вы снова на круглой платформе.")
    print(f"Зелёные частицы собираются перед вами.{Colors.RESET}")
    print()
    time.sleep(0.3)

    ai_say("Добро пожаловать обратно, сознание.")
    ai_say("Предыдущая партия завершена. Память стёрта.")
    print()
    time.sleep(0.3)

    if state.kz_verdict == "Возвышение":
        state.stats["awareness"] += 5
        ai_say("Ваше Сознание продемонстрировало высокую чистоту. Бонус Возвышения применён.")
    elif state.kz_verdict == "Падение":
        state.stats["violations"] += 3
        ai_say("Ваше Сознание загрязнено. Проклятие Падения применено.")
    else:
        ai_say("Нейтральный вердикт. Продолжаем стандартный протокол.")
    print()
    time.sleep(0.3)

    ai_say("Анализирую доступные иллюзорности в диапазоне 4995–5005...")
    print()
    time.sleep(0.8)

    state.party_number = random.randint(4995, 5005)
    scenario = random.choice(ILLUSION_SCENARIOS)
    state.scenario = scenario
    family, year, country = scenario

    # СИНХРОНИЗАЦИЯ при перерождении
    state.country = country
    state.city, state.location = get_random_location_for_country(country)

    ai_say(f"Назначена иллюзорность #{state.party_number}.")
    ai_say(f"Вы начнёте партию в {family}, {year} год, {country}.")
    ai_say(f"Город: {state.city}. Адрес: {state.location}.")
    print()
    time.sleep(0.3)

    ai_say("Погружение через 5 секунд. Память о предыдущей партии будет стёрта.")
    print()

    for i in range(5, 0, -1):
        print(f"{Colors.RED}{Colors.BOLD}  {i}...{Colors.RESET}")
        time.sleep(1)

    print()
    print(f"{Colors.GRAY}Платформа гаснет.")
    print(f"Частицы рассеиваются.")
    print(f"Падение...{Colors.RESET}")
    print()
    time.sleep(0.5)

    return create_avatar(state)

def show_achievements(state):
    header(" СКРЫТЫЕ ДОСТИЖЕНИЯ ")
    for key, ach in state.hidden_achievements.items():
        status = f"{Colors.GREEN}[✓]{Colors.RESET}" if ach["unlocked"] else f"{Colors.GRAY}[ ]{Colors.RESET}"
        name_color = Colors.YELLOW if ach["unlocked"] else Colors.GRAY
        print(f"  {status} {name_color}{ach['name']}{Colors.RESET}: {ach['desc']}")
    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")

def show_help():
    header(" КОМАНДЫ ")
    cmds = [
        ("help", "Эта справка"),
        ("profile", "Профиль Сознания и Аватара"),
        ("stats", "Характеристики в виде шкал"),
        ("explore", "Исследовать мир (случайные события)"),
        ("travel", "Путешествовать между адресами/городами/странами [В РАЗРАБОТКЕ]"),
        ("work", "Работать (статы + предметы)"),
        ("sleep", "Спать (восстановление + сны)"),
        ("inventory", "Показать инвентарь"),
        ("achievements", "Скрытые достижения"),
        ("die", "Умереть и перейти в Чистилище"),
        ("rebirth", "Переродиться (если в Чистилище)"),
        ("save", "Сохранить игру"),
        ("quit", "Выйти"),
    ]
    for cmd, desc in cmds:
        print(f"  {Colors.CYAN}{cmd:12}{Colors.RESET} — {desc}")
    print()
    input(f"{Colors.GRAY}[Enter для продолжения]{Colors.RESET}")
