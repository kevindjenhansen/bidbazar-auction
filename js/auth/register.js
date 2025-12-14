import { NOROFF_API_URL } from "./config.js";
import { notify } from "../utils.js";

const registerBtn = document.getElementById("registerBtn");

registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !email || !password) {
        notify("Please fill in all fields.", "error");
        return;
    }

    if (!email.endsWith("@stud.noroff.no")) {
        notify("Email must be a valid stud.noroff.no address.", "error");
        return;
    }

    if (password.length < 8) {
        notify("Password must be at least 8 characters.", "error");
        return;
    }

    const body = { name: username, email, password };

    try {
        const res = await fetch(`${NOROFF_API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.errors?.[0]?.message || `Failed to register (${res.status})`);
        }

        notify("Account created successfully! You can now log in.", "success");
        window.location.href = "../../login.html";

    } catch (error) {
        console.error("Registration error:", error);
        notify(error.message, "error");
    }
});
