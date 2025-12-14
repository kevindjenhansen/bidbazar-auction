import { NOROFF_API_URL, NOROFF_API_KEY } from "../auth/config.js";
import { getAuth, renderUserHeader } from "../header.js";
import { notify } from "../utils.js";

const { authToken, userProfile } = getAuth();

const listingContainer = document.getElementById("listingContainer");
const bidAmountInput = document.getElementById("bidAmount");
const placeBidBtn = document.getElementById("placeBidBtn");

let currentListing = null;

function highestBid(bids) {
  if (!bids || bids.length === 0) return 0;
  return Math.max(...bids.map(b => b.amount));
}
function timeLeft(date) {
  const end = new Date(date).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function getListingId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchListing(id) {
  try {
    const res = await fetch(`${NOROFF_API_URL}/auction/listings/${id}?_seller=true&_bids=true`, {
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": NOROFF_API_KEY,
        Authorization: authToken ? `Bearer ${authToken}` : ""
      }
    });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.error("Error fetching listing:", err);
    notify("Error fetching listing.", "error");
    return null;
  }
}

// Render listing
function renderListing(listingData) {
  if (!listingData || !listingData.data) return;
  const listing = listingData.data;
  currentListing = listing;

  const img = listing.media?.[0]?.url || "https://via.placeholder.com/400x250";
  const sellerName = listing.seller?.name || "Unknown";
  const currentBid = highestBid(listing.bids);
  const totalBids = listing.bids?.length || 0;
  const tags = listing.tags?.join(", ") || "None";

  // Bid history
  const bidHistoryHTML = listing.bids && listing.bids.length > 0
    ? listing.bids
        .slice()
        .sort((a, b) => b.amount - a.amount) 
        .map((b, idx) => {
          const isCurrent = idx === 0;
          const bgColor = isCurrent ? "bg-[#46A6FF]/50 border-[#2600FF]" : "bg-[#46A6FF]/20 border-[#2600FF]/50";
          return `
            <div class="flex justify-between py-1 px-2 border ${bgColor} rounded-[15px] mb-1">
              <span>${b.bidder?.name || "Unknown"}</span>
              <span>${new Date(b.created).toLocaleString()}</span>
              <span>${b.amount} <span class="text-[#2482ED]">Credits</span></span>
            </div>
          `;
        })
        .join("")
    : "<p class='body-text mt-2'>No bids yet.</p>";

  listingContainer.innerHTML = `
    <img src="${img}" class="w-full h-80 object-cover rounded-[15px]">

    <h1 class="h1 mt-4">${listing.title}</h1>
    <h2 class="h2 text-gray-600">${listing.description || ""}</h2>
    <p class="label-text mt-2">Seller: <b>${sellerName}</b></p>
    <p class="label-text">Tags: ${tags}</p>

    <div class="flex justify-between mt-4 text-center">
      <div class="flex flex-col flex-1">
        <span class="label-text">Current Bid</span>
        <span class="text-[#2482ED] text-xl font-bold">${currentBid} Credits</span>
      </div>
      <div class="flex flex-col flex-1">
        <span class="label-text">Total Bids</span>
        <span class="text-gray-800 text-xl font-bold">${totalBids}</span>
      </div>
      <div class="flex flex-col flex-1">
        <span class="label-text">Time Left</span>
        <span class="text-gray-800 text-xl font-bold">${timeLeft(listing.endsAt)}</span>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="h3 mb-2">Bid History</h3>
      <div id="bidHistory" class="max-h-64 overflow-y-auto">
        ${bidHistoryHTML}
      </div>
    </div>
  `;
}

// Place bid
placeBidBtn.addEventListener("click", async () => {
  const amount = Number(bidAmountInput.value);

  if (!amount || amount <= highestBid(currentListing.bids)) {
    return notify(`Enter a bid higher than current bid: ${highestBid(currentListing.bids)}`, "error");
  }

  if (!authToken) {
    return notify("You must be logged in to place a bid.", "error");
  }

  try {
    const res = await fetch(`${NOROFF_API_URL}/auction/listings/${currentListing.id}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": NOROFF_API_KEY,
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ amount })
    });

    if (!res.ok) throw new Error(res.status);

    const updatedListingData = await fetchListing(currentListing.id);
    renderListing(updatedListingData);

    bidAmountInput.value = "";
    notify("Bid placed successfully!", "success");
  } catch (err) {
    console.error("Error placing bid:", err);
    notify("Failed to place bid.", "error");
  }
});

async function init() {
  renderUserHeader();
  const listingId = getListingId();
  if (!listingId) return notify("No listing ID provided in URL.", "error");
  const listingData = await fetchListing(listingId);
  renderListing(listingData);
}

init();
