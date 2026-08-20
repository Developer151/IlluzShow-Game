# -*- coding: utf-8 -*-
"""
IllusionShow CLI Engine — Состояние игры
"""

import json
import os
from data import HIDDEN_ACHIEVEMENTS, LOCATIONS

SAVE_FILE = "illusion_show_save.json"

class GameState:
    def __init__(self):
        self.consciousness_id = ""      # Сознание#NNNN или Сознание#NNNN_И#XXX
        self.is_engineer = False        # True если инженер
        self.avatar_name = ""
        self.country = ""               # страна
        self.city = ""                  # город
        self.location = ""              # адрес
        self.party_number = 0
        self.scenario = ("", "", "")    # (семья, год, страна)
        self.stats = {
            "intellect": 10,
            "morality": 10,
            "emotions": 10,
            "awareness": 0,
            "violations": 0,
        }
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

    def to_dict(self):
        return {
            "consciousness_id": self.consciousness_id,
            "is_engineer": self.is_engineer,
            "avatar_name": self.avatar_name,
            "country": self.country,
            "city": self.city,
            "location": self.location,
            "party_number": self.party_number,
            "scenario": self.scenario,
            "stats": self.stats,
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
