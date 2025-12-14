// utils.js
export function notify(message, type = "success", duration = 3000) {
  const container = document.getElementById("notificationContainer");
  if (!container) return; 

  const notification = document.createElement("div");

  const baseClasses = "px-4 py-2 rounded-lg shadow text-white transform transition-all duration-300";
  const typeClasses = type === "success" ? "bg-[#00B30C]" : "bg-[#C40C0C]";
  
  notification.className = `${baseClasses} ${typeClasses} opacity-0 translate-x-20`;
  notification.textContent = message;

  container.appendChild(notification);

  // Animation
  setTimeout(() => {
    notification.classList.remove("opacity-0", "translate-x-20");
    notification.classList.add("opacity-100", "translate-x-0");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("opacity-100", "translate-x-0");
    notification.classList.add("opacity-0", "translate-x-20");
    setTimeout(() => container.removeChild(notification), 300);
  }, duration);
}
