
import { app } from "/js/firebase.js";
import { AssignmentsRepository } from "/js/repository/assignmentsrepository.js";
import { UsersRepository } from "/js/repository/usersrepository.js";


// Use repositories only, no direct firebase usage
const assignmentsRepository = new AssignmentsRepository(app);
const usersrepository = new UsersRepository(app);


// Helper to get current user from firebase auth (for now, still using firebase auth for userId)
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
const auth = getAuth(app);
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const usernameElem = document.getElementById("username");
    if (usernameElem) {
      usernameElem.textContent = user.email;
    }
    const params = new URLSearchParams(window.location.search);
    const assignmentId = params.get('id');
    await loadAssignment(assignmentId, user.uid);
  } else {
    console.log("No user is signed in.");
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

async function loadAssignment(assignmentId, currentUserId) {
  // Fetch assignments, assignment roles, and user assignments concurrently
  const [assignmentsMap, assignmentCapacityMap, assignmentUsageMap, assignmentRolesMap, userAssignmentMap] = await assignmentsRepository.getAssignments(assignmentId);
  const { name, description, timeStart, timeEnd } = assignmentsMap[assignmentId];
  const totalCap = assignmentCapacityMap[assignmentId] || 0;
  const usedCount = assignmentUsageMap[assignmentId] || 0;

  //Updating the "name" element by retrieving it from firebase
  if (name) {
    document.getElementById('name').innerHTML = escapeHtml(name);
  } else {
    document.getElementById('name').innerHTML = "No name";
  }

  //Updating the "description" element by retrieving it from firebase
  if (description) {
    document.getElementById('description').innerHTML = escapeHtml(description);
  } else {
    document.getElementById('description').innerHTML = "No description";
  }

  //Converting Firestore Timestamps to local date string //fetched from overview
  if (timeStart && timeEnd) {
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
    document.getElementById('date').innerHTML = escapeHtml(`${startDate} - ${endDate}`);
  } else {
    document.getElementById('date').innerHTML = `Date: No date`;
  }

  //Updating the capacity element with the correct information by id
  const capDataEl = document.getElementById('capData');
  if (capDataEl) {
    capDataEl.innerHTML = escapeHtml(`${usedCount} / ${totalCap}`);
  }

  // Populate the role select box dynamically
  const roleSelect = document.getElementById('roleSelect');
  if (roleSelect) {
    roleSelect.innerHTML = '';
    if (assignmentRolesMap && assignmentRolesMap[assignmentId]) {
      Object.values(assignmentRolesMap[assignmentId]).forEach(roleData => {
        if (roleData && roleData.name) {
          const option = document.createElement('option');
          option.value = roleData.name;
          option.textContent = roleData.name;
          roleSelect.appendChild(option);
        }
      });
    }
  }

  // Clear old roles list
  const rolesListEl = document.getElementById('roles-list');
  rolesListEl.innerHTML = "";

  // Figure out which roles actually have someone signed up¨
  if (userAssignmentMap[assignmentId])
  {
    const assignedRoleIds = new Set(
      Object.values(userAssignmentMap[assignmentId]).map(ua => ua.assignmentRoleId)
    );
    // Render only those roles that have at least one signup
    // Adder hver rolle til listen som en link
    // Modified to using createElement and function escapeHTML to prevent XSS
    // raw data is from firebase
    Object.entries(assignmentRolesMap[assignmentId]).forEach(([roleId, roleData]) => {

      if (!assignedRoleIds.has(roleId)) return;

      const roleNameRaw = roleData.name;
      const roleNameEscaped = escapeHtml(roleNameRaw);
      const roleCap = roleData.capacity || 0;
      //count users that are assigned to their respective roles
      const roleCount = Object.values (userAssignmentMap[assignmentId])
      .filter(ua=> ua.assignmentRoleId === roleId).length;
      const rolesListEl = document.getElementById('roles-list');
      if (rolesListEl) {
        const link = document.createElement("a");
        link.href = "#";
        link.innerHTML = `<span id="${roleNameRaw}-span">▲</span> ${roleNameEscaped} (${roleCount}/${roleCap})`;
        link.addEventListener("click", () => expandRolesSection(roleNameRaw));
        rolesListEl.appendChild(link);

        const lineBreak = document.createElement("br");
        rolesListEl.appendChild(lineBreak);

        const ul = document.createElement("ul");
        ul.id = `${roleNameRaw}-list`;
        ul.style.display = "none";
        rolesListEl.appendChild(ul);
      }
    });
    // Loop through userAssignments and add users to the correct role
    Object.entries(userAssignmentMap[assignmentId]).forEach(async ([userAssignmentId, userAssignment]) => {
      try {
        // Only populate users for roles we rendered above
        if (!assignedRoleIds.has(userAssignment.assignmentRoleId)) return;

        const user = await usersrepository.getUser(userAssignment.userId);
        const userFullName = `${user.firstName} ${user.lastName}` || "Unknown User";
        const userFullNameEscaped = escapeHtml(userFullName);

        const listElement = document.getElementById(
          `${assignmentRolesMap[assignmentId][userAssignment.assignmentRoleId].name}-list`
        );
        if (listElement) {
          const li = document.createElement("li");
          li.textContent = userFullNameEscaped;
          listElement.appendChild(li);
        }
      } catch (error) {
        console.error(`Error fetching user for role:`, error);
      }
    });

  } else {
    // If no one has signed up yet, show a placeholder
    rolesListEl.innerHTML = escapeHtml("No one has signed up for any role yet.");
  }


  // Event listener for sign up button
  document.querySelector('.signup-btn').onclick = async () => {
    // Block assignment if the capacity is full
    if(usedCount >= totalCap) {
        alert("This assignment is already full, cannot sign up!")
        return
      }
    try {
      // Get the selected role value from the dropdown
      const roleSelect = document.getElementById('roleSelect');
      const chosenRole = roleSelect.value;

      // Making sure the roles exists by validating the chosenRole based on the userUID -- prevent XSS ATTACKS
      const validRoles = Object.values(assignmentRolesMap[assignmentId]).map(r => r.name.toLowerCase());
      if (!validRoles.includes(chosenRole.toLowerCase())) {
        alert("Invalid role selected.");
        return;
      }

      // Find the matching role doc Id from assignmentRolesMap
      let chosenRoleDocId = null;
      let chosenRoleData = null;
      if (assignmentRolesMap && assignmentRolesMap[assignmentId]) {
        Object.entries(assignmentRolesMap[assignmentId]).forEach(([roleId, roleData]) => {
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

      // Use currentUserId passed to loadAssignment
      // Check if user is already assigned
      const alreadyAssigned = userAssignmentMap[assignmentId] && Object.values(userAssignmentMap[assignmentId]).some(ua => ua.userId === currentUserId);
      if (alreadyAssigned) {
        console.log("User already signed up for the assignment");
        alert("You are already signed up for this assignment, Leave assignment if needed to change role or assignment!")
        return;
      }

      // Use assignmentsRepository to add user assignment
      await assignmentsRepository.addUserAssignment({
        assignmentId: assignmentId,
        assignmentRoleId: chosenRoleDocId,
        userId: currentUserId,
        roleName: escapeHtml(chosenRoleData.name) //especially here since we are inserting to firebase.
      });

      console.log("User signed up successfully for role:", chosenRole);
      alert("Signed up successfully!");

      //refresh the assignment details to show the updated list of users assigned to the roles
      await loadAssignment(assignmentId, currentUserId);
    } catch (error) {
      console.error("Error signing up user for role:", error);
    }
  };


  // LEAVE ASSIGNMENT - SECTION
  // Create event listener so the user signed up can also leave the assignment if needed
  document.querySelector('.leave-btn').onclick = async () => {
    try {
      // use userAssignmentsMap to find the user related to the document
      const userAssignmentEntry = Object.entries(userAssignmentMap[assignmentId]).find(
        ([_, ua]) => ua.userId === currentUserId
      );

      if (!userAssignmentEntry) {
        alert("You are not signed up for this assignment.");
        return;
      }

      const [userAssignmentDocId] = userAssignmentEntry;

      // Use assignmentsRepository to delete user assignment
      await assignmentsRepository.deleteUserAssignment(userAssignmentDocId);
      console.log("User left the assignment successfully.")
      alert("Left assignment successfully!")

      //refresh the list
      await loadAssignment(assignmentId, currentUserId);

    } catch (error) {
      console.error("Error leaving assignment:", error);
    }
  };
}


//BackButton to go back to overview page
const backBtn = document.getElementById('back-to-overview');
if (backBtn) {
  backBtn.onclick = () => window.location.href = "/?page=overview";
}


window.expandRolesSection = function (roleName) {
  console.log("Expanding role section for: ", roleName);
  //toggle the display for the elements
  const spanElement = document.getElementById(roleName + "-span");
  const listElement = document.getElementById(roleName + "-list");
  if (listElement) {
    listElement.style.display = listElement.style.display === "none" ? "block" : "none";
    spanElement.innerHTML = listElement.style.display === "none" ? "▲" : "▼";
  }
}

