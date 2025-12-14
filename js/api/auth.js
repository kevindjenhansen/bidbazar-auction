const API = "https://v2.api.noroff.dev";

export async function login(body) {
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) return null;

        const result = await res.json();
        return result.data;
    } catch {
        return null;
    }
}

export async function register(body) {
    try {
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) return null;

        const result = await res.json();
        return result.data;
    } catch {
        return null;
    }
}
