# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Утилиты
"""

import sys
import time
import shutil
from config import Colors

def get_terminal_width():
    """Получить ширину терминала, минимум 40."""
    try:
        return max(40, shutil.get_terminal_size().columns)
    except:
        return 50

def wrap_text(text, width=None):
    """Перенос текста по словам с учётом ширины терминала."""
    if width is None:
        width = get_terminal_width()

    words = text.split(' ')
    lines = []
    current_line = ""

    for word in words:
        if not current_line:
            current_line = word
        elif len(current_line) + 1 + len(word) <= width:
            current_line += " " + word
        else:
            lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return "\n".join(lines)

def print_slow(text, delay=0.025):
    """Печать посимвольно с переносом по словам."""
    width = get_terminal_width()
    words = text.split(' ')
    current_line_len = 0

    for i, word in enumerate(words):
        word_len = len(word)

        # Перенос на новую строку, если слово не влезает
        if current_line_len > 0 and current_line_len + 1 + word_len > width:
            print()
            current_line_len = 0

        # Печатаем слово посимвольно
        for char in word:
            sys.stdout.write(char)
            sys.stdout.flush()
            time.sleep(delay)

        current_line_len += word_len

        # Пробел после слова
        if i < len(words) - 1:
            next_word = words[i + 1] if i + 1 < len(words) else ""
            if current_line_len + 1 + len(next_word) <= width:
                sys.stdout.write(' ')
                sys.stdout.flush()
                current_line_len += 1

    print()

def header(title):
    w = 50
    print()
    print(f"{Colors.CYAN}{'═'*w}{Colors.RESET}")
    print(f"{Colors.CYAN}║{Colors.BOLD}{title:^{w-2}}{Colors.RESET}{Colors.CYAN}║{Colors.RESET}")
    print(f"{Colors.CYAN}{'═'*w}{Colors.RESET}")

def divider():
    print(f"{Colors.GRAY}{'─'*50}{Colors.RESET}")

def ai_say(text, delay=0.03):
    """ИИ печатает посимвольно с переносом по словам.
    Перенесённые строки начинаются с начала строки (без отступа)."""
    width = get_terminal_width()
    prefix = f"{Colors.LIME}◈ ИИ Корабля Земля:{Colors.RESET} "
    prefix_len = len("◈ ИИ Корабля Земля: ")  # чистая длина без ANSI

    words = text.split(' ')
    current_line_len = 0
    first_word = True

    for i, word in enumerate(words):
        word_len = len(word)

        if first_word:
            # Первое слово — с префиксом
            sys.stdout.write(prefix)
            sys.stdout.flush()
            current_line_len = prefix_len
            first_word = False

        # Перенос на новую строку, если слово не влезает
        if current_line_len > 0 and current_line_len + 1 + word_len > width:
            print()  # новая строка БЕЗ отступа
            current_line_len = 0

        # Пробел перед словом (если не начало строки)
        if current_line_len > 0:
            sys.stdout.write(' ')
            sys.stdout.flush()
            current_line_len += 1

        # Печатаем слово посимвольно
        for char in word:
            sys.stdout.write(char)
            sys.stdout.flush()
            time.sleep(delay)

        current_line_len += word_len

    print()

def choice_input(prompt, options):
    print(f"\n{Colors.YELLOW}{prompt}{Colors.RESET}")
    for i, opt in enumerate(options, 1):
        print(f"  {Colors.CYAN}[{i}]{Colors.RESET} {opt}")
    while True:
        try:
            inp = input(f"{Colors.GREEN}> {Colors.RESET}").strip()
            if inp.lower() in ["q", "quit", "exit"]:
                return None
            idx = int(inp) - 1
            if 0 <= idx < len(options):
                return idx
            print(f"{Colors.RED}Неверный выбор. Попробуй снова.{Colors.RESET}")
        except ValueError:
            print(f"{Colors.RED}Введи число от 1 до {len(options)}.{Colors.RESET}")
