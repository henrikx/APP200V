import { app } from '/js/firebase.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Initialize auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Get the create user form element
const createUserForm = document.getElementById("createUserForm");
if (createUserForm) {
  createUserForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Retrieve values from the form (ensure field names match your HTML)
    const firstName = createUserForm.elements["firstName"].value;
    const lastName = createUserForm.elements["lastName"].value;
    const email = createUserForm.elements["email"].value;
    const password = createUserForm.elements["password"].value;
    const phone = createUserForm.elements["phone"].value;
    const userRole = createUserForm.elements["userRole"].value;

    try {
      // 1. Create the new user (this will sign you in as that user)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const newUid = newUser.uid;

      // 2. Store extra info in Firestore for the new user
      await setDoc(doc(db, "users", newUid), {
        firstName,
        lastName,
        email,
        phone,
        userRole,
        createdAt: new Date()
      });

      console.log("User created successfully with UID:", newUid);
      alert("User created successfully! You will now be redirected to the login page.");
      // redirect to login
      window.location.href = "/";

    } catch (error) {
      console.error("Error creating user:", error);
    }
  });
} else {
  console.error("Create user form not found.");
}
