import { createListing } from "../api/listings.js";
import { renderUserHeader, getAuth } from "../header.js";
import { notify } from "../utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const { authToken, userProfile } = getAuth();

  if (!authToken || !userProfile) {
    window.location.href = "/html/auth/login.html";
    return;
  }

  renderUserHeader();
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
        notify("Fill in all required fields", "error");
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
        notify("Listing created successfully!", "success");
        window.location.href = "../../index.html";
      } catch (err) {
        console.error(err);
        notify("Failed to create listing", "error");
      }
    });
}
