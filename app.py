import json
import os
import random
from flask import Flask, render_template, request, jsonify, send_from_directory
from game_logic import (
    is_valid_country,
    get_country_values,
    get_closest_match,
    get_matching_remaining_countries,
    calculate_score
)

app = Flask(__name__)

@app.route("/countries.json")
def serve_countries_json():
    # This guarantees it looks in the exact same folder as app.py
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), "countries.json")

# Load countries data from countries.json on startup
try:
    with open("countries.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        COUNTRIES = data.get("countries", data) 
except Exception as e:
    print(f"Error loading countries.json: {e}")
    COUNTRIES = []

# In-memory storage for active web games
game_state = {
    "target_country": None,
    "guesses_history": [],
    "guess_count": 0,
    "help_used_count": 0,
    "game_over": False
}

def start_new_game():
    if not COUNTRIES:
        return
    
    # Normalize COUNTRIES to a list of country name strings 
    # regardless of whether the JSON contains strings, lists, or dicts
    country_names = []
    for item in COUNTRIES:
        if isinstance(item, dict):
            country_names.append(item.get("country") or item.get("name"))
        elif isinstance(item, (list, tuple)):
            country_names.append(item[0])
        elif isinstance(item, str):
            country_names.append(item)
            
    # Get full dictionary data for each country using game_logic
    country_dicts = [get_country_values(name) for name in country_names if name]
    country_dicts = [d for d in country_dicts if d and "continent" in d]
    
    if not country_dicts:
        return

    unique_continents = list(set(c["continent"] for c in country_dicts))
    chosen_continent = random.choice(unique_continents)
    continent_countries = [c for c in country_dicts if c["continent"] == chosen_continent]
    
    game_state["target_country"] = random.choice(continent_countries)
    game_state["guesses_history"] = []
    game_state["guess_count"] = 0
    game_state["help_used_count"] = 0
    game_state["game_over"] = False

@app.route("/")
def index():
    start_new_game()
    return render_template("index.html")

@app.route("/api/guess", methods=["POST"])
def process_guess():
    if game_state["game_over"]:
        return jsonify({"error": "Game is already over. Start a new game!"}), 400

    data = request.json
    guess_name = data.get("guess", "").strip()

    if not is_valid_country(guess_name):
        suggestion = get_closest_match(guess_name)
        return jsonify({
            "valid": False,
            "message": "Invalid country name or not a UN member.",
            "suggestion": suggestion
        })

    guess_dict = get_country_values(guess_name)
    target_dict = game_state["target_country"]

    # Record history if new
    if guess_dict not in game_state["guesses_history"]:
        game_state["guesses_history"].append(guess_dict)

    game_state["guess_count"] += 1
    is_correct = (guess_dict['country'].lower() == target_dict['country'].lower())
    
    if is_correct:
        game_state["game_over"] = True
        score = calculate_score(game_state["guess_count"], game_state["help_used_count"])
        return jsonify({
            "valid": True,
            "correct": True,
            "country": guess_dict['country'],
            "guess_count": game_state["guess_count"],
            "score": score,
            "target": target_dict['country']
        })

    if game_state["guess_count"] >= 20:
        game_state["game_over"] = True
        return jsonify({
            "valid": True,
            "correct": False,
            "game_over_limit": True,
            "target": target_dict['country']
        })

    # Prepare visual hints for Web UI
    hints = {
        "pop": "MATCH" if guess_dict['pop'] == target_dict['pop'] else ("HIGHER ⬆️" if guess_dict['pop'] < target_dict['pop'] else "LOWER ⬇️"),
        "km2": "MATCH" if guess_dict['km2'] == target_dict['km2'] else ("HIGHER ⬆️" if guess_dict['km2'] < target_dict['km2'] else "LOWER ⬇️"),
        "gdp": "MATCH" if guess_dict['gdp'] == target_dict['gdp'] else ("HIGHER ⬆️" if guess_dict['gdp'] < target_dict['gdp'] else "LOWER ⬇️"),
        "continent": "SAME 🟩" if guess_dict['continent'] == target_dict['continent'] else "DIFFERENT 🟥"
    }

    return jsonify({
        "valid": True,
        "correct": False,
        "country": guess_dict['country'],
        "hints": hints,
        "guess_count": game_state["guess_count"]
    })

@app.route("/api/help", methods=["GET"])
def get_help():
    if not game_state["guesses_history"]:
        return jsonify({"message": "Make at least one guess first!"})

    game_state["help_used_count"] += 1
    remaining = get_matching_remaining_countries(
        game_state["guesses_history"], 
        game_state["target_country"]
    )
    return jsonify({
        "remaining": sorted(remaining),
        "count": len(remaining)
    })

@app.route("/api/restart", methods=["POST"])
def restart():
    start_new_game()
    return jsonify({"status": "reset"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)