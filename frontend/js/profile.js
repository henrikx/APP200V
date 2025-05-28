import { app } from '/js/firebase.js';

import {
  getAuth,
  onAuthStateChanged,
  verifyBeforeUpdateEmail,
  updatePassword,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";


import { UsersRepository } from './repository/usersrepository.js';
import { AssignmentsRepository } from './repository/assignmentsrepository.js';


const auth = getAuth(app);
const usersRepo = new UsersRepository(app);
const assignmentsRepo = new AssignmentsRepository(app);


onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const shiftList = document.getElementById("shift-list");
  shiftList.innerHTML = "";

  // Get all user assignments for this user
  // We'll use assignmentsRepo.getAssignments() to get all assignments, roles, and user assignments
  const [assignmentsMap, , , , userAssignmentMap] = await assignmentsRepo.getAssignments();

  // Find all assignments for this user
  // userAssignmentMap is { [assignmentId]: { [userAssignmentId]: userAssignmentData } }
const userShifts = [];

// Gather all shift entries
for (const assignmentId in userAssignmentMap) {
  const userAssignments = userAssignmentMap[assignmentId];
  for (const uaId in userAssignments) {
    const ua = userAssignments[uaId];
    if (ua.userId !== user.uid) continue;

    const assignment = assignmentsMap[assignmentId];
    if (!assignment) continue;

    const start = new Date(assignment.timeStart?.toDate?.() ?? assignment.timeStart);
    const end = new Date(assignment.timeEnd?.toDate?.() ?? assignment.timeEnd);
    const date = start.toLocaleDateString();
    const durationMs = end - start;
    const totalMinutes = Math.round(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const assignmentName = assignment.name || "Unknown Assignment";

    userShifts.push({
      assignmentName,
      dateString: date,
      hours,
      minutes,
      timestamp: start.getTime() // used for sorting
    });
  }
}

// Sort descending by timestamp (newest date first)
userShifts.sort((a, b) => b.timestamp - a.timestamp);

// Render sorted shifts
for (const shift of userShifts) {
  const shiftItem = document.createElement("div");
  shiftItem.className = "shift-entry";
  shiftItem.innerHTML = `
  <span class="shift-title">${shift.assignmentName}</span>
  <span class="shift-date">${shift.dateString}</span>
  <span class="shift-hours">${shift.hours}h ${shift.minutes}m</span>
`;

  shiftList.appendChild(shiftItem);
}
});

// Re-authenticate the current user using their password
async function reauthenticateUser(currentPassword) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

// Handle changes (email, password, phone)
window.submitChange = async function (field) {
  const newValue = document.getElementById(field).value.trim();
  if (!newValue) return alert("Please enter a new value.");

  const confirmChange = confirm(`You are about to change your ${field}. Are you sure?`);
  if (!confirmChange) return;

  const user = auth.currentUser;
  if (!user) return alert("User not signed in.");

  // Ask for current password to re-authenticate
  const currentPassword = prompt("Please enter your current password to continue:");
  if (!currentPassword) return alert("Password required to confirm identity.");

  try {
    await reauthenticateUser(currentPassword);

    if (field === "email") {
      await verifyBeforeUpdateEmail(user, newValue);
      await sendEmailVerification(user);
      alert("Email updated! Please verify it using the link sent to your inbox.");
      await usersRepo.updateUser(user.uid, { email: newValue });
    } else if (field === "password") {
      await updatePassword(user, newValue);
      alert("Password updated!");
    } else if (field === "phone") {
      // Use UsersRepository general updateUser method
      await usersRepo.updateUser(user.uid, { phoneNumber: newValue });
      alert("Phone number updated!");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating " + field + ": " + err.message);
  }
};
