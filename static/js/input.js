import { norm, getCountryName } from './utils.js';
import { updateInputFlag, renderSuggestList, hideSuggest } from './ui.js';
import { COUNTRIES } from './game.js';

export function setupInputListeners(inputEl, suggestEl, submitCallback) {
    let activeIdx = -1;
    let options = [];

    inputEl.addEventListener('input', () => {
        const q = norm(inputEl.value);
        updateInputFlag(inputEl.value);
        if (!q) { options = []; hideSuggest(); return; }
        const starts = [], contains = [];
        COUNTRIES.forEach(item => {
            const name = getCountryName(item);
            const n = norm(name);
            if (n.startsWith(q)) starts.push(item);
            else if (n.includes(q)) contains.push(item);
        });
        options = [...starts, ...contains].slice(0, 6);
        if (options.length === 1 && norm(getCountryName(options[0])) === q) options = [];
        activeIdx = -1;
        renderSuggestList(options, activeIdx);
    });

    suggestEl.addEventListener('mousedown', e => {
        const li = e.target.closest('li');
        if (!li) return;
        e.preventDefault();
        inputEl.value = li.dataset.name;
        updateInputFlag(li.dataset.name);
        hideSuggest();
        inputEl.focus();
    });

    inputEl.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' && options.length) {
            e.preventDefault(); activeIdx = (activeIdx + 1) % options.length; renderSuggestList(options, activeIdx);
        } else if (e.key === 'ArrowUp' && options.length) {
            e.preventDefault(); activeIdx = (activeIdx - 1 + options.length) % options.length; renderSuggestList(options, activeIdx);
        } else if (e.key === 'Escape') {
            hideSuggest();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0 && options[activeIdx]) {
                inputEl.value = getCountryName(options[activeIdx]);
                updateInputFlag(inputEl.value);
            }
            submitCallback(inputEl.value);
        }
    });

    inputEl.addEventListener('blur', () => setTimeout(hideSuggest, 120));
}