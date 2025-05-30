import { app } from '/js/firebase.js';
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import { AssignmentsRepository } from '/js/repository/assignmentsrepository.js';
import { UsersRepository } from '/js/repository/usersrepository.js';

const auth = getAuth(app);
const assignmentsRepository = new AssignmentsRepository(app);
const usersRepository = new UsersRepository(app);
let isManager = false;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const usernameElem = document.getElementById("username");
    if (usernameElem) {
      usernameElem.textContent = user.email;
    }

    try {
      const userData = await usersRepository.getUser(user.uid);
      const roles = await usersRepository.getUserRoles();

      
      let userRole = null;
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].id === userData.userRole) {
          userRole = roles[i];
          break;
        }
      }

      isManager = userRole && userRole.name === "Manager";

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
    const [assignmentsMap, assignmentCapacityMap, assignmentUsageMap, assignmentRolesMap, userAssignmentMap] = await assignmentsRepository.getAssignments();
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const now = new Date();

    // This runs when the login status changes (like when someone  logs in).
    // if a user is logged in, it clears the shift list on the page
    // then gets all assignments and finds the ones that belong to that user.
    const userAssignments = new Set();
    for (const assignmentId in userAssignmentMap) {
      const userAssignmentForAssignment = userAssignmentMap[assignmentId];
      for (const userAssignmentId in userAssignmentForAssignment) {
        const ua = userAssignmentForAssignment[userAssignmentId];
        if (ua.userId === userId) {
          userAssignments.add(assignmentId);
        }
      }
    }

    const availableContainer = document.getElementById("available-jobs-container");
    const takenContainer = document.getElementById("taken-jobs-container");

    availableContainer.innerHTML = "";
    takenContainer.innerHTML = "";

    
    // Collect only assignments that are not finished yet
    const upcomingAssignments = [];
    for (const assignmentId in assignmentsMap) {
      const assignmentData = assignmentsMap[assignmentId];
      if (assignmentData.timeEnd.toDate() > now) {
        upcomingAssignments.push([assignmentId, assignmentData]);
      }
    }

    // Sort them by start time (earliest first)
    for (let i = 0; i < upcomingAssignments.length - 1; i++) {
      for (let j = i + 1; j < upcomingAssignments.length; j++) {
        const aStart = upcomingAssignments[i][1].timeStart.toDate();
        const bStart = upcomingAssignments[j][1].timeStart.toDate();

        if (aStart > bStart) {
          const temp = upcomingAssignments[i];
          upcomingAssignments[i] = upcomingAssignments[j];
          upcomingAssignments[j] = temp;
        }
      }
    }

    const sortedAssignments = upcomingAssignments;


    sortedAssignments.forEach(([assignmentId, assignmentData]) => {
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

      let deleteButtonHTML = "";
        if (isManager) {
        deleteButtonHTML = `
        <button class="delete-btn" title="Delete Job" data-assignment-id="${assignmentId}">
        <i class="fas fa-trash-alt"></i>
        </button>
        `;
}

      card.innerHTML = `
        ${deleteButtonHTML}
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

      if (isManager) {
        const deleteBtn = card.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
          const confirmed = confirm("Are you sure you want to delete this assignment?");
          if (!confirmed) return;

          try {
            await assignmentsRepository.deleteAssignment(assignmentId);

            card.remove();
          } catch (err) {
            console.error("Failed to delete assignment:", err);
            alert("Failed to delete assignment. See console for details.");
          }
        });
      }

      if (userAssignments.has(assignmentId)) {
        takenContainer.appendChild(card);
      } else {
        availableContainer.appendChild(card);
      }
    });
  } catch (error) {
    console.error("Error loading assignments:", error);
  }
}


async function deleteAssignmentCompletely(assignmentId) {
  const db = assignmentsRepository.db;

  const roleDocs = await getDocs(
    query(collection(db, "assignmentRole"), where("assignmentId", "==", assignmentId))
  );

  const batchDeletes = [];

  roleDocs.forEach((doc) => {
    batchDeletes.push(deleteDoc(doc.ref));
  });

  const userAssignments = await getDocs(collection(db, "userAssignment"));
    userAssignments.forEach((uaDoc) => {
    const data = uaDoc.data();
    if (data.assignmentRoleId) {
    let role = null;
      for (let i = 0; i < roleDocs.docs.length; i++) {
        if (roleDocs.docs[i].id === data.assignmentRoleId) {
          role = roleDocs.docs[i];
          break;
        }
      }
      if (role && role.data().assignmentId === assignmentId) {
        batchDeletes.push(deleteDoc(uaDoc.ref));
      }

    }
  });

  batchDeletes.push(deleteDoc(doc(db, "assignments", assignmentId)));

  await Promise.all(batchDeletes);
}
