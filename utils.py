# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Утилиты
"""

import sys
import time
from config import Colors

def print_slow(text, delay=0.025):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
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
    sys.stdout.write(f"{Colors.LIME}◈ ИИ Корабля Земля:{Colors.RESET} ")
    sys.stdout.flush()
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
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
