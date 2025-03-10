import {app} from '/js/firebase.js';
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    getDocs
}   from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

//Initalize firestore and auth
const db = getFirestore(app);
const auth = getAuth (app);

//Load the auth state changes.
// if not authenticated then redirected back.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // display the user's email:
        const usernameElem = document.getElementById ("username");
        if (usernameElem) {
            usernameElem.textContent = user.email;
        }
        await loadAssignment();
    } else {
        console.log("No user is signed in.");
    }
});

// Try to fetch the assignment document from "assigments"
// to get name of the boat and the date.
async function loadAssignment() {
    try {
        const assigmentRef = doc(db, "assignments",assignmentId);
        const assigmentSnap = await getDoc (assigmentRef);
        if (!assigmentSnap.exists()) {
            console.error("Assignment not found!");
        }
    } catch (error) {
        console.error("An error occured: Check if data exists in database");
    }
}

