import { app } from "/js/firebase.js";
import { AssignmentsRepository } from "/js/repository/assignmentsrepository.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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
    const params = new URLSearchParams(window.location.search); // Get array with query-params
    const assignmentId = params.get('id'); // Get query-parameter "page"
    await loadAssignment(assignmentId);
  } else {
    console.log("No user is signed in.");
  }
});

async function loadAssignment(assignmentId) {
    // Fetch assignments, assignment roles, and user assignments concurrently
    const [assignmentsMap, assignmentCapacityMap, assignmentUsageMap] = await assignmentsRepository.getAssignments(assignmentId);
    const { name, timeStart, timeEnd } = assignmentsMap[assignmentId];
      const totalCap = assignmentCapacityMap[assignmentId] || 0;
      const usedCount = assignmentUsageMap[assignmentId] || 0;

      //Updating the "name" element by retrieving it from firebase
      document.getElementById('name').innerHTML = `${name || "No name"}`;
      
      //Converting Firestore Timestamps to local date string
      if (timeStart && timeEnd) {
        const startDate = timeStart.toDate().toLocaleDateString();
        const endDate = timeEnd.toDate().toLocaleDateString();
        document.getElementById('date').innerHTML = `${startDate} - ${endDate}`;
    } else {
        document.getElementById('date').innerHTML = `Date: No date`;
    }
      //Updating the capacity element with the correct information by id
      document.getElementById('capData').innerHTML =`${usedCount} / ${totalCap}`;
}
