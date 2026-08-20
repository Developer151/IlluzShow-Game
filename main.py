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
    show_help, rebirth
)
from utils import choice_input, header, divider

def main():
    print()
    print(f"{Colors.CYAN}{Colors.BOLD}  ╔══════════════════════════════════════════╗")
    print(f"  ║     ILLUSION SHOW CLI ENGINE v{VERSION}     ║")
    print(f"  ╚══════════════════════════════════════════╝{Colors.RESET}")
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
        state = registration_scene(state)
        state = create_avatar(state)

    while True:
        if state.alive and not state.in_purgatory:
            # HUD по документации v0.2.1 — без отступов
            header(f" {state.city} — {state.location} ")
            family, year, country = state.scenario
            print(f"Партия: #{state.party_number} | {family}, {year}, {country}")
            print(f"ID: {state.consciousness_id} | Аватар: {state.avatar_name} | Возраст: {state.age} | Смертей: {state.death_count}")
            print(f"Осознанность: {state.stats['awareness']} | Нарушения: {state.stats['violations']}")
            divider()
            print(f"Введи команду (help — справка)")
        elif state.in_purgatory:
            header(" ЧИСТИЛИЩЕ ")
            print(f"Ты вне плоти. Введи 'rebirth' для перерождения.")
        else:
            header(" ??? ")

        cmd = input(f"{Colors.GREEN}> {Colors.RESET}").strip().lower()

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
        elif cmd == "rebirth":
            if not state.in_purgatory:
                print(f"{Colors.RED}Ты не в Чистилище.{Colors.RESET}")
                time.sleep(1)
                continue
            state = rebirth(state)
        elif cmd == "save":
            save_game(state)
            time.sleep(1)
        elif cmd in ["quit", "exit", "q"]:
            save_game(state)
            print(f"{Colors.GRAY}Сознание уходит в тишину...{Colors.RESET}")
            break
        else:
            print(f"{Colors.RED}Неизвестная команда. Введи 'help' для справки.{Colors.RESET}")
            time.sleep(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.GRAY}\nИгра прервана. Сохранение не потеряно, если ты сохранялся вручную.{Colors.RESET}")
