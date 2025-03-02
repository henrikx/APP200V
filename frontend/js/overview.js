import { app } from '/js/firebase.js';

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("username").innerHTML = user.email;
    } else {
        console.log("No user is signed in.");
        // Optionally, redirect to login page or show a message
    }
});