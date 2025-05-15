import { app } from '/js/firebase.js'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Initialize auth and Firestore
const auth = getAuth(app);

// Get the create user form element
const createUserForm = document.getElementById("createUserForm");
if (createUserForm) {
  createUserForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Retrieve values from the form (ensure field names match your HTML)
    const email = createUserForm.elements["email"].value;
    const password = createUserForm.elements["password"].value;

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created successfully with UID:", user.uid);
      alert("User created successfully! You will now be redirected to the overview page.");
      // Log in
      await signInWithEmailAndPassword(auth, email, password);
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
