import random
from countries_data import COUNTRIES
from game_logic import (
    is_valid_country, 
    get_country_values, 
    give_hint, 
    get_matching_remaining_countries,
    calculate_score
)

# ANSI Color Codes
CYAN = "\033[96m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

print(f"{CYAN}🌍 WELCOME TO COUNTRY WORDLE 🌍{RESET}")

try:
    while True:
        # 1. Get a list of all unique continents
        unique_continents = list(set(c["continent"] for c in COUNTRIES))
        
        # 2. Pick a random continent with equal probability
        chosen_continent = random.choice(unique_continents)
        
        # 3. Filter countries list to only those in the chosen continent
        continent_countries = [c for c in COUNTRIES if c["continent"] == chosen_continent]
        
        # 4. Pick the target country randomly from that specific continent
        target_country = random.choice(continent_countries)
        
        print(f"\n{CYAN}--- New Round Started ---{RESET}")
        print("Try to guess the country name! (Type 'help' for remaining matches, 'quit' to give up)\n")

        guess_kop = 0
        help_used_count = 0
        guesses_history = []
        round_over = False

        while not round_over:
            guess = input("Enter your guess: ").strip()
            
            # 1. Option: Quit
            if guess.lower() in ["quit", "exit", "q"]:
                print(f"\n{YELLOW}🏳️ You gave up! The correct country was: {target_country['country']}{RESET}")
                print(f"{RED}Score: 0 points{RESET}")
                round_over = True
                break

            # 2. Option: Help / Clues filtering
            if guess.lower() in ["help", "hint", "h"]:
                if not guesses_history:
                    print(f"{YELLOW}💡 Make at least one guess first to unlock filtered options!{RESET}\n")
                else:
                    help_used_count += 1
                    remaining = get_matching_remaining_countries(guesses_history, target_country)
                    print(f"\n{CYAN}🔍 --- HELP: REMAINING POSSIBILITIES ({len(remaining)}) ---{RESET}")
                    print(f"{YELLOW}⚠️ Penalty applied: -150 points for using help!{RESET}")
                    print(", ".join(sorted(remaining)))
                    print("-" * 50 + "\n")
                continue

            # Check guess limit
            if guess_kop >= 20:
                print(f"\n{RED}You've reached the maximum number of guesses. The correct country was: {target_country['country']}.{RESET}")
                print(f"{RED}Score: 0 points{RESET}")
                round_over = True
                break
            
            # Validate the country
            if not is_valid_country(guess):
                print(f"{RED}❌ Invalid country name or not a UN member. Please try again.{RESET}\n")
                continue
                
            guess_country = get_country_values(guess)
            
            # Record guess in history if not already guessed
            if guess_country not in guesses_history:
                guesses_history.append(guess_country)

            # Check if correct
            if guess_country['country'].lower() == target_country['country'].lower():
                total_guesses = guess_kop + 1
                final_score = calculate_score(total_guesses, help_used_count)
                
                print(f"\n{GREEN}🎉 Congratulations! You guessed the correct country: {target_country['country']}!{RESET}")
                print(f"Total guesses: {total_guesses}")
                if help_used_count > 0:
                    print(f"Help used: {help_used_count} time(s)")
                print(f"{CYAN}🏆 Final Round Score: {final_score} / 1000 points!{RESET}")
                round_over = True
                break
            else:
                print(f"\n--- Hints for {guess_country['country']} ---")
                guess_kop += 1
                give_hint(guess_country, target_dict=target_country)
                print("-" * 35 + "\n")

        # Ask to play again
        play_again = input("\nWould you like to play another round? (y/n): ").strip().lower()
        if play_again != 'y':
            print(f"\n{CYAN}Thanks for playing Country Wordle! Goodbye 👋{RESET}")
            break

except KeyboardInterrupt:
    print(f"\n\n{YELLOW}🏳️ Game interrupted! Thanks for playing!{RESET}")