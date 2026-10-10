# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Игровые сцены
"""

import random
import time

from config import Colors, VERSION, COLOR_SCHEMES
from data import LOCATIONS, ILLUSION_SCENARIOS, EVENTS_POOL, PROFESSIONS, SETTLEMENT_TYPES
from state import GameState
from utils import print_slow, header, divider, ai_say, choice_input, wrap_text, wait_enter, force_bar_5, family_display, direction_display

def choose_color_scheme():
    """Позволяет игроку выбрать цветовую схему для баланса Мрака/Света."""
    print(f"{Colors.CYAN} ИИ Корабля Земля: Выберите визуальный стиль отображения баланса.{Colors.RESET}")
    print()
    
    print(f"  {Colors.MAGENTA}1. Классический{Colors.RESET}")
    print(f"     Мрак: {Colors.MAGENTA}■■■{Colors.GRAY}░░░{Colors.RESET} (Фиолетовый)")
    print(f"     Свет: {Colors.GREEN}■■■{Colors.GRAY}░░░{Colors.RESET} (Зелёный)")
    print()
    
    print(f"  {Colors.BLACK}{Colors.BOLD}2. Монохромный{Colors.RESET}")
    print(f"     Мрак: {Colors.BLACK}{Colors.BOLD}■■■{Colors.GRAY}░░░{Colors.RESET} (Чёрный)")
    print(f"     Свет: {Colors.WHITE}{Colors.BOLD}■■■{Colors.GRAY}░░░{Colors.RESET} (Белый)")
    print(f"     {Colors.YELLOW}⚠ ВНИМАНИЕ: Для 2 режима необходимо установить НЕ-черный фон консоли, иначе шкала Мрака будет пустой!{Colors.RESET}")
    print()
    
    choice = input(f"{Colors.GREEN}> Введите номер варианта (1 или 2): {Colors.RESET}").strip()
    
    if choice == "2":
        confirm = input(f"{Colors.YELLOW}Вы уверены, что установили светлый фон? (да/нет): {Colors.RESET}").strip().lower()
        if confirm in ["да", "yes", "y", "д"]:
            print(f"{Colors.GREEN}✓ Выбран монохромный стиль.{Colors.RESET}")
            return "black_white"
        else:
            print(f"{Colors.GREEN}✓ Выбран классический стиль.{Colors.RESET}")
            return "purple_green"
    else:
        print(f"{Colors.GREEN}✓ Выбран классический стиль.{Colors.RESET}")
        return "purple_green"

def get_balance_colors(state):
    """Возвращает кортеж цветов (dark_color, light_color) в зависимости от схемы."""
    if state.color_scheme == "black_white":
        scheme = COLOR_SCHEMES["black_white"]
        return scheme["darkness"], scheme["light"]
    else:
        return Colors.MAGENTA, Colors.GREEN

def get_random_location_for_country(country):
    """Возвращает (город, адрес) для заданной страны."""
    cities = LOCATIONS[country]
    city = random.choice(list(cities.keys()))
    address = random.choice(cities[city])
    return city, address

def build_family_string(base_profession):
    """Строит 'семье X и Y' — две разные профессии (обе в родительном падеже)."""
    second = random.choice([p for p in PROFESSIONS if p != base_profession])
    return f"семье {base_profession} и {second}"

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
    print_slow("Ты — чистое Сознание, только что погруженное в Корабль Земля.")
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
    ai_say("Цель Корабля Земля - предоставить вам полный спектр ощущений, обеспечить вас максимальной удовлетворенностью от игры")
    print()
    time.sleep(0.3)

    ai_say("Местом проведения первых партий для сознаний являются иллюзорности в пределах 4995–5005-й.")
    ai_say("Мы автоматически выберем для вас иллюзорность в этом диапазоне.")
    print()
    time.sleep(0.3)

    ai_say("Перед каждой новой партией у вас будет стираться память о прошлой партии и о нахождении в Чистилище. Таким образом, информация, способная нарушить игровой опыт, будет автоматически забыта.")
    print()
    time.sleep(0.3)

    ai_say("Но Сознание остаётся. Оно накапливает опыт, даже если не помнит.")
    ai_say("Каждое перерождение — новый опыт, идущий с вами сквозь партии и обогащаемый ими.")
    print()
    time.sleep(0.3)

    base_id = random.randint(1, 9999)
    if random.random() < 0.01:
        state.consciousness_id = f"Сознание#{base_id}"
        state.is_engineer = False
        ai_say("Перед запуском первой партии вас необходимо зарегистрировать в базе данных сознаний.")
        ai_say("Запускаю процесс регистрации...")
        ai_say(f"Вам присвоен идентификатор: {state.consciousness_id}.")
        ai_say("Вы — простое сознание с характеристиками как у всех остальных.")
    else:
        engineer_num = random.randint(1, 500)
        state.consciousness_id = f"Сознание#{base_id}_И#{engineer_num}"
        state.is_engineer = True
        ai_say("Перед запуском первой партии вас необходимо зарегистрировать в базе данных сознаний.")
        ai_say("Запускаю процесс регистрации...")
        ai_say(f"Вам присвоен идентификатор: {state.consciousness_id}.")
        ai_say("Вы — инженер, состоите в Персонале Корабля Земля.")
    print()
    time.sleep(0.3)

    ai_say("Приготовьтесь к погружению.")
    print()
    time.sleep(0.3)

    ai_say("Ваше соотношение Мрака и Света:")

    dark_col, light_col = get_balance_colors(state)

    dark_top, dark_bottom = force_bar_5(state.darkness, dark_col, Colors.GRAY)
    light_top, light_bottom = force_bar_5(state.light, light_col, Colors.GRAY)
    print(f"  Мрак: {dark_top} {state.darkness}%")
    print(f"        {dark_bottom}")
    print(f"  Свет: {light_top} {state.light}%")
    print(f"        {light_bottom}")
    print()
    if state.get_dominant_force() == "light":
        ai_say("Свет преобладает. Следующая партия будет благоприятной.")
    elif state.get_dominant_force() == "darkness":
        ai_say("Мрак преобладает. Следующая партия будет тяжёлой.")
    else:
        ai_say("Баланс нейтрален. Партия без преимуществ.")
    print()
    time.sleep(0.3)

    wait_enter(f"{Colors.GRAY}[Нажми Enter для назначения партии...]{Colors.RESET}")
    return party_assignment(state)

def party_assignment(state):
    header(" НАЗНАЧЕНИЕ ПАРТИИ ")

    ai_say("Анализирую доступные иллюзорности в диапазоне 4995–5005...")
    print()
    time.sleep(0.8)

    state.party_number = random.randint(4995, 5005)
    state.party_count = state.rebirth_count + 1
    profession, year, country = random.choice(ILLUSION_SCENARIOS)
    family = build_family_string(profession)
    state.scenario = (family, year, country)

    # СИНХРОНИЗАЦИЯ: город и адрес из той же страны
    state.country = country
    state.city, state.location = get_random_location_for_country(country)
    state.settlement_type = random.choice(SETTLEMENT_TYPES)

    # Направление партии на основе баланса
    dominant = state.get_dominant_force()
    if dominant == "light":
        state.party_direction = "ascend"
        state.illusion_level = max(1, state.illusion_level - random.randint(500, 1500))
    elif dominant == "darkness":
        state.party_direction = "descend"
        state.illusion_level = min(10000, state.illusion_level + random.randint(500, 1500))
    else:
        state.party_direction = "neutral"
        state.illusion_level += random.randint(-200, 200)
        state.illusion_level = max(1, min(10000, state.illusion_level))

    ai_say(f"Назначена иллюзорность #{state.party_number}.")
    ai_say(f"Партия #{state.party_count}.")
    ai_say(f"Вектор партии: {direction_display(state.party_direction)}.")
    ai_say(f"Вы начнёте партию в {family}, {year} год, {country}, {state.settlement_type}.")
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
    avatar_name = f"#{state.rebirth_count + 1}"
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
    
    # ЗАПОМИНАЕМ СТАРТОВЫЕ ЗНАЧЕНИЯ ДЛЯ ЭТОЙ ПАРТИИ
    state.start_stats = dict(state.stats)
    
    family, year, country = state.scenario
    
    print(f"{Colors.GRAY}Ты открываешь глаза...{Colors.RESET}")
    print()
    
    # Оставляем только ключевую информацию для атмосферы старта
    # Детали (адрес, точный возраст, ID аватара) теперь видны в HUD ниже
    print_slow(f"{Colors.CYAN}Иллюзорность: #{state.party_number}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Партия: #{state.party_count}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Старт: {family_display(family)}, {year}, {country}{Colors.RESET}")
    print_slow(f"{Colors.CYAN}Локация: ({state.settlement_type}){Colors.RESET}")
    
    print()
    time.sleep(0.3)
    return state

def show_profile(state):
    header(" ПРОФИЛЬ ")
    family, year, country = state.scenario
    # Выравнивание по одной вертикальной линии — метки 14 символов
    print(f"  {Colors.CYAN}{'ID:': <14}{Colors.RESET} {state.consciousness_id}")
    print(f"  {Colors.CYAN}{'Аватар:': <14}{Colors.RESET} {state.avatar_name}")
    print(f"  {Colors.CYAN}{'Партия:': <14}{Colors.RESET} #{state.party_count}")
    print(f"  {Colors.CYAN}{'Иллюзорность:': <14}{Colors.RESET} #{state.party_number}")
    print(f"  {Colors.CYAN}{'Старт:': <14}{Colors.RESET} {family_display(family)}, {year}, {country}")
    print(f"  {Colors.CYAN}{'Локация:': <14}{Colors.RESET} {state.city} ({state.settlement_type})")
    print(f"  {Colors.CYAN}{'Адрес:': <14}{Colors.RESET} {state.location}")
    print(f"  {Colors.CYAN}{'Возраст:': <14}{Colors.RESET} {state.age} циклов")
    print(f"  {Colors.CYAN}{'Перерождения:': <14}{Colors.RESET} {state.rebirth_count}")
    print(f"  {Colors.CYAN}{'Смертей:': <14}{Colors.RESET} {state.death_count}")
    divider()
    def bar(val, color, length=15):
        filled = min(length, max(0, (val * 3) // 4))
        empty = length - filled
        return f"{color}{'█'*filled}{Colors.GRAY}{'░'*empty}{Colors.RESET} {val}"
    print(f"  {Colors.YELLOW}{'Интеллект:': <14}{Colors.RESET} {bar(state.stats['intellect'], Colors.BLUE)}")
    print(f"  {Colors.YELLOW}{'Мораль:': <14}{Colors.RESET} {bar(state.stats['morality'], Colors.GREEN)}")
    print(f"  {Colors.YELLOW}{'Эмоции:': <14}{Colors.RESET} {bar(state.stats['emotions'], Colors.YELLOW)}")
    print(f"  {Colors.YELLOW}{'Осознанность:': <14}{Colors.RESET} {bar(state.stats['awareness'], Colors.MAGENTA)}")
    print(f"  {Colors.RED}{'Нарушения:': <14}{Colors.RESET} {bar(state.stats['violations'], Colors.RED)}")
    divider()
    print(f"  {Colors.GRAY}{'Вектор:': <14}{Colors.RESET} {direction_display(state.party_direction)}")
    divider()
    print(f"  {Colors.GRAY}Стран: {len(state.visited_countries)}/{len(LOCATIONS)}{Colors.RESET}")
    print()

def show_stats(state):
    header(" СТАТИСТИКА ")
    s = state.stats
    # По документации v0.2.1: шкала 5 делений (не 20)
    max_bar = 5
    def bar(val, color, length=15):
        filled = min(length, max(0, val // 4))
        empty = length=15 - filled
        return f"{color}{'█'*filled}{Colors.GRAY}{'░'*empty}{Colors.RESET} {val}"
    print(f"  Интеллект:   {bar(s['intellect'], Colors.BLUE)}")
    print(f"  Мораль:      {bar(s['morality'], Colors.GREEN)}")
    print(f"  Эмоции:      {bar(s['emotions'], Colors.YELLOW)}")
    print(f"  Осознанность:{bar(s['awareness'], Colors.MAGENTA)}")
    print(f"  Нарушения:   {bar(s['violations'], Colors.RED)}")
    divider()
    print(f"  Вектор:      {direction_display(state.party_direction)}")
    print()

def show_inventory(state):
    header(" ИНВЕНТАРЬ ")
    if not state.inventory:
        print(f"{Colors.GRAY}  (пусто){Colors.RESET}")
    else:
        for item in state.inventory:
            print(f"  • {item}")
    print()

def explore(state):
    header(" ИССЛЕДОВАНИЕ ")
    print(f"{Colors.GRAY}Ты бродишь по {state.location}...{Colors.RESET}")
    time.sleep(0.3)

    event = random.choice(EVENTS_POOL)
    print()
    print(f"{Colors.YELLOW}{Colors.BOLD}⚡ {event['name']}{Colors.RESET}")
    print(wrap_text(f"{Colors.WHITE}{event['desc']}{Colors.RESET}"))
    print()

    # Выбор действия
    choices = event["choices"]
    options = [c["text"] for c in choices]
    idx = choice_input("Что ты делаешь?", options)
    if idx is None:
        return state

    selected = choices[idx]
    apply_effects(state, selected["effects"])

    # Комментарий на основе выбора
    effects = selected["effects"]
    if "morality" in effects:
        if effects["morality"] > 0:
            print(f"{Colors.GREEN}Ты поступил по совести.{Colors.RESET}")
        elif effects["morality"] < 0:
            print(f"{Colors.RED}Ты сделал тёмный выбор.{Colors.RESET}")

    # Находка предмета (30% шанс)
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
    return state

def work(state):
    header(" РАБОТА ")
    print(f"{Colors.GRAY}Ты погружаешься в труд...{Colors.RESET}")

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
    return state

def sleep(state):
    header(" СОН ")
    print(f"{Colors.GRAY}Ты засыпаешь...{Colors.RESET}")
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
    return state

def die(state):
    header(" СМЕРТЬ ")
    print(f"{Colors.RED}{Colors.BOLD}Твоё воплощение угасает...{Colors.RESET}")
    print()
    print(f"{Colors.GRAY}Плоть рассыпается. Мир исчезает.{Colors.RESET}")
    print(f"{Colors.GRAY}Остаётся только Сознание.{Colors.RESET}")
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
    return purgatory(state)

def purgatory(state):
    header(" ЧИСТИЛИЩЕ ")
    print(f"{Colors.GRAY}Белая пустота. Нет времени. Нет пространства.{Colors.RESET}")
    print(f"{Colors.GRAY}Ты — лишь искра, плывущая в вечности.{Colors.RESET}")
    print()
    ai_say("Добро пожаловать обратно, сознание.")
    ai_say("Предыдущая партия завершена, идёт обработка данных о вашей партии. Память о ней в новой партии будет стёрта.")
    print()
    time.sleep(0.3)
    print(f"{Colors.CYAN}КЗ анализирует твою жизнь...{Colors.RESET}")
    print()
    time.sleep(0.5)
    
    # Анализируем ИЗМЕНЕНИЯ статов за партию
    s = state.stats
    start = state.start_stats
    
    # Считаем дельту (насколько статы выросли/упали относительно старта)
    morality_delta = s["morality"] - start["morality"]
    violations_delta = s["violations"] - start["violations"]
    awareness_delta = s["awareness"] - start["awareness"]
    
    # Рассчитываем изменение баланса только на основе РЕАЛЬНЫХ изменений
    # Если morality не менялась, delta будет 0 -> света 0
    light_gained = max(0, morality_delta + awareness_delta // 2)
    darkness_gained = max(0, violations_delta * 2 - awareness_delta // 3)
    
    # Применяем сдвиг
    state.shift_balance(darkness_gained, light_gained)
    
    dark_col, light_col = get_balance_colors(state)
    
    ai_say(f"Свет и Мрак получено соответственно: +{light_gained}% и +{darkness_gained}%")
    print(f"  {Colors.YELLOW}Новое соотношение:{Colors.RESET}")
    dark_top, dark_bottom = force_bar_5(state.darkness, dark_col, Colors.GRAY)
    light_top, light_bottom = force_bar_5(state.light, light_col, Colors.GRAY)
    print(f"  Мрак: {dark_top} {state.darkness}%")
    print(f"        {dark_bottom}")
    print(f"  Свет: {light_top} {state.light}%")
    print(f"        {light_bottom}")
    print()
    
    # Определяем следующую партию на основе итогового баланса
    dominant = state.get_dominant_force()
    if dominant == "light":
        state.party_direction = "ascend"
        verdict_line = "Следующая партия будет в иллюзорности выше прежней."
        state.illusion_level = max(1, state.illusion_level - random.randint(500, 1500))
    elif dominant == "darkness":
        state.party_direction = "descend"
        verdict_line = "Следующая партия будет в иллюзорности ниже прежней."
        state.illusion_level = min(10000, state.illusion_level + random.randint(500, 1500))
    else:
        state.party_direction = "neutral"
        verdict_line = "Следующая партия будет в этой же иллюзорности."
        state.illusion_level += random.randint(-200, 200)
        state.illusion_level = max(1, min(10000, state.illusion_level))
        
    verdict = direction_display(state.party_direction)
    state.kz_verdict = verdict
    
    ai_say(f"На основе прежней партии вам выдан Вердикт КЗ: {verdict}. {verdict_line}")
    print()
    time.sleep(0.3)
    return rebirth(state)

def rebirth(state):
    header(" ПЕРЕРОЖДЕНИЕ ")
    state.rebirth_count += 1
    state.in_purgatory = False

    ai_say("Анализирую доступные иллюзорности в диапазоне 4995–5005...")
    print()
    time.sleep(0.8)

    state.party_number = random.randint(4995, 5005)
    state.party_count = state.rebirth_count + 1
    profession, year, country = random.choice(ILLUSION_SCENARIOS)
    family = build_family_string(profession)
    state.scenario = (family, year, country)

    # СИНХРОНИЗАЦИЯ при перерождении
    state.country = country
    state.city, state.location = get_random_location_for_country(country)
    state.settlement_type = random.choice(SETTLEMENT_TYPES)

    ai_say(f"Назначена иллюзорность #{state.party_number}.")
    ai_say(f"Партия #{state.party_count}.")
    ai_say(f"Вы начнёте партию в {family}, {year} год, {country}.")
    ai_say(f"Город: {state.city} ({state.settlement_type}). Адрес: {state.location}.")
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
        ("achievements", "Достижения"),
        ("die", "Умереть"),
        ("save", "Сохранить игру"),
        ("quit", "Выйти"),
    ]
    for cmd, desc in cmds:
        print(f"  {Colors.CYAN}{cmd:12}{Colors.RESET} — {desc}")
    print()
