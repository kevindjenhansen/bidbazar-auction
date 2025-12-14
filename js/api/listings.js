import { NOROFF_API_URL, NOROFF_API_KEY } from "../auth/config.js";

const BASE = `${NOROFF_API_URL}/auction/listings`;
const headers = {
  "Content-Type": "application/json",
  "X-Noroff-API-Key": NOROFF_API_KEY,
};

// Get all listings
export async function getAllListings() {
  try {
    const res = await fetch(
      `${BASE}?_seller=true&_bids=true&limit=100&sort=created&sortOrder=desc`,
      { headers }
    );
    if (!res.ok) throw new Error(res.status);
    return (await res.json()).data;
  } catch (err) {
    console.error("getAllListings error", err);
    return [];
  }
}

// Place bid
export async function placeBid(listingId, amount, token) {
  try {
    const res = await fetch(`${BASE}/${listingId}/bids`, {
      method: "POST",
      headers: { ...headers, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error(res.status);
    return (await res.json()).data;
  } catch (err) {
    console.error("placeBid error", err);
    return null;
  }
}

// Create a new listing
export async function createListing(data, token) {
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { ...headers, Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(
        err.errors?.[0]?.message || `Failed to create listing (${res.status})`
      );
    }

    return await res.json();
  } catch (err) {
    console.error("createListing error:", err);
    throw err;
  }
}
