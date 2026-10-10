#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine v0.2.1 — Точка входа
"""

import time
import sys

from config import Colors, VERSION
from state import GameState, save_game, load_game, delete_save
from scenes import (
    registration_scene, create_avatar, show_profile, show_stats,
    show_inventory, explore, travel, work, sleep, die, show_achievements,
    show_help, purgatory, rebirth, choose_color_scheme
)
from utils import choice_input, header, divider, family_display

# Список всех доступных команд для нечеткого поиска
COMMANDS = [
    "help", "profile", "stats", "explore", "travel", 
    "work", "sleep", "inventory", "achievements", 
    "die", "save", "quit", "exit", "q"
]

def find_command(cmd_input):
    """Ищет команду по префиксу. Возвращает полное имя или None."""
    if not cmd_input:
        return None
    
    # Точное совпадение всегда приоритетно
    if cmd_input in COMMANDS:
        return cmd_input
        
    # Ищем все команды, начинающиеся с введенного префикса
    matches = [c for c in COMMANDS if c.startswith(cmd_input)]
    
    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(f"{Colors.YELLOW}Неоднозначный ввод. Возможные варианты: {', '.join(matches)}{Colors.RESET}")
        return None
    else:
        return None

def main():
    print(f"{Colors.CYAN}{Colors.BOLD}                   ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    print(f"                   |  ILLUSION SHOW CLI Game v{VERSION}  |")
    print(f"                   ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■{Colors.RESET}")
    print(f"{Colors.CYAN}                 |От Developer151, tg - @slava_kos_2006|")
    print()

    state = load_game()
    if state:
        print(f"{Colors.GREEN}💾 Найдено сохранение: {state.consciousness_id}{Colors.RESET}")
        idx = choice_input("Что делаем?", ["Продолжить", "Новая игра", "Удалить сохранение"])
        if idx == 1:
            delete_save()
            state = None
        elif idx == 2:
            delete_save()
            state = None
        elif idx is None:
            print(f"{Colors.GRAY}До встречи.{Colors.RESET}")
            return

    if state is None:
        state = GameState()
        state.color_scheme = choose_color_scheme()
        print()
        time.sleep(0.5)
        state = registration_scene(state)
        state = create_avatar(state)
    while True:
        if state.alive:
            # HUD по документации v0.2.1 — без отступов
            header(f"Партия: #{state.party_count} ")
            family, year, country = state.scenario
            print(f"| {family_display(family)}, {year}, {country}")
            print(f"ID: | Аватар: {state.avatar_name} | Возраст: {state.age} | Смертей: {state.death_count}")
            print(f"Осознанность: {state.stats['awareness']} | Нарушения: {state.stats['violations']}")
            divider()
            print(f"Введи команду (help — справка)")
        else:
            header(" ??? ")
            
        raw_input = input(f"{Colors.GREEN}> {Colors.RESET}").strip().lower()
        cmd = find_command(raw_input)
        
        if cmd is None and raw_input != "":
             # Если ничего не нашли и ввод не пустой - ошибка
             print(f"{Colors.RED}Неизвестная команда. Введи 'help' для справки.{Colors.RESET}")
             time.sleep(1)
             continue
             
        if cmd == "help":
            show_help()
        elif cmd == "profile":
            show_profile(state)
        elif cmd == "stats":
            show_stats(state)
        elif cmd == "explore":
            if not state.alive:
                print(f"{Colors.RED}Ты мёртв. Нельзя исследовать.{Colors.RESET}")
                time.sleep(1)
                continue
            state = explore(state)
        elif cmd == "travel":
            if not state.alive:
                print(f"{Colors.RED}Ты мёртв. Нельзя путешествовать.{Colors.RESET}")
                time.sleep(1)
                continue
            state = travel(state)
        elif cmd == "work":
            if not state.alive:
                print(f"{Colors.RED}Ты мёртв. Нельзя работать.{Colors.RESET}")
                time.sleep(1)
                continue
            state = work(state)
        elif cmd == "sleep":
            if not state.alive:
                print(f"{Colors.RED}Ты мёртв. Нельзя спать.{Colors.RESET}")
                time.sleep(1)
                continue
            state = sleep(state)
        elif cmd == "inventory":
            show_inventory(state)
        elif cmd == "achievements":
            show_achievements(state)
        elif cmd == "die":
            if not state.alive:
                print(f"{Colors.RED}Ты уже мёртв.{Colors.RESET}")
                time.sleep(1)
                continue
            confirm = input(f"{Colors.RED}Ты уверен? Это необратимо. (да/нет): {Colors.RESET}").strip().lower()
            if confirm in ["да", "yes", "y", "д"]:
                state = die(state)
        elif cmd == "save":
            save_game(state)
            time.sleep(1)
        elif cmd in ["quit", "exit", "q"]:
            save_game(state)
            print(f"{Colors.GRAY}Сознание уходит в тишину...{Colors.RESET}")
            break

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.GRAY}\nИгра прервана. Сохранение не потеряно, если ты сохранялся вручную.{Colors.RESET}")
