import { app } from '/js/firebase.js'
import {
  getAuth,
  onAuthStateChanged,
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
 * Returns a CSS class based on how full the job is.
 * - If used capacity is 100%, return 'red'
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
    // Use repository to get all assignments, roles, and user assignments
    const [assignmentsMap, assignmentCapacityMap, assignmentUsageMap, assignmentRolesMap, userAssignmentMap] = await assignmentsRepository.getAssignments();
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;

    // Find all assignments the user is part of by looking for userId in userAssignmentMap
    const userAssignments = new Set();
    for (const assignmentId in userAssignmentMap) {
      const userAssignmentsForAssignment = userAssignmentMap[assignmentId];
      for (const userAssignmentId in userAssignmentsForAssignment) {
        const ua = userAssignmentsForAssignment[userAssignmentId];
        if (ua.userId === userId) {
          userAssignments.add(assignmentId);
        }
      }
    }

    const availableContainer = document.getElementById("available-jobs-container");
    const takenContainer = document.getElementById("taken-jobs-container");

    availableContainer.innerHTML = "";
    takenContainer.innerHTML = "";

    Object.entries(assignmentsMap).forEach(([assignmentId, assignmentData]) => {
      const { name, timeStart, timeEnd } = assignmentData;
      const totalCap = assignmentCapacityMap[assignmentId] || 0;
      const usedCount = assignmentUsageMap[assignmentId] || 0;
      const capacityClass = getCapacityClass(usedCount, totalCap);

      const card = document.createElement("div");
      card.classList.add("job-card", capacityClass);

      const startDate = timeStart.toDate().toLocaleString([], {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const endDate = timeEnd.toDate().toLocaleString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      

      card.innerHTML = `
        <div class="job-header">
          <div class="job-info">
            <div class="job-title-line">
              <i class="fas fa-ship"></i>
              <h2 class="job-title">${name || "No name"}</h2>
            </div>
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


      card.querySelector(".details-btn").addEventListener("click", () => {
        window.location.href = `/?page=assignment&id=${assignmentId}`;
      });

      // Show in appropriate column
      if (userAssignments.has(assignmentId)) {
        console.log("Rendering assignment:", assignmentId, {
          assignedToUser: userAssignments.has(assignmentId)
        });
        takenContainer.appendChild(card);
      } else {
        availableContainer.appendChild(card);
      }
    });

  } catch (error) {
    console.error("Error loading assignments:", error);
  }
}
