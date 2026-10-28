import os
import json
import difflib

# Load data directly from the unified countries.json file
json_path = os.path.join(os.path.dirname(__file__), 'countries.json')
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Countries is now a dict: { "Country Name": { "code": "...", "pop": ..., ... } }
COUNTRIES_RAW = data["countries"]
COUNTRY_ALIASES = data["aliases"]

# Convert to a convenient list format for internal game loops & matching
COUNTRIES = []
for name, info in COUNTRIES_RAW.items():
    country_dict = {"country": name, **info}
    COUNTRIES.append(country_dict)

# ANSI Color Codes
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"

def find_country(name):
    if not name:
        return None
    name_clean = name.strip().lower()

    # 1. Build a lowercased map of aliases on the fly to avoid case-sensitivity issues
    alias_map = {k.lower(): v.lower() for k, v in COUNTRY_ALIASES.items()}
    if name_clean in alias_map:
        canonical_name = alias_map[name_clean]
        for c in COUNTRIES:
            if c["country"].lower() == canonical_name:
                return c

    # 2. Check for exact match in COUNTRIES
    for c in COUNTRIES:
        if c["country"].lower() == name_clean:
            return c

    # 3. Fallback: Partial match check (e.g. typing "bosnia" matches "Bosnia and Herzegovina")
    matches = [c for c in COUNTRIES if name_clean in c["country"].lower()]
    if len(matches) == 1:
        return matches[0]

    return None

def is_valid_country(guess):
    return find_country(guess) is not None

def get_country_values(guess):
    return find_country(guess)

def get_closest_match(name):
    country_names = [c["country"] for c in COUNTRIES]
    matches = difflib.get_close_matches(name, country_names, n=1, cutoff=0.6)
    return matches[0] if matches else None

def population_hint(guess_dict, target_dict):
    if guess_dict['pop'] < target_dict['pop']:
        print(f"POPULATION is {YELLOW}HIGHER ⬆️{RESET}")
    elif guess_dict['pop'] > target_dict['pop']:
        print(f"POPULATION is {RED}LOWER ⬇️{RESET}")
    else:
        print(f"POPULATION {GREEN}matches! 🟩{RESET}")

def area_hint(guess_dict, target_dict):
    if guess_dict['km2'] < target_dict['km2']:
        print(f"AREA is {YELLOW}HIGHER ⬆️{RESET}")
    elif guess_dict['km2'] > target_dict['km2']:
        print(f"AREA is {RED}LOWER ⬇️{RESET}")
    else:
        print(f"AREA {GREEN}matches! 🟩{RESET}")

def gdp_hint(guess_dict, target_dict):
    if guess_dict['gdp'] < target_dict['gdp']:
        print(f"GDP is {YELLOW}HIGHER ⬆️{RESET}")
    elif guess_dict['gdp'] > target_dict['gdp']:
        print(f"GDP is {RED}LOWER ⬇️{RESET}")
    else:
        print(f"GDP {GREEN}matches! 🟩{RESET}")

def continent_hint(guess_dict, target_dict):
    if guess_dict['continent'] == target_dict['continent']:
        print(f"CONTINENT is the {GREEN}same! 🟩{RESET}")
    else:
        print(f"CONTINENT is {RED}different 🟥{RESET}")

def give_hint(guess_dict, target_dict):
    population_hint(guess_dict, target_dict)
    area_hint(guess_dict, target_dict)
    gdp_hint(guess_dict, target_dict)
    continent_hint(guess_dict, target_dict)

def get_matching_remaining_countries(guesses_history, target_dict):
    """Filters remaining countries, excluding already guessed ones and matching hints."""
    possible = list(COUNTRIES)
    
    min_pop, max_pop = 0, float('inf')
    min_km2, max_km2 = 0, float('inf')
    min_gdp, max_gdp = 0, float('inf')
    target_continent = None
    excluded_continents = set()
    
    # Track lowercased names of already guessed countries to exclude them from help
    guessed_names = {g['country'].lower() for g in guesses_history}
    
    for guess in guesses_history:
        if guess['pop'] < target_dict['pop']:
            min_pop = max(min_pop, guess['pop'])
        elif guess['pop'] > target_dict['pop']:
            max_pop = min(max_pop, guess['pop'])
            
        if guess['km2'] < target_dict['km2']:
            min_km2 = max(min_km2, guess['km2'])
        elif guess['km2'] > target_dict['km2']:
            max_km2 = min(max_km2, guess['km2'])
            
        if guess['gdp'] < target_dict['gdp']:
            min_gdp = max(min_gdp, guess['gdp'])
        elif guess['gdp'] > target_dict['gdp']:
            max_gdp = min(max_gdp, guess['gdp'])
            
        if guess['continent'] == target_dict['continent']:
            target_continent = guess['continent']
        else:
            excluded_continents.add(guess['continent'])

    filtered = []
    for c in possible:
        # 1. Skip if already guessed
        if c['country'].lower() in guessed_names:
            continue
            
        # 2. Skip if out of hint ranges
        if not (min_pop <= c['pop'] <= max_pop):
            continue
        if not (min_km2 <= c['km2'] <= max_km2):
            continue
        if not (min_gdp <= c['gdp'] <= max_gdp):
            continue
        if target_continent and c['continent'] != target_continent:
            continue
        if c['continent'] in excluded_continents:
            continue
            
        filtered.append(c['country'])
        
    return filtered

def calculate_score(guesses_count, help_used_count):
    base_score = 1000
    guess_penalty = (guesses_count - 1) * 40
    help_penalty = help_used_count * 150
    
    final_score = base_score - guess_penalty - help_penalty
    return max(final_score, 100)