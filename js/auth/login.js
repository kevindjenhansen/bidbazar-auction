import { NOROFF_API_URL } from "./config.js";
import { notify } from "../utils.js";

const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        notify("Please enter email and password.", "error");
        return;
    }

    try {
        const res = await fetch(`${NOROFF_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.errors?.[0]?.message || "Login failed");

        localStorage.setItem("authToken", data.data.accessToken);

        localStorage.setItem(
            "userProfile",
            JSON.stringify({
                name: data.data.name,
                email: data.data.email,
                avatar: data.data.avatar 
            })
        );

        notify("Login successful!", "success");

        window.location.href = "../../index.html";

    } catch (err) {
        notify(err.message, "error");
    }
});
