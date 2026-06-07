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

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;

  return `${minutes}m`;
}

function highestBid(bids) {
  if (!bids || bids.length === 0) return 0;
  return Math.max(...bids.map((bid) => bid.amount));
}

function hasEnded(listing) {
  return new Date(listing.endsAt).getTime() < Date.now();
}

function escapeHtml(value) {
  if (!value) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleString();
}

function card(listing) {
  const image =
    listing.media?.[0]?.url || "https://via.placeholder.com/400x250";

  const imageAlt =
    listing.media?.[0]?.alt || listing.title || "Auction listing image";

  const authToken = localStorage.getItem("authToken");
  const ended = hasEnded(listing);
  const currentBid = highestBid(listing.bids);
  const totalBids = listing.bids?.length || 0;
  const minimumBid = currentBid + 1;
  const seller = listing.seller?.name || "Unknown";
  const bidDisabled = authToken && !ended ? "" : "disabled";

  return `
    <article class="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <img
        src="${escapeHtml(image)}"
        alt="${escapeHtml(imageAlt)}"
        class="h-48 w-full object-cover"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/400x250'"
      />

      <div class="p-4">
        <div class="mb-3 text-sm text-gray-600">
          <p>
            <span class="font-semibold text-gray-800">Seller:</span>
            ${escapeHtml(seller)}
          </p>

          <p class="mt-1">
            <span class="font-semibold text-gray-800">Posted:</span>
            ${formatDate(listing.created)}
          </p>
        </div>

        <h3 class="text-xl font-bold text-gray-950">
          ${escapeHtml(listing.title || "Untitled listing")}
        </h3>

        <p class="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
          ${escapeHtml(listing.description || "No description provided.")}
        </p>

        <div class="mt-4 grid gap-2 border-t border-gray-100 pt-4 text-sm">
          <p>
            <span class="font-semibold text-gray-800">Current Bid:</span>
            ${currentBid} credits
          </p>

          <p>
            <span class="font-semibold text-gray-800">Time Left:</span>
            ${timeLeft(listing.endsAt)}
          </p>

          <p>
            <span class="font-semibold text-gray-800">Total bids:</span>
            ${totalBids}
          </p>

          <p>
            <span class="font-semibold text-gray-800">Status:</span>
            <span class="${
              ended ? "text-red-700" : "text-green-700"
            } font-semibold">
              ${ended ? "Ended" : "Active"}
            </span>
          </p>
        </div>

        <a
          href="./html/listings/details.html?id=${listing.id}"
          class="mt-4 inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-700 hover:text-blue-700"
        >
          View Details
        </a>

        <div class="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <label class="sr-only" for="bid-${listing.id}">
            Bid amount
          </label>

          <input
            id="bid-${listing.id}"
            type="number"
            min="${minimumBid}"
            placeholder="${ended ? "Ended" : `Min ${minimumBid}`}"
            ${bidDisabled}
            class="min-h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-700 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          />

          <button
            onclick="bid('${listing.id}')"
            ${bidDisabled}
            class="min-h-10 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Bid
          </button>
        </div>

        ${
          !authToken
            ? `<p class="mt-3 text-xs text-gray-500">Log in to place a bid.</p>`
            : ""
        }
      </div>
    </article>
  `;
}

function render(data) {
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = data.slice(start, start + PAGE_SIZE);

  if (!pageItems.length) {
    grid.innerHTML = `
      <div class="col-span-full rounded-md border border-dashed border-gray-300 bg-white p-10 text-center">
        <h3 class="text-2xl font-bold text-gray-950">
          No auctions found
        </h3>

        <p class="mt-2 text-gray-500">
          Try changing your search, selected tag, or active-only filter.
        </p>
      </div>
    `;

    renderPagination(data.length);
    return;
  }

  grid.innerHTML = pageItems.map(card).join("");
  renderPagination(data.length);
}

function renderPagination(total) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  const pages = Math.ceil(total / PAGE_SIZE);

  if (pages <= 1) return;

  for (let i = 1; i <= pages; i++) {
    const button = document.createElement("button");

    button.textContent = i;
    button.className =
      "min-h-10 min-w-10 rounded-md border px-3 text-sm font-semibold " +
      (i === currentPage
        ? "border-blue-700 bg-blue-700 text-white"
        : "border-gray-300 bg-white text-gray-700 hover:border-blue-700 hover:text-blue-700");

    button.onclick = () => {
      currentPage = i;
      applySearch();
      document.getElementById("auctions")?.scrollIntoView({
        behavior: "smooth",
      });
    };

    container.appendChild(button);
  }
}

function loadTags(data) {
  const tags = new Set();

  data.forEach((listing) => {
    (listing.tags || []).forEach((tag) => {
      if (tag) tags.add(tag);
    });
  });

  tagFilter.innerHTML = `<option value="">All Tags</option>`;

  tags.forEach((tag) => {
    tagFilter.innerHTML += `<option value="${escapeHtml(tag)}">${escapeHtml(
      tag,
    )}</option>`;
  });
}

function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  const tag = tagFilter.value;

  let results = [...allListings];

  if (showActiveOnly) {
    results = results.filter((listing) => !hasEnded(listing));
  }

  if (query) {
    results = results.filter((listing) => {
      const title = listing.title || "";
      const description = listing.description || "";

      return (
        title.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }

  if (tag) {
    results = results.filter((listing) => (listing.tags || []).includes(tag));
  }

  results.sort((a, b) => {
    const aEnded = hasEnded(a);
    const bEnded = hasEnded(b);

    if (aEnded !== bEnded) return aEnded - bEnded;

    return new Date(a.endsAt) - new Date(b.endsAt);
  });

  render(results);
}

searchBtn.onclick = () => {
  currentPage = 1;
  applySearch();
};

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    currentPage = 1;
    applySearch();
  }
});

tagFilter.addEventListener("change", () => {
  currentPage = 1;
  applySearch();
});

activeBtn.onclick = () => {
  showActiveOnly = !showActiveOnly;
  currentPage = 1;

  activeBtn.textContent = showActiveOnly ? "Show All" : "Active Only";

  activeBtn.classList.toggle("bg-blue-700", showActiveOnly);
  activeBtn.classList.toggle("text-white", showActiveOnly);
  activeBtn.classList.toggle("border-blue-700", showActiveOnly);

  applySearch();
};

window.bid = async function (id) {
  const authToken = localStorage.getItem("authToken");

  if (!authToken) {
    notify("Login required.", "error");
    return;
  }

  const input = document.getElementById(`bid-${id}`);
  const amount = Number(input.value);
  const listing = allListings.find((item) => item.id === id);
  const minimumBid = highestBid(listing?.bids) + 1;

  if (!amount || amount < minimumBid) {
    notify(`Bid must be at least ${minimumBid} credits.`, "error");
    return;
  }

  const ok = await placeBid(id, amount, authToken);

  if (ok) {
    notify("Bid placed!", "success");
    await init();
  } else {
    notify("Bid failed.", "error");
  }
};

async function init() {
  await initHeader();

  grid.innerHTML = `
    <div class="col-span-full grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${Array.from({ length: 6 })
        .map(
          () => `
            <div class="h-[520px] animate-pulse rounded-md border border-gray-200 bg-white shadow-sm"></div>
          `,
        )
        .join("")}
    </div>
  `;

  allListings = await getAllListings();

  loadTags(allListings);
  applySearch();
}

init();