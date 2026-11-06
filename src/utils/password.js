const enc = new TextEncoder();
const toHex = (buf) =>
    [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) =>
    new Uint8Array(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));

const derive = async (password, salt) => {
    const key = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
    );
    return crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
        key, 256,
    );
};

export async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const bits = await derive(password, salt);
    return `${toHex(salt)}:${toHex(bits)}`;
}

export async function verifyPassword(password, stored) {
    const [saltHex, hashHex] = stored.split(':');
    const bits = await derive(password, fromHex(saltHex));
    const computed = toHex(bits);
    if (computed.length !== hashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
        diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i);
    }
    return diff === 0;
}