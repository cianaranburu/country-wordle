export async function fetchCountriesData() {
    const res = await fetch('/countries.json');
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status} ${res.statusText}`);
    }
    return await res.json();
}

export async function sendGuess(val) {
    const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: val })
    });
    return await res.json();
}

export async function fetchHelp() {
    const res = await fetch('/api/help');
    return await res.json();
}

export async function postRestart() {
    await fetch('/api/restart', { method: 'POST' });
}