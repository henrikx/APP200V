import { app } from "/js/firebase.js";
import { AssignmentsRepository } from "/js/repository/assignmentsrepository.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { UserRepository } from "/js/repository/usersrepository.js";
import { getFirestore,addDoc,collection } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";


// initialize Firebase Authentication
const auth = getAuth(app);
const db = getFirestore(app);
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

  //Clear old roles list
  document.getElementById('roles-list').innerHTML= "";
  
  Object.entries(assignmentRolesMap[assignmentId]).forEach(async ([roleId, roleData]) => {
    // Adder hver rolle til listen som en link
    document.getElementById('roles-list').innerHTML += `
      <a id="${roleData.name}" href="#" onclick="expandRolesSection('${roleData.name}');">
        <span id="${roleData.name}-span">▲</span> ${roleData.name}
      </a><br>`;
  
    // pre-create the <ul> for each role so users can be added later
    //so that the users gets added to their respective ul on signing up
    document.getElementById('roles-list').innerHTML += `
      <ul id="${roleData.name}-list" style="display: none;"></ul>`;
  
    // Loop through userAssignments and add users to the correct role
    Object.entries(userAssignmentMap[assignmentId]).forEach(async ([userAssignmentId, userAssignment]) => {
      try {
        if (userAssignment.assignmentRoleId !== roleId) return;
  
        const user = await usersrepository.getUser(userAssignment.userId);
        const userFullName = `${user.firstName} ${user.lastName}` || "Unknown User";
  
        const listElement = document.getElementById(`${roleData.name}-list`);
        if (listElement) {
          const li = document.createElement("li");
          li.textContent = userFullName;
          listElement.appendChild(li);
        }
      } catch (error) {
        console.error(`Error fetching user for ${roleData.name}:`, error);
      }
    });
  });
  
  // Event listener for sign up button
document.querySelector('.signup-btn').addEventListener('click', async () => {
  try {
    // Get the selected role value from the dropdown
    const roleSelect = document.getElementById('roleSelect');
    const chosenRole = roleSelect.value; //needs to match exact field in the firestore database
    
    // Find the matching role doc Id from assignmentRolesMap
    let chosenRoleDocId = null;
    let chosenRoleData = null;
    if (assignmentRolesMap && assignmentRolesMap[assignmentId]) {
      Object.entries(assignmentRolesMap[assignmentId]).forEach(([roleId, roleData]) => {
        // Compare role names case-insensitively so we dont get problems with
        // firebase since it is case-sensitive
        if (roleData && roleData.name && roleData.name.toLowerCase() === chosenRole.toLowerCase()) {
          chosenRoleDocId = roleId;
          chosenRoleData = roleData;
        }
      });
    }
    
    if (!chosenRoleDocId || !chosenRoleData) {
      console.log("No matching role found for selected role:", chosenRole, "- creating new role.");
      return;
    }
    
    // Get the current user ID (authentication ID)
    const currentUserId = auth.currentUser.uid;
    
    // Create a new document in the userAssignment collection so the jobs get referred to their userUID
    await addDoc(collection(db, "userAssignment",), {
      assignmentId: assignmentId,
      assignmentRoleId: chosenRoleDocId,
      userId: currentUserId,
      roleName: chosenRoleData.name
    });
    
    console.log("User signed up successfully for role:", chosenRole);
    
    //refresh the assignment details to show the updated list of users assigned to the roles
    await loadAssignment(assignmentId);
  } catch (error) {
    console.error("Error signing up user for role:", error);
    }
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