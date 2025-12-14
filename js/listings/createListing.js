// /js/listings/createListing.js
import { createListing } from "../api/listings.js";
import { renderUserHeader, getAuth } from "./js/header.js";

document.addEventListener("DOMContentLoaded", () => {
  const { authToken, userProfile } = getAuth();

  if (!authToken || !userProfile) {
    window.location.href = "/html/auth/login.html";
    return;
  }

  renderUserHeader(); // update header dynamically
  bindActions(authToken);
});

function bindActions(authToken) {
  document.getElementById("cancelBtn")?.addEventListener("click", () => {
    window.location.href = "/index.html";
  });

  document
    .getElementById("createListingBtn")
    ?.addEventListener("click", async () => {
      const title = document.getElementById("title").value.trim();
      const description = document.getElementById("description").value.trim();
      const tags = document
        .getElementById("tags")
        .value.split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const startingPrice = Number(document.getElementById("startPrice").value);
      const endsAt = document.getElementById("endDate").value;
      const imageUrl = document.getElementById("imageUrl").value.trim();

      if (!title || !description || !startingPrice || !endsAt) {
        alert("Fill in all required fields");
        return;
      }

      const data = {
        title,
        description,
        tags,
        startingPrice,
        endsAt,
        media: imageUrl ? [{ url: imageUrl, alt: title }] : [],
      };

      try {
        await createListing(data, authToken);
        alert("Listing created successfully!");
        window.location.href = "/index.html";
      } catch (err) {
        console.error(err);
        alert("Failed to create listing");
      }
    });
}
