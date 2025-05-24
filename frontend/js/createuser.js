import { app, signOut } from '/js/firebase.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { UsersRepository } from '/js/repository/usersrepository.js';

// Initialize auth and Firestore
const auth = getAuth(app);
const uid = new URLSearchParams(window.location.search).get("uid"); // Get the uid from the URL

// Get the create user form element
const createUserForm = document.getElementById("createUserForm");
if (createUserForm) {
  if (!uid) {
    console.error("No UID provided in the URL.");
    alert("No UID provided in the URL. Please check the link.");
    window.location.href = "/login.html";
  }
  createUserForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Retrieve values from the form (ensure field names match your HTML)
    const firstName = createUserForm.elements["firstName"].value;
    const lastName = createUserForm.elements["lastName"].value;
    const email = createUserForm.elements["email"].value;
    const phoneNumber = createUserForm.elements["phone"].value;

    // Check that no fields are empty
    if (!firstName || !lastName || !email || !phoneNumber) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      const userRole = await getEmployeeRole(); // Default user role
      const usersRepository = new UsersRepository(app);
      await usersRepository.addUser(uid, {
        firstName,
        lastName,
        email,
        phoneNumber,
        userRole,
        createdAt: new Date()
      });

      console.log("User created successfully with UID:", uid);
      alert("User created successfully! You will now be redirected to the overview page.");
      // redirect to login
      window.location.href = "/index.html?page=overview";

    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user: " + error.message);
    }
  });
} else {
  console.error("Create user form not found.");
}

async function getEmployeeRole() {
  const usersRespository = new UsersRepository(app);
  const roles = await usersRespository.getUserRoles()
  const roleId = roles.find(role => role.name === "Employee").id;
  return roleId;
}

document.getElementById('signOutButton').addEventListener('click', signOut);
