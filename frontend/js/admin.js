import { app } from '/js/firebase.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { UsersRepository } from '/js/repository/usersrepository.js';

const auth = getAuth(app);
const usersRepo = new UsersRepository(app);
let allUsers = []; // Store all users for filtering
let allRoles = []; // Store all roles for selection

// Check auth state and load users and roles
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
  } else {
    await loadRoles();
    await loadUsers();
  }
});

// Function to populate the user dropdown
function populateUserDropdown(users) {
  const userListSelect = document.getElementById('adminUserListSelect');
  userListSelect.innerHTML = ''; // Clear existing options

  users.forEach((user) => {
    const role = allRoles.find((role) => role.id === user.userRole); // Find the role by ID
    const roleName = role ? role.name : 'Awaiting approval'; // Use the role name or fallback to 'Awaiting approval'

    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.firstName} ${user.lastName} (${user.email}) | ${roleName}`;
    userListSelect.appendChild(option);
  });
}

// Function to load users into the dropdown
async function loadUsers() {
  allUsers = await usersRepo.getUsers(); // Fetch and store all users
  populateUserDropdown(allUsers); // Populate the dropdown with all users
}

// Function to load roles into the dropdown
async function loadRoles() {
  allRoles = await usersRepo.getUserRoles(); // Fetch and store all roles
  populateEmployeeSelectBox();
}

function populateEmployeeSelectBox() {
  const roleListSelect = document.getElementById('roleListSelect');
  roleListSelect.innerHTML = ''; // Clear existing options

  allRoles.forEach((role) => {
    const option = document.createElement('option');
    option.value = role.id; // Use the document ID as the value
    option.textContent = role.name; // Assuming roles have a 'name' property
    roleListSelect.appendChild(option);
  });
}

// Function to update a user's role
async function updateUser() {
  const userListSelect = document.getElementById('adminUserListSelect');
  const roleListSelect = document.getElementById('roleListSelect');
  const selectedUserId = userListSelect.value;
  const selectedRoleId = roleListSelect.value;

  if (!selectedUserId) {
    alert('Please select a user to update.');
    return;
  }

  if (!selectedRoleId) {
    alert('Please select a role to assign.');
    return;
  }

  try {
    await usersRepo.updateUserRole(selectedUserId, selectedRoleId);
    alert('User role updated successfully.');
    loadUsers(); // Reload the user list
  } catch (error) {
    alert(`Error updating user role: ${error.message}`);
  }
}

// Function to delete a user
async function deleteUser() {
  const userListSelect = document.getElementById('adminUserListSelect');
  const selectedUserId = userListSelect.value;

  if (!selectedUserId) {
    alert('Please select a user to delete.');
    return;
  }

  const confirmDelete = confirm('Are you sure you want to delete this user?');
  if (confirmDelete) {
    await usersRepo.deleteUser(selectedUserId);
    alert('User deleted successfully.');
    loadUsers(); // Reload the user list
  }
}

// Function to filter users based on search input
function filterUsers() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();

  // Filter users based on the search input
  const filteredUsers = allUsers.filter((user) =>
    user.firstName.toLowerCase().includes(searchInput) ||
    user.lastName.toLowerCase().includes(searchInput) ||
    user.email.toLowerCase().includes(searchInput)
  );

  // Populate the dropdown with filtered users
  populateUserDropdown(filteredUsers);
}

// Attach event listeners to buttons
document.getElementById('changeRoleButton').addEventListener('click', updateUser);
document.getElementById('deleteUserButton').addEventListener('click', deleteUser);
document.querySelector('.adminUpdate form').addEventListener('submit', (e) => {
  e.preventDefault(); // Prevent form submission
  filterUsers(); // Trigger the search functionality
});