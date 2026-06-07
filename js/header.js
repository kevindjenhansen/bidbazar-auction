import { NOROFF_API_URL, NOROFF_API_KEY } from "./auth/config.js";

export function getAuth() {
  return {
    authToken: localStorage.getItem("authToken"),
    userProfile: JSON.parse(localStorage.getItem("userProfile") || "null"),
  };
}

function getBasePath() {
  return location.hostname.includes("github.io") ? "/bidbazar-auction/" : "./";
}

export async function updateHeaderCredits() {
  const { authToken, userProfile } = getAuth();

  if (!authToken || !userProfile) return;

  try {
    const res = await fetch(
      `${NOROFF_API_URL}/auction/profiles/${userProfile.name}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Noroff-API-Key": NOROFF_API_KEY,
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!res.ok) throw new Error(res.status);

    const profile = (await res.json()).data;

    localStorage.setItem("userProfile", JSON.stringify(profile));

    const creditsEl = document.getElementById("headerCredits");

    if (creditsEl) {
      creditsEl.textContent = profile.credits ?? 0;
    }
  } catch (err) {
    console.error("Error updating header credits:", err);
  }
}

export async function renderUserHeader() {
  const { authToken, userProfile } = getAuth();
  const header = document.getElementById("userHeader");

  if (!header) return;

  const repoBase = getBasePath();

  if (authToken && userProfile) {
    header.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="hidden rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 sm:block">
          <span class="text-gray-500">Credits</span>
          <span id="headerCredits" class="ml-1 font-bold text-blue-700">
            ${userProfile.credits ?? 0}
          </span>
        </div>

        <a
          href="${repoBase}html/profile/profile.html"
          class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-blue-700 hover:text-blue-700"
        >
          ${userProfile.name}
        </a>

        <button
          id="logoutBtn"
          type="button"
          class="rounded-md bg-gray-950 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          style="min-width: 96px; padding: 10px 22px;"
        >
          Logout
        </button>
      </div>
    `;

    document.getElementById("logoutBtn").onclick = () => {
      localStorage.clear();
      window.location.href = `${repoBase}index.html`;
    };
  } else {
    header.innerHTML = `
      <a
        href="${repoBase}html/auth/login.html"
        class="inline-flex items-center justify-center rounded-md bg-blue-700 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
        style="min-width: 104px; padding: 10px 24px; display: inline-flex;"
      >
        Login
      </a>
    `;
  }
}

export async function initHeader() {
  await renderUserHeader();
  await updateHeaderCredits();

  setInterval(updateHeaderCredits, 30000);
}