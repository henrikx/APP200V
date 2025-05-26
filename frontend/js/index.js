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

    try {
        const dbUser = await usersRepository.getUser(user.uid);
        if (!dbUser) {
            console.error("User not found in Firestore:", user.uid);
            console.log("Redirecting to create user page...");
            window.location.href = "/createuser.html?uid=" + user.uid;
            return;
        }

        // Fetch all roles and determine if user is a Manager
        const roles = await usersRepository.getUserRoles();
        const userRoleId = dbUser.userRole;
        const userRole = roles.find(role => role.id === userRoleId);
        const isManager = userRole && userRole.name === "Manager";

        // Show or hide adminNav based on role
        const adminNav = document.getElementById("adminNav");
        if (adminNav) {
            adminNav.style.display = isManager ? "block" : "none";
        }
    } catch (error) {
        console.error("Error fetching user data or roles:", error);
    }

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