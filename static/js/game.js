import { FLAG_MAP, norm, flagCode, flagUrl, esc, flagImg, getCountryName, getCountryCode } from './utils.js';
import { fetchCountriesData, sendGuess, fetchHelp, postRestart } from './api.js';
import { setMessage, setFinished, prependCard, updateInputFlag, tile, hideSuggest, triggerConfetti } from './ui.js';

export let COUNTRIES = [];
export let ALIASES = [];
export let finished = false;

export async function submitGuess(val, inputEl, counterEl, resultsDivEl) {
    if (finished) return;
    const guessVal = val.trim();
    if (!guessVal) return;
    hideSuggest();

    let data;
    try {
        data = await sendGuess(guessVal);
    } catch (e) {
        setMessage("Can't reach the game server. Check that it's running and try again.");
        return;
    }

    setMessage('');

    if (!data.valid) {
        const field = document.getElementById('field');
        field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
        let html = esc(data.message || "That isn't a country in the game.");
        if (data.suggestion) {
            html += ` Did you mean <button class="link" data-suggestion="${esc(data.suggestion)}">${esc(data.suggestion)}</button>?`;
        }
        setMessage(html);
        return;
    }

    inputEl.value = '';
    updateInputFlag('');
    if (data.guess_count != null) counterEl.textContent = `${data.guess_count} ${data.guess_count === 1 ? 'guess' : 'guesses'}`;

    if (data.correct) {
        prependCard(`<div class="card end-card win fresh">
            ${flagImg(data.target, 'flag-big', 320)}
            <h2>You got it: ${esc(data.target)}!</h2>
            <p>Total guesses: ${esc(data.guess_count)}</p>
            <p class="score">Score: ${esc(data.score)} / 1000</p>
        </div>`);
        finished = true;
        setFinished(true, hideSuggest);
        triggerConfetti();
        return;
    }

    if (data.game_over_limit) {
        prependCard(`<div class="card end-card lose fresh">
            ${flagImg(data.target, 'flag-big', 320)}
            <h2>Out of guesses</h2>
            <p>The country was <strong>${esc(data.target)}</strong>.</p>
        </div>`);
        finished = true;
        setFinished(true, hideSuggest);
        return;
    }

    const h = data.hints || {};
    prependCard(`<div class="card fresh">
        <div class="card-head">
            ${flagImg(data.country, 'flag')}
            <div>
                <h3 class="card-title">${esc(data.country)}</h3>
                <p class="card-sub">Guess #${esc(data.guess_count)}</p>
            </div>
        </div>
        <div class="tiles">
            ${tile('Population', h.pop)}
            ${tile('Area', h.km2)}
            ${tile('GDP', h.gdp)}
            ${tile('Continent', h.continent)}
        </div>
    </div>`);
}

export async function requestHelp() {
    let data;
    try {
        data = await fetchHelp();
    } catch (e) {
        setMessage("Can't reach the game server. Check that it's running and try again.");
        return;
    }
    if (data.message) { setMessage(esc(data.message)); return; }

    document.getElementById('helpTitle').textContent = `Still in the running (${data.count})`;
    document.getElementById('helpChips').innerHTML = (data.remaining || []).map(n =>
        `<button class="chip" data-name="${esc(n)}">${flagCode(n) ? `<img src="${flagUrl(flagCode(n), 40)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}${esc(n)}</button>`
    ).join('');
    const dlg = document.getElementById('helpDialog');
    if (!dlg.open) dlg.showModal();
}

export async function restartGame(inputEl, counterEl, resultsDivEl) {
    try { 
        await postRestart(); 
    } catch (e) { 
        setMessage("Can't reach the game server. Check that it's running and try again."); 
        return; 
    }
    resultsDivEl.innerHTML = '<div class="empty" id="empty">No guesses yet. Pick any country to get your first clues.</div>';
    counterEl.textContent = '';
    finished = false;
    setFinished(false, hideSuggest);
    inputEl.value = '';
    updateInputFlag('');
    setMessage('New game started. Good luck!', true);
    inputEl.focus();
}

export async function initGame() {
    try {
        const data = await fetchCountriesData();
        console.log("Data loaded successfully:", data);
        
        let rawCountries = data;
        if (data && typeof data === 'object') {
            rawCountries = data.countries || data.data || data.list || data;
        }
        
        let rawList = [];
        if (Array.isArray(rawCountries)) {
            rawList = rawCountries;
        } else if (rawCountries && typeof rawCountries === 'object') {
            rawList = Object.entries(rawCountries).map(([name, details]) => ({
                name: name,
                ...(typeof details === 'object' && details !== null ? details : {})
            }));
        }
        
        COUNTRIES.length = 0;
        COUNTRIES.push(...rawList);
        
        ALIASES.length = 0;
        if (Array.isArray(data.aliases)) {
            ALIASES.push(...data.aliases);
        }

        COUNTRIES.forEach(item => {
            let name = getCountryName(item);
            let code = getCountryCode(item);
            if (name && code) FLAG_MAP.set(norm(name), code);
        });
        
        if (Array.isArray(ALIASES)) {
            ALIASES.forEach(alias => {
                let name, code;
                if (Array.isArray(alias)) { name = alias[0]; code = alias[1]; }
                else if (typeof alias === 'object' && alias !== null) { name = alias.alias || alias.name; code = alias.code || alias.iso; }
                if (name && code) FLAG_MAP.set(norm(name), code);
            });
        }

        if (COUNTRIES.length === 0) {
            throw new Error("Countries list ended up empty after parsing.");
        }

        const picks = [...COUNTRIES].sort(() => Math.random() - 0.5).slice(0, 3);
        const trioEl = document.getElementById('flagTrio');
        if (trioEl) {
            trioEl.innerHTML = picks
                .map(item => {
                    let code = getCountryCode(item);
                    return code ? `<img src="${flagUrl(code, 160)}" alt="" onerror="this.style.display='none'">` : '';
                }).join('');
        }
            
    } catch (err) {
        console.error("Detailed error loading countries.json:", err);
        setMessage("Error loading game data. Check the console for details.");
    }
}