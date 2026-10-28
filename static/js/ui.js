import { flagCode, flagUrl, esc, flagImg, getCountryName } from './utils.js';

const msg = document.getElementById('message');
const resultsDiv = document.getElementById('results');
const counter = document.getElementById('counter');
const inputFlag = document.getElementById('inputFlag');
const suggestEl = document.getElementById('suggest');
const input = document.getElementById('guessInput');
const guessBtn = document.getElementById('guessBtn');

export function setMessage(html, info = false) {
    msg.className = info ? 'info' : '';
    msg.innerHTML = html;
}

export function setFinished(v, hideSuggestCallback) {
    input.disabled = v;
    guessBtn.disabled = v;
    document.getElementById('restartBtn').classList.toggle('pulse', v);
    if (v) hideSuggestCallback();
}

export function clearEmpty() { 
    const e = document.getElementById('empty'); 
    if (e) e.remove(); 
}

export function prependCard(html) {
    clearEmpty();
    resultsDiv.insertAdjacentHTML('afterbegin', html);
}

export function updateInputFlag(name) {
    const code = name ? flagCode(name) : null;
    inputFlag.innerHTML = code
        ? `<img src="${flagUrl(code, 80)}" alt="" onerror="this.parentNode.textContent='🌍'">`
        : '🌍';
}

function hintState(text) {
    const t = String(text ?? '').toLowerCase();
    if (/(✅|✔|🟩|match|correct|same|exact)/.test(t)) return 'match';
    if (/(⬆|↑|🔼|📈|higher|more|bigger|larger|greater|above)/.test(t)) return 'high';
    if (/(⬇|↓|🔽|📉|lower|less|smaller|fewer|below)/.test(t)) return 'low';
    if (/(❌|🟥|wrong|incorrect|different|no\b)/.test(t)) return 'miss';
    return '';
}

const ICONS = { match: '✓', high: '▲', low: '▼', miss: '✕', '': '' };

export function tile(label, value) {
    const state = hintState(value);
    const clean = String(value ?? '').replace(/^[\s↑↓⬆⬇️✅❌✔✓✕🔼🔽📈📉🟩🟨🟥]+/u, '');
    const icon = ICONS[state] ? `<span class="tile-ico" aria-hidden="true">${ICONS[state]}</span>` : '';
    return `<div class="tile ${state}"><span class="tile-label">${esc(label)}</span><span class="tile-value">${icon}<span>${esc(clean || value)}</span></span></div>`;
}

export function renderSuggestList(options, activeIdx) {
    suggestEl.innerHTML = options.map((item, i) => {
        const name = getCountryName(item);
        const code = flagCode(name);
        return `<li role="option" data-name="${esc(name)}" aria-selected="${i === activeIdx}">${code ? `<img src="${flagUrl(code, 40)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}${esc(name)}</li>`;
    }).join('');
    suggestEl.hidden = options.length === 0;
    input.setAttribute('aria-expanded', String(options.length > 0));
}

export function hideSuggest() {
    suggestEl.hidden = true;
    input.setAttribute('aria-expanded', 'false');
}

export function triggerConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#ff7a3d', '#35d6a0', '#ffc83d', '#59b4ff', '#ff6b7a', '#ffffff'];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        const size = 6 + Math.random() * 8;
        Object.assign(p.style, {
            position: 'fixed', top: '-12px', left: Math.random() * 100 + 'vw',
            width: size + 'px', height: size * 0.6 + 'px',
            background: colors[i % colors.length], borderRadius: '2px',
            zIndex: 50, pointerEvents: 'none'
        });
        document.body.appendChild(p);
        const drift = (Math.random() - 0.5) * 240;
        const anim = p.animate([
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${drift}px, 105vh) rotate(${Math.random() * 900}deg)`, opacity: 1 }
        ], { duration: 1800 + Math.random() * 1600, easing: 'cubic-bezier(.2,.6,.4,1)', delay: Math.random() * 350 });
        anim.onfinish = () => p.remove();
    }
}