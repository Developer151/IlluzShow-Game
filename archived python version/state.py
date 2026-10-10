# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Состояние игры (v0.3.0)
Новая механика: Мрак и Свет, уровни иллюзорностей
"""

import json
import os
import random
from data import HIDDEN_ACHIEVEMENTS, LOCATIONS
from config import SAVE_FILE

class GameState:
    def __init__(self):
        self.consciousness_id = ""
        self.is_engineer = False
        self.avatar_name = ""
        self.country = ""
        self.city = ""
        self.location = ""
        self.settlement_type = ""
        self.party_number = 0   # Иллюзорность — случайный номер в диапазоне 4995–5005
        self.party_count = 0    # Партия — обычный порядковый счёт (1, 2, 3...)
        self.scenario = ("", "", "")
        # Новая механика: Мрак и Свет
        # darkness + light = 100 всегда
        self.darkness = 0   # 0–100, Мрак
        self.light = 0      # 0–100, Свет
        self._init_darkness_light()
        # Уровень иллюзорности (1–10000)
        # Чем ниже — тем "глубже" во Мраке
        # Чем выше — тем "выше" в Свете
        self.illusion_level = 5000  # Середина
        # Направление партии: "ascend" (поднимает) / "descend" (опускает) / "neutral"
        self.party_direction = "neutral"
        self.stats = {
            "intellect": 10,
            "morality": 10,
            "emotions": 10,
            "awareness": 0,
            "violations": 0,
        }
        # Сохраняем стартовые значения для расчета прогресса партии
        self.start_stats = dict(self.stats)
        
        self.hidden_achievements = {k: dict(v) for k, v in HIDDEN_ACHIEVEMENTS.items()}
        self.inventory = []
        self.visited_countries = set()
        self.visited_cities = set()
        self.visited_locations = set()
        self.rebirth_count = 0
        self.death_count = 0
        self.age = 0
        self.alive = True
        self.in_purgatory = False
        self.kz_verdict = ""
        self.history = []

    def _init_darkness_light(self):
        """Инициализация начального соотношения Мрака и Света.
        Максимальное преобладание любой стороны — 60%."""
        # Генерируем случайное соотношение: одна сторона 40-60%, другая соответственно 60-40%
        # То есть ни одна сторона не может быть меньше 40% или больше 60%
        self.darkness = random.randint(40, 60)
        self.light = 100 - self.darkness

    def get_dominant_force(self):
        """Возвращает преобладающую силу: 'light', 'darkness' или 'neutral'."""
        if self.light > self.darkness:
            return "light"
        elif self.darkness > self.light:
            return "darkness"
        return "neutral"

    def get_force_ratio(self):
        """Возвращает строку соотношения для отображения."""
        return f"Мрак {self.darkness}% | Свет {self.light}%"

    def shift_balance(self, darkness_delta, light_delta):
        """Изменить баланс Мрака и Света. Сумма всегда 100."""
        self.darkness = max(0, min(100, self.darkness + darkness_delta))
        self.light = max(0, min(100, self.light + light_delta))
        # Корректируем чтобы сумма была ровно 100
        total = self.darkness + self.light
        if total != 100:
            # Приоритет — сохранить пропорции
            self.darkness = int(self.darkness * 100 / total)
            self.light = 100 - self.darkness

    def to_dict(self):
        return {
            "consciousness_id": self.consciousness_id,
            "is_engineer": self.is_engineer,
            "avatar_name": self.avatar_name,
            "country": self.country,
            "city": self.city,
            "location": self.location,
            "settlement_type": self.settlement_type,
            "party_number": self.party_number,
            "party_count": self.party_count,
            "scenario": self.scenario,
            "darkness": self.darkness,
            "light": self.light,
            "illusion_level": self.illusion_level,
            "party_direction": self.party_direction,
            "stats": self.stats,
            "start_stats": self.start_stats, # Сохраняем в сейв
            "hidden_achievements": self.hidden_achievements,
            "inventory": self.inventory,
            "visited_countries": list(self.visited_countries),
            "visited_cities": list(self.visited_cities),
            "visited_locations": list(self.visited_locations),
            "rebirth_count": self.rebirth_count,
            "death_count": self.death_count,
            "age": self.age,
            "alive": self.alive,
            "in_purgatory": self.in_purgatory,
            "kz_verdict": self.kz_verdict,
            "history": self.history,
        }

    @classmethod
    def from_dict(cls, data):
        gs = cls()
        for k, v in data.items():
            if k == "visited_countries":
                gs.visited_countries = set(v)
            elif k == "visited_cities":
                gs.visited_cities = set(v)
            elif k == "visited_locations":
                gs.visited_locations = set(v)
            elif k == "darkness":
                gs.darkness = v
            elif k == "light":
                gs.light = v
            elif k == "illusion_level":
                gs.illusion_level = v
            elif k == "party_direction":
                gs.party_direction = v
            elif k == "start_stats":
                gs.start_stats = v
            else:
                setattr(gs, k, v)
        return gs

    def check_achievements(self):
        unlocked = []
        if self.death_count >= 1 and not self.hidden_achievements["first_death"]["unlocked"]:
            self.hidden_achievements["first_death"]["unlocked"] = True
            unlocked.append(self.hidden_achievements["first_death"])
        if self.stats["awareness"] >= 50 and not self.hidden_achievements["awareness_50"]["unlocked"]:
            self.hidden_achievements["awareness_50"]["unlocked"] = True
            unlocked.append(self.hidden_achievements["awareness_50"])
        if self.stats["violations"] >= 10 and not self.hidden_achievements["violations_10"]["unlocked"]:
            self.hidden_achievements["violations_10"]["unlocked"] = True
            unlocked.append(self.hidden_achievements["violations_10"])
        if self.stats["morality"] >= 30 and not self.hidden_achievements["moral_paragon"]["unlocked"]:
            self.hidden_achievements["moral_paragon"]["unlocked"] = True
            unlocked.append(self.hidden_achievements["moral_paragon"])
        if self.rebirth_count >= 5 and not self.hidden_achievements["rebirth_5"]["unlocked"]:
            self.hidden_achievements["rebirth_5"]["unlocked"] = True
            unlocked.append(self.hidden_achievements["rebirth_5"])
        if len(self.visited_countries) >= len(LOCATIONS) and not self.hidden_achievements["all_countries"]["unlocked"]:
            self.hidden_achievements["all_countries"]["unlocked"] = True
            unlocked.append(self.hidden_achievements["all_countries"])
        return unlocked


def save_game(state):
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(state.to_dict(), f, ensure_ascii=False, indent=2)
    from config import Colors
    print(f"{Colors.GREEN}💾 Прогресс сохранён в {SAVE_FILE}{Colors.RESET}")


def load_game():
    if not os.path.exists(SAVE_FILE):
        return None
    with open(SAVE_FILE, "r", encoding="utf-8") as f:
        return GameState.from_dict(json.load(f))


def delete_save():
    if os.path.exists(SAVE_FILE):
        os.remove(SAVE_FILE)
