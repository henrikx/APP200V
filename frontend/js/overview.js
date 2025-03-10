import { app } from '/js/firebase.js'
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import { AssignmentsRepository } from '/js/repository/assignmentsrepository.js'

// initialize Firebase Authentication
const auth = getAuth(app);

const assignmentsRepository = new AssignmentsRepository(app);

// Listen for changes in authentication state and load assignments when the user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Show the user's email (if the element exists)
    const usernameElem = document.getElementById("username");
    if (usernameElem) {
      usernameElem.textContent = user.email;
    }
    await loadAssignments();
  } else {
    console.log("No user is signed in.");
  }
});

/**
 * Returns a CSS class based on how full the assignment is.
 * - If used capacity is 100% or more, return 'red'
 * - If 80% or more is used, return 'yellow'
 * - Otherwise, return 'green'
 */
function getCapacityClass(used, total) {
  if (total === 0) return 'red'; // If no capacity is set, treat as full
  const ratio = used / total;
  if (ratio >= 1) return 'red';
  if (ratio >= 0.8) return 'yellow';
  return 'green';
}

/**
 * Loads assignments, their roles, and user assignments from Firestore,
 * then builds and displays job cards showing capacity usage.
 */
async function loadAssignments() {
  try {
    // Fetch assignments, assignment roles, and user assignments concurrently
    const [assignmentsMap, assignmentCapacityMap, assignmentUsageMap] = await assignmentsRepository.getAssignments();

    // Get the container element where job cards will be added
    const container = document.getElementById("jobs-container");
    if (!container) {
      console.error("No #jobs-container element found.");
      return;
    }
    container.innerHTML = "";

    // For each assignment, build a job card with capacity info
    Object.entries(assignmentsMap).forEach(([assignmentId, assignmentData]) => {
      const { name, timeStart, timeEnd } = assignmentData;
      const totalCap = assignmentCapacityMap[assignmentId] || 0;
      const usedCount = assignmentUsageMap[assignmentId] || 0;
      const capacityClass = getCapacityClass(usedCount, totalCap);

      const card = document.createElement("div");
      card.classList.add("job-card", capacityClass);

      // Convert Firestore Timestamp objects to a local date string
      const startDate = timeStart.toDate().toLocaleDateString();
      const endDate = timeEnd.toDate().toLocaleDateString();

      card.innerHTML = `
        <div class="job-header">
          <div class="title-date">
            <h2 class="job-title">
              <i class="fas fa-ship"></i> ${name || "No name"}
            </h2>
            <p class="date">
              <i class="fas fa-calendar-alt"></i> ${startDate} - ${endDate}
            </p>
          </div>
          <div class="capacity">
            <i class="fas fa-users"></i>
            <span>Capacity: ${usedCount} / ${totalCap}</span>
          </div>
        </div>
        <button class="details-btn" data-assignment-id="${assignmentId}">Details</button>
      `;
  //adding click event listener so the user can get redirected to the
  //assignment page.
      const detailsButton = card.querySelector(".details-btn");
      detailsButton.addEventListener("click", () => {
        window.location.href = `/?page=assignment&id=${assignmentId}`;
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching Firestore data:", error);
  }
}
