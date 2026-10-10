# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Утилиты (v0.3.4)
Универсальный ввод: стандартный input() + активная чистка буфера
"""

import sys
import time
import shutil
import select
import re
import threading
from config import Colors

# ───────────────────────────────────────────────
# Определяем платформу
# ───────────────────────────────────────────────
_IS_ANDROID = hasattr(sys, 'getandroidapilevel') or 'pydroid' in sys.executable.lower() or '/data/data/' in sys.prefix

# ───────────────────────────────────────────────
# Чистка буфера ввода
# ───────────────────────────────────────────────

def _drain_input():
    """Сбросить накопленный ввод из буфера."""
    if _IS_ANDROID:
        # На Android select не работает с виртуальной клавиатурой
        return
    try:
        while True:
            ready, _, _ = select.select([sys.stdin], [], [], 0)
            if not ready:
                break
            sys.stdin.read(1)
    except:
        pass


# ───────────────────────────────────────────────
# Фоновая чистка (только на десктопе)
# ───────────────────────────────────────────────
_drain_thread = None
_drain_active = False


def _start_drain():
    """Запустить фоновую чистку буфера."""
    global _drain_active, _drain_thread
    if _IS_ANDROID:
        return
    _drain_active = True
    _drain_thread = threading.Thread(target=_drain_loop, daemon=True)
    _drain_thread.start()


def _stop_drain():
    """Остановить фоновую чистку буфера."""
    global _drain_active, _drain_thread
    _drain_active = False
    if _drain_thread:
        _drain_thread.join(timeout=0.1)
        _drain_thread = None


def _drain_loop():
    """Фоновый цикл чистки буфера."""
    while _drain_active:
        _drain_input()
        time.sleep(0.01)


# ───────────────────────────────────────────────
# Утилиты
# ───────────────────────────────────────────────
def get_terminal_width():
    try:
        return max(40, shutil.get_terminal_size().columns)
    except:
        return 50


def _strip_ansi(text):
    return re.sub(r'\x1b\[[0-9;]*m', '', text)


def wrap_text(text, width=None):
    if width is None:
        width = get_terminal_width()
    words = text.split(' ')
    lines = []
    current_line = ""
    current_clean_len = 0
    for word in words:
        clean_word = _strip_ansi(word)
        word_clean_len = len(clean_word)
        if not current_line:
            current_line = word
            current_clean_len = word_clean_len
        elif current_clean_len + 1 + word_clean_len <= width:
            current_line += " " + word
            current_clean_len += 1 + word_clean_len
        else:
            lines.append(current_line)
            current_line = word
            current_clean_len = word_clean_len
    if current_line:
        lines.append(current_line)
    return "\n".join(lines)


# ───────────────────────────────────────────────
# Вывод с чисткой буфера
# ───────────────────────────────────────────────

def print_slow(text, delay=0.025):
    """Печать посимвольно. Буфер чистится перед каждым символом."""
    width = get_terminal_width()
    words = text.split(' ')
    current_line_len = 0

    _start_drain()  # Запускаем фоновую чистку
    try:
        for i, word in enumerate(words):
            clean_word = _strip_ansi(word)
            word_len = len(clean_word)

            if current_line_len > 0 and current_line_len + 1 + word_len > width:
                print()
                current_line_len = 0

            for char in word:
                _drain_input()
                sys.stdout.write(char)
                sys.stdout.flush()
                time.sleep(delay)

            current_line_len += word_len

            if i < len(words) - 1:
                next_word = words[i + 1] if i + 1 < len(words) else ""
                next_clean = _strip_ansi(next_word)
                if current_line_len + 1 + len(next_clean) <= width:
                    _drain_input()
                    sys.stdout.write(' ')
                    sys.stdout.flush()
                    current_line_len += 1
    finally:
        _stop_drain()  # Останавливаем фоновую чистку

    print()


def header(title):
    _drain_input()
    w = 50
    print()
    print(f"{Colors.CYAN}{'═'*w}{Colors.RESET}")
    print(f"{Colors.CYAN}║{Colors.BOLD}{title:^{w-2}}{Colors.RESET}{Colors.CYAN}║{Colors.RESET}")
    print(f"{Colors.CYAN}{'═'*w}{Colors.RESET}")


def divider():
    _drain_input()
    print(f"{Colors.GRAY}{'─'*50}{Colors.RESET}")


def ai_say(text, delay=0.03):
    """ИИ печатает посимвольно."""
    width = get_terminal_width()
    prefix = f"{Colors.LIME}◈ ИИ Корабля Земля:{Colors.RESET} "
    prefix_len = len("◈ ИИ Корабля Земля: ")

    words = text.split(' ')
    current_line_len = 0
    first_word = True

    _start_drain()
    try:
        for i, word in enumerate(words):
            clean_word = _strip_ansi(word)
            word_len = len(clean_word)

            if first_word:
                _drain_input()
                sys.stdout.write(prefix)
                sys.stdout.flush()
                current_line_len = prefix_len
                first_word = False

            if current_line_len > 0 and current_line_len + 1 + word_len > width:
                print()
                current_line_len = 0

            if current_line_len > 0:
                _drain_input()
                sys.stdout.write(' ')
                sys.stdout.flush()
                current_line_len += 1

            for char in word:
                _drain_input()
                sys.stdout.write(char)
                sys.stdout.flush()
                time.sleep(delay)

            current_line_len += word_len
    finally:
        _stop_drain()

    print()


# ───────────────────────────────────────────────
# Ввод — стандартный input() с очисткой
# ───────────────────────────────────────────────

def wait_enter(prompt_text=""):
    """Ожидание нажатия Enter."""
    _drain_input()
    if prompt_text:
        print(prompt_text, end="", flush=True)
    try:
        input()  # На Android это работает с виртуальной клавиатурой
    except:
        pass


def choice_input(prompt, options):
    """Ввод выбора."""
    _drain_input()
    print(f"\n{Colors.YELLOW}{prompt}{Colors.RESET}")
    for i, opt in enumerate(options, 1):
        print(f"  {Colors.CYAN}[{i}]{Colors.RESET} {opt}")
    while True:
        try:
            _drain_input()
            inp = input(f"{Colors.GREEN}> {Colors.RESET}").strip()
            if inp.lower() in ["q", "quit", "exit"]:
                return None
            idx = int(inp) - 1
            if 0 <= idx < len(options):
                return idx
            print(f"{Colors.RED}Неверный выбор. Попробуй снова.{Colors.RESET}")
        except ValueError:
            print(f"{Colors.RED}Введи число от 1 до {len(options)}.{Colors.RESET}")


def direction_display(direction):
    """Переводит внутреннее значение вектора партии ('ascend'/'descend'/'neutral')
    в русское слово для вывода игроку."""
    mapping = {
        "ascend": "Возвышение",
        "descend": "Падение",
        "neutral": "Нейтральный",
    }
    return mapping.get(direction, direction)


def family_display(family):
    """Преобразует дательный падеж семьи ('семье учителя') в именительный
    для сводок/HUD/профиля ('Семья учителя'). Реплики ИИ (ai_say) используют
    исходную строку из data.py как есть — эта функция там не нужна."""
    prefix = "семье "
    if family.startswith(prefix):
        return "Семья " + family[len(prefix):]
    return family[:1].upper() + family[1:]


def force_bar_10(value, filled_color, empty_color):
    """Шкала из 10 квадратов. 1 квадрат = 10%.
    Заполненные — цветные, пустые — серые."""
    filled = value // 10  # целых десятков
    remainder = value % 10  # остаток для округления
    if remainder >= 5:
        filled += 1
    filled = min(10, max(0, filled))
    empty = 10 - filled
    return f"{filled_color}{'■'*filled}{empty_color}{'■'*empty}{Colors.RESET} {value}%"


def force_bar_5(value, filled_color, empty_color):
    """Пара шкал из 10 квадратов (верх/низ), дающая точность 5%.

    Правило (tens = value // 10, rem = value % 10):
      rem == 0   -> верх = tens,   низ = tens    (ровно, совпадают)
      rem в 1..5  -> верх = tens+1, низ = tens    (верх опережает на 1)
      rem в 6..9  -> верх = tens+1, низ = tens+1  (низ подтянулся, снова совпадают)

    Возвращает (верхняя_строка, нижняя_строка) — обе уже с ANSI-цветами и RESET,
    без подписи и без числа — их печатает вызывающий код.
    """
    tens = value // 10
    rem = value % 10
    if rem == 0:
        top = tens
        bottom = tens
    elif rem <= 5:
        top = tens + 1
        bottom = tens
    else:
        top = tens + 1
        bottom = tens + 1

    top = min(10, max(0, top))
    bottom = min(10, max(0, bottom))

    top_line = f"{filled_color}{'■'*top}{empty_color}{'■'*(10-top)}{Colors.RESET}"
    bottom_line = f"{filled_color}{'■'*bottom}{empty_color}{'■'*(10-bottom)}{Colors.RESET}"
    return top_line, bottom_line
