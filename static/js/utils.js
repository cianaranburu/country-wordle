export const FLAG_MAP = new Map();

export function norm(s) {
    return String(s).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/-/g, ' ')
        .replace(/\bst\b/g, 'saint')
        .replace(/^the\s+/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function flagCode(name) { return FLAG_MAP.get(norm(name)) || null; }
export function flagUrl(code, w) { return `https://flagcdn.com/w${w}/${code}.png`; }

export function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

export function flagImg(name, cls, w = 160) {
    const code = flagCode(name);
    if (!code) return `<span class="flag-fallback" aria-hidden="true">🌍</span>`;
    return `<img class="${cls}" src="${flagUrl(code, w)}" srcset="${flagUrl(code, w*2)} 2x" alt="Flag of ${esc(name)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;flag-fallback&quot; aria-hidden=&quot;true&quot;>🌍</span>'">`;
}

export function getCountryName(item) {
    if (Array.isArray(item)) return item[0];
    if (item && typeof item === 'object') return item.name || item.country;
    return '';
}

export function getCountryCode(item) {
    if (Array.isArray(item)) return item[1];
    if (item && typeof item === 'object') return item.code || item.iso || item.flag;
    return '';
}