import { renderUserHeader, getAuth } from "../header.js";
import { NOROFF_API_URL, NOROFF_API_KEY } from "../auth/config.js";
import { notify } from "../utils.js";

const { authToken, userProfile } = getAuth();

const bannerImg = document.getElementById("bannerImg");
const avatarImg = document.getElementById("avatarImg");
const usernameEl = document.getElementById("username");
const emailEl = document.getElementById("email");
const bioEl = document.getElementById("bio");
const creditsEl = document.getElementById("credits");

const editBtn = document.getElementById("editProfileBtn");
const modal = document.getElementById("editProfileModal");
const cancelEdit = document.getElementById("cancelEdit");
const confirmEdit = document.getElementById("confirmEdit");
const editAvatar = document.getElementById("editAvatar");
const editBanner = document.getElementById("editBanner");
const editBio = document.getElementById("editBio");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContent = document.getElementById("tabContent");

const editListingModal = document.getElementById("editListingModal");
const editListingTitle = document.getElementById("editListingTitle");
const editListingDescription = document.getElementById("editListingDescription");
const editListingMedia = document.getElementById("editListingMedia");
const editListingTags = document.getElementById("editListingTags");
const editListingEndsAt = document.getElementById("editListingEndsAt");
const cancelEditListing = document.getElementById("cancelEditListing");
const confirmEditListing = document.getElementById("confirmEditListing");
const deleteListingBtn = document.getElementById("deleteListingBtn");

let currentEditingListing = null;

function timeLeft(date) {
  const end = new Date(date).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function highestBid(bids) {
  if (!bids || bids.length === 0) return 0;
  return Math.max(...bids.map(b => b.amount));
}

function updateUserCredits(credits) {
  creditsEl.textContent = credits ?? 0;
  renderUserHeader();
}

// Fetch profile
async function fetchProfile() {
  if (!authToken || !userProfile) return null;
  try {
    const res = await fetch(`${NOROFF_API_URL}/auction/profiles/${userProfile.name}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": NOROFF_API_KEY,
        Authorization: `Bearer ${authToken}`
      }
    });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error("Error fetching profile:", err);
    notify("Failed to fetch profile.", "error");
    return null;
  }
}

// Render profile
function renderProfile(profile) {
  if (!profile) return;
  bannerImg.src = profile.banner?.url || "https://via.placeholder.com/1500x500";
  avatarImg.src = profile.avatar?.url || "https://via.placeholder.com/150";
  usernameEl.textContent = profile.name || "Username";
  emailEl.textContent = profile.email || "user@example.com";
  bioEl.textContent = profile.bio || "This is the user bio.";
  updateUserCredits(profile.credits);

  editAvatar.value = profile.avatar?.url || "";
  editBanner.value = profile.banner?.url || "";
  editBio.value = profile.bio || "";
}

// Edit profile
editBtn.addEventListener("click", () => modal.classList.remove("hidden"));
cancelEdit.addEventListener("click", () => modal.classList.add("hidden"));

confirmEdit.addEventListener("click", async () => {
  if (!authToken || !userProfile) return;

  const updatedData = {
    avatar: { url: editAvatar.value, alt: "" },
    banner: { url: editBanner.value, alt: "" },
    bio: editBio.value
  };

  try {
    const res = await fetch(`${NOROFF_API_URL}/auction/profiles/${userProfile.name}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": NOROFF_API_KEY,
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(updatedData)
    });
    if (!res.ok) throw new Error(res.status);

    const updatedProfile = (await res.json()).data;
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
    renderProfile(updatedProfile);
    modal.classList.add("hidden");
    notify("Profile updated successfully!", "success");
  } catch (err) {
    console.error(err);
    notify("Failed to update profile. Check image URLs.", "error");
  }
});

// Fetch user data
async function fetchUserData(type) {
  if (!authToken || !userProfile) return [];
  try {
    const query = type === "bids" ? "?_listings=true" : "";
    const res = await fetch(`${NOROFF_API_URL}/auction/profiles/${userProfile.name}/${type}${query}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": NOROFF_API_KEY,
        Authorization: `Bearer ${authToken}`
      }
    });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error(`Error fetching ${type}:`, err);
    notify(`Failed to fetch ${type}.`, "error");
    return [];
  }
}

// Render listings
function renderCards(items, type) {
  tabContent.innerHTML = items.map(item => {
    let img = "https://via.placeholder.com/400x250";
    let title = "";
    let description = "";
    let endsAt = new Date().toISOString();
    let bids = [];

    if (type === "bids") {
      const listing = item.listing;
      if (listing) {
        img = listing.media?.[0]?.url || img;
        title = listing.title;
        description = listing.description;
        endsAt = listing.endsAt;
        bids = listing.bids;
      }
    } else {
      img = item.media?.[0]?.url || img;
      title = item.title;
      description = item.description;
      endsAt = item.endsAt;
      bids = item.bids;
    }

    return `
      <div class="bg-white rounded-[15px] shadow p-5 flex flex-col overflow-hidden">
        <img src="${img}" class="w-full h-48 object-cover rounded-[15px]">
        <div class="label-text mt-3 text-gray-600">
          <p>Posted: <b>${new Date(item.created).toLocaleString()}</b></p>
        </div>
        <h3 class="h3 mt-3 overflow-hidden wrap-break-words line-clamp-2">${title}</h3>
        <p class="body-text mt-2 line-clamp-3">${description}</p>
        <div class="label-text mt-3">
          <p>Current Bid: <b>${highestBid(bids)}</b></p>
          <p>Time Left: <b>${timeLeft(endsAt)}</b></p>
        </div>
        <p class="label-text mt-3">Total bids: <b>${bids?.length || 0}</b></p>
        ${type === "listings" ? `<button onclick="editListing('${item.id}')" class="bg-[#2482ED] text-white rounded-[15px] py-2 mt-3 hover:opacity-90">
          <i class="fa-solid fa-pen mr-2"></i> Edit Listing
        </button>` : ""}
      </div>
    `;
  }).join("");
}

// Tabs
tabButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const type = btn.dataset.tab;
    const data = await fetchUserData(type);
    renderCards(data, type);
  });
});

// Edit listing
window.editListing = async function(id) {
  const listings = await fetchUserData("listings");
  currentEditingListing = listings.find(l => l.id === id);
  if (!currentEditingListing) return notify("Listing not found.", "error");

  editListingTitle.value = currentEditingListing.title;
  editListingDescription.value = currentEditingListing.description;
  editListingMedia.value = (currentEditingListing.media || []).map(m => m.url).join(",");
  editListingTags.value = (currentEditingListing.tags || []).join(",");
  editListingEndsAt.value = new Date(currentEditingListing.endsAt).toISOString().slice(0,16);
  editListingModal.classList.remove("hidden");
};

cancelEditListing.addEventListener("click", () => editListingModal.classList.add("hidden"));

// Confirm edit listing
confirmEditListing.addEventListener("click", async () => {
  if (!currentEditingListing) return notify("No listing selected.", "error");

  const updated = {
    title: editListingTitle.value,
    description: editListingDescription.value,
    media: editListingMedia.value.split(",").map(u => ({ url: u.trim(), alt: "" })),
    tags: editListingTags.value.split(",").map(t => t.trim()),
    endsAt: new Date(editListingEndsAt.value).toISOString()
  };

  try {
    const res = await fetch(`${NOROFF_API_URL}/auction/listings/${currentEditingListing.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": NOROFF_API_KEY,
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(updated)
    });
    if (!res.ok) throw new Error(res.status);
    editListingModal.classList.add("hidden");
    tabButtons[0].click();
    notify("Listing updated successfully!", "success");
  } catch(err) {
    console.error(err);
    notify("Failed to update listing.", "error");
  }
});

// Delete listing
deleteListingBtn.addEventListener("click", async () => {
  if (!currentEditingListing) return notify("No listing selected.", "error");
  if (!confirm("Are you sure you want to delete this listing?")) return;

  try {
    const res = await fetch(`${NOROFF_API_URL}/auction/listings/${currentEditingListing.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": NOROFF_API_KEY,
        Authorization: `Bearer ${authToken}`
      }
    });
    if (!res.ok) throw new Error(res.status);
    editListingModal.classList.add("hidden");
    tabButtons[0].click();
    notify("Listing deleted successfully!", "success");
  } catch(err) {
    console.error(err);
    notify("Failed to delete listing.", "error");
  }
});

// Init
async function init() {
  renderUserHeader();
  const profile = await fetchProfile();
  renderProfile(profile);
  tabButtons[0].click();
}

init();
