import { app, signOut } from '/js/firebase.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { UsersRepository } from '/js/repository/usersrepository.js';

const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
    const usersRepository = new UsersRepository(app);

    if (!user) {
        console.error("No user is signed in.");
        console.log("Redirecting to login page...");
        window.location.href = "/login.html";
        return;
    }
    usersRepository.getUser(user.uid).then((dbUser) => {
    if (!dbUser) {
        console.error("User not found in Firestore:", user.uid);
        console.log("Redirecting to create user page...");
        window.location.href = "/createuser.html?uid=" + user.uid;
    }
    }).catch((error) => {
    console.error("Error fetching user data:", error);
    });

    const burger = document.getElementById("burgerMenu");
    const navLinks = document.getElementById("navLinks");

    if (burger && navLinks) {
        burger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            burger.classList.toggle("toggle");
        });
    }
});

document.getElementById('signOutButton').addEventListener('click', signOut);