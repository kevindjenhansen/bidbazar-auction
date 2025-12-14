import { NOROFF_API_URL, NOROFF_API_KEY } from "./auth/config.js";

export function getAuth() {
  return {
    authToken: localStorage.getItem("authToken"),
    userProfile: JSON.parse(localStorage.getItem("userProfile") || "null"),
  };
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
      }
    );
    if (!res.ok) throw new Error(res.status);
    const profile = (await res.json()).data;
    localStorage.setItem("userProfile", JSON.stringify(profile));

    const creditsEl = document.getElementById("headerCredits");
    if (creditsEl) creditsEl.textContent = profile.credits ?? 0;
  } catch (err) {
    console.error("Error updating header credits:", err);
  }
}

export async function renderUserHeader() {
  const { authToken, userProfile } = getAuth();
  const header = document.getElementById("userHeader");
  if (!header) return;

  const pathPrefix = (() => {
    const depth = window.location.pathname.split("/").length - 2;
    return "../".repeat(depth);
  })();

  if (authToken && userProfile) {
    header.innerHTML = `
      <div class="flex items-center gap-3 px-4 py-2 rounded-[15px] border border-[#003BFF]" style="background:rgba(70,166,255,0.4)">
        <i class="fa-solid fa-coins text-xl"></i>
        <div>
          <div class="label-text">Credits</div>
          <div class="font-bold text-[#2482ED]" id="headerCredits">${
            userProfile.credits ?? 0
          }</div>
        </div>
      </div>
      <a href="${pathPrefix}html/profile/profile.html" class="flex items-center gap-2 hover:opacity-80">
        <img src="${
          userProfile.avatar?.url ||
          `${pathPrefix}assets/logo/bidbazar-logo.png`
        }" class="w-10 h-10 rounded-full border object-cover" />
        <span class="label-text font-semibold hidden sm:block">${
          userProfile.name
        }</span>
      </a>
      <button id="logoutBtn" class="bg-[#2482ED] text-white px-4 py-2 rounded-[15px] hover:opacity-90">Logout</button>
    `;

    document.getElementById("logoutBtn").onclick = () => {
      localStorage.clear();
      window.location.href = `${pathPrefix}index.html`;
    };
  } else {
    header.innerHTML = `
      <a href="${pathPrefix}html/auth/login.html" class="bg-[#2482ED] border border-black text-white px-5 py-2 rounded-[15px] hover:opacity-90">Login</a>
    `;
  }
}

// Global init
export async function initHeader() {
  await renderUserHeader();
  await updateHeaderCredits();
  setInterval(updateHeaderCredits, 30000);
}
