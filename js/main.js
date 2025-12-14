import { getAllListings, placeBid } from "./api/listings.js";
import { initHeader } from "./header.js";
import { notify } from "./utils.js";

let allListings = [];
let showActiveOnly = false;
let currentPage = 1;
const PAGE_SIZE = 20;

const grid = document.getElementById("auctionGrid");
const searchInput = document.getElementById("searchInput");
const tagFilter = document.getElementById("tagFilter");
const searchBtn = document.getElementById("searchBtn");
const activeBtn = document.getElementById("activeBtn");

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

function hasEnded(l) {
  return new Date(l.endsAt).getTime() < Date.now();
}

// Auction Cards
function card(l) {
  const img = l.media?.[0]?.url || "https://via.placeholder.com/400x250";
  const authToken = localStorage.getItem("authToken");
  const bidDisabled = authToken ? "" : "disabled";

  return `
    <div class="bg-white rounded-[15px] shadow p-5 flex flex-col overflow-hidden">
      <img src="${img}" class="w-full h-48 object-cover rounded-[15px]">
      <div class="label-text mt-3 text-gray-600">
        <p>Seller: <b>${l.seller?.name || "Unknown"}</b></p>
        <p>Posted: ${new Date(l.created).toLocaleString()}</p>
      </div>
      <h3 class="h3 mt-3 overflow-hidden wrap-break-words line-clamp-2">${l.title || ""}</h3>
      <p class="body-text mt-2">${l.description || ""}</p>
      <div class="label-text mt-3">
        <p>Current Bid: <b>${highestBid(l.bids)}</b></p>
        <p>Time Left: <b>${timeLeft(l.endsAt)}</b></p>
      </div>
      <a href="html/listings/details.html?id=${l.id}" class="block bg-[#2482ED] text-white rounded-[15px] py-2 mt-4 text-center hover:opacity-90 label-text">View Details</a>
      <p class="label-text mt-3">Total bids: <b>${l.bids?.length || 0}</b></p>
      <div class="flex gap-2 mt-2">
        <input type="number" id="bid-${l.id}" class="grow rounded-[15px] border px-3 py-2 label-text" style="background:#D9D9D9" placeholder="Amount" ${bidDisabled}>
        <button onclick="bid('${l.id}')" class="bg-white border border-black rounded px-4 py-2 hover:bg-gray-100 label-text" ${bidDisabled}> Bid </button>
      </div>
    </div>
  `;
}

function render(data) {
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = data.slice(start, start + PAGE_SIZE);
  grid.innerHTML = pageItems.map(card).join("");
  renderPagination(data.length);
}

function renderPagination(total) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return;
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "px-3 py-1 border rounded " + (i === currentPage ? "bg-[#2482ED] text-white" : "bg-white");
    btn.onclick = () => {
      currentPage = i;
      applySearch();
    };
    container.appendChild(btn);
  }
}

// Tags
function loadTags(data) {
  const set = new Set();
  data.forEach(l => (l.tags || []).forEach(t => set.add(t)));
  tagFilter.innerHTML = `<option value="">All Tags</option>`;
  set.forEach(t => {
    tagFilter.innerHTML += `<option value="${t}">${t}</option>`;
  });
}

// Search
function applySearch() {
  const q = searchInput.value.trim().toLowerCase();
  const tag = tagFilter.value;
  let results = allListings;

  if (showActiveOnly) results = results.filter(l => !hasEnded(l));
  if (q) results = results.filter(l => (l.title || "").toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q));
  if (tag) results = results.filter(l => (l.tags || []).includes(tag));

  results.sort((a, b) => hasEnded(a) - hasEnded(b));
  render(results);
}

searchBtn.onclick = applySearch;
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") applySearch(); });
activeBtn.onclick = () => {
  showActiveOnly = !showActiveOnly;
  activeBtn.textContent = showActiveOnly ? "Show All" : "Active Only";
  applySearch();
};

// Bidding
window.bid = async function(id) {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) { notify("Login required.", "error"); return; }
  const amount = Number(document.getElementById(`bid-${id}`).value);
  if (!amount || amount <= 0) { notify("Invalid amount."); return; }
  const ok = await placeBid(id, amount, authToken);
  if (ok) {
    notify("Bid placed!", "success");
    await init(); 
  } else {
    notify("Bid failed.", "error");
  }
};

// Load listings
async function init() {
  await initHeader(); 
  allListings = await getAllListings();
  loadTags(allListings);
  applySearch();
}

init();
