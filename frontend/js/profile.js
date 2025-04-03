import { app } from '/js/firebase.js';

import {
  getAuth,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const shiftList = document.getElementById("shift-list");
  shiftList.innerHTML = "";

  const userAssignmentsQuery = query(
    collection(db, "userAssignment"),
    where("userId", "==", user.uid)
  );

  const userAssignmentsSnapshot = await getDocs(userAssignmentsQuery);

  for (const docSnap of userAssignmentsSnapshot.docs) {
    const ua = docSnap.data();
    const assignmentId = ua.assignmentId;

    const assignmentRef = doc(db, "assignments", assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    if (!assignmentSnap.exists()) continue;

    const assignment = assignmentSnap.data();
    const boatName = assignment.name || "Unknown Boat";

    const start = new Date(assignment.timeStart?.toDate?.() ?? assignment.timeStart);
    const end = new Date(assignment.timeEnd?.toDate?.() ?? assignment.timeEnd);
    const date = start.toLocaleDateString();
    const hours = Math.round((end - start) / (1000 * 60 * 60));

    const shiftItem = document.createElement("div");
    shiftItem.className = "shift-entry";
    shiftItem.innerHTML = `
      <span class="shift-title">${boatName}</span>
      <span class="shift-date">${date}</span>
      <span class="shift-hours">${hours} hrs</span>
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
      await updateEmail(user, newValue);
      await sendEmailVerification(user);
      alert("Email updated! Please verify it using the link sent to your inbox.");
    } else if (field === "password") {
      await updatePassword(user, newValue);
      alert("Password updated!");
    } else if (field === "phone") {
      const userDoc = doc(db, "users", user.uid);
      await updateDoc(userDoc, { phoneNumber: newValue });
      alert("Phone number updated!");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating " + field + ": " + err.message);
  }
};
