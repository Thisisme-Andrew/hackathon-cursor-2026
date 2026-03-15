/**
 * Shared auth utilities: getCurrentUser fetches /auth/me with JWT; logout clears token.
 */
const AUTH_TOKEN_KEY = "orion_token";

async function getCurrentUser() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        return null;
    }
    try {
        const res = await fetch("/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            return null;
        }
        return await res.json();
    } catch (_) {
        return null;
    }
}

function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.href = "/auth?mode=login&next=" + encodeURIComponent(window.location.pathname || "/dashboard");
}
