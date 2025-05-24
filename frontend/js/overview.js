import { app } from '/js/firebase.js';
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";


import { AssignmentsRepository } from '/js/repository/assignmentsrepository.js';
import { UsersRepository } from '/js/repository/usersrepository.js';

const auth = getAuth(app);
const db = getFirestore(app);
const assignmentsRepository = new AssignmentsRepository(app);
const usersRepository = new UsersRepository(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const usernameElem = document.getElementById("username");
    if (usernameElem) {
      usernameElem.textContent = user.email;
    }

    // Show the button only if the user is a Manager
    try {
      const userData = await usersRepository.getUser(user.uid);
      const roles = await usersRepository.getUserRoles();
      const userRole = roles.find(r => r.id === userData.userRole);

      const isManager = userRole?.name === "Manager";
      const createButton = document.querySelector(".create-job-link");
      if (createButton) {
        createButton.style.display = isManager ? "block" : "none";
      }
    } catch (err) {
      console.error("Failed to check user role:", err);
    }

    await loadAssignments();
  } else {
    console.log("No user is signed in.");
  }
});

function getCapacityClass(used, total) {
  if (total === 0) return 'red';
  const ratio = used / total;
  if (ratio >= 1) return 'red';
  if (ratio >= 0.8) return 'yellow';
  return 'green';
}

async function loadAssignments() {
  try {
    // Use repository to get all assignments, roles, and user assignments
    const [assignmentsMap, assignmentCapacityMap, assignmentUsageMap, assignmentRolesMap, userAssignmentMap] = await assignmentsRepository.getAssignments();
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;

    const userAssignSnap = await getDocs(collection(db, "userAssignment"));
    const userAssignmentRoleIds = [];

    userAssignSnap.forEach(doc => {
      const data = doc.data();
      if (data.userId === userId && data.assignmentRoleId) {
        userAssignmentRoleIds.push(data.assignmentRoleId);
      }
    });

    const roleIdToAssignmentId = {};
    const rolesSnap = await getDocs(collection(db, "assignmentRole"));
    rolesSnap.forEach(roleDoc => {
      const { assignmentId } = roleDoc.data();
      roleIdToAssignmentId[roleDoc.id] = assignmentId;
    });


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
