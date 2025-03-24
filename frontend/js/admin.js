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
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Initialize auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Hard-code or otherwise retrieve your admin's credentials:
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "AdminPassword123";

// Check auth state and toggle admin navigation visibility
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log("User data:", userData);
      console.log("User role:", userData.userRole);
      if (userData.userRole === "admin") {
        document.getElementById("adminNav").style.display = "list-item";
      } else {
        document.getElementById("adminNav").style.display = "none";
      }
    } else {
      console.error("User document not found");
      document.getElementById("adminNav").style.display = "none";
    }
  } else {
    // If no user is signed in, redirect to login
    window.location.href = "/login.html";
  }
});

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

      // 3. Immediately sign out of that new user
      await signOut(auth);

      // 4. Sign back in as admin
      //    (Requires storing admin credentials in code or prompting for them)
      const adminCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log("Signed back in as admin:", adminCredential.user.email);

      // Reset the form
      createUserForm.reset();

    } catch (error) {
      console.error("Error creating user:", error);
    }
  });
} else {
  console.error("Create user form not found.");
}
