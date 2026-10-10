# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Конфигурация
"""

SAVE_FILE = "Game_save.json"
VERSION = "0.3.6"

# ANSI-цвета
class Colors:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"
    GRAY    = "\033[90m"
    VIOLET  = "\033[38;5;129m"
    LIME    = "\033[38;5;118m"
    BLACK   = "\033[30m"

COLOR_SCHEMES = {
    "violet_green": {
        "name": "Фиолетовый / Зеленый",
        "darkness": Colors.MAGENTA,
        "light": Colors.GREEN,
        "empty": Colors.GRAY
    },
    "black_white": {
        "name": "Черный / Белый (требуется светлый фон)",
        "darkness": Colors.BLACK,
        "light": Colors.WHITE,
        "empty": Colors.GRAY
    }
}
