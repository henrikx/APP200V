import { app } from "/js/firebase.js";
import { AssignmentsRepository } from "/js/repository/assignmentsrepository.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { UserRepository } from "/js/repository/usersrepository.js";

// initialize Firebase Authentication
const auth = getAuth(app);
const assignmentsRepository = new AssignmentsRepository(app);
const usersrepository = new UserRepository(app);

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
  const [assignmentsMap, assignmentCapacityMap, assignmentUsageMap, assignmentRolesMap, userAssignmentMap] = await assignmentsRepository.getAssignments(assignmentId);
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
  
  Object.entries(assignmentRolesMap[assignmentId]).forEach(async ([roleId, roleData]) => {

    //adder hver rolle til listen som en link
    document.getElementById('roles-list').innerHTML += `<a id="${roleData.name}" href="#" onclick="expandRolesSection('${roleData.name}');"><span id="${roleData.name}-span">▼</span> ${roleData.name}</a><br>`;

    Object.entries(userAssignmentMap[assignmentId]).forEach(async (userAssignmentDoc) => {
      const [userAssignmentId, userAssignment] = userAssignmentDoc;
      try {
        if (userAssignment.assignmentRoleId !== roleId) {
          return;
        }
        const user = await usersrepository.getUser(userAssignment.userId);
        // shows the users name to the ui, and console log if there are any errors to fetching the user.
        document.getElementById('roles-list').innerHTML += `<ul id="${roleData.name}-list"><li>${user.firstName + " " + user.lastName || "Unknown User"}</li></ul>`;
      } catch (error) {
        console.error(`Error fetching user for ${roleData.name}:`, error);
      }
    });
  });
}

window.expandRolesSection= function(roleName) {
  console.log("Expanding role section for: ", roleName);
  //toggle the display for the elements
  const spanElement = document.getElementById(roleName + "-span");
  const listElement = document.getElementById(roleName + "-list");
  if (listElement) {
    listElement.style.display = listElement.style.display === "none" ? "block" : "none";
    spanElement.innerHTML = listElement.style.display === "none" ? "▼" : "▲";
  }
}
