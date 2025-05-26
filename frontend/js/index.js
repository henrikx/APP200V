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

        // Check if user has a userRole assigned
        if (!dbUser.userRole) {
            // Hide navigation and show awaiting approval message
            const navLinks = document.getElementById("navLinks");
            if (navLinks) navLinks.style.display = "none";
            const content = document.getElementById("content");
            if (content) {
                content.innerHTML = `
                    <div class="awaiting-accept-message" style="margin:2rem;text-align:center;">
                        <h2>Your account is awaiting approval</h2>
                        <p>A manager needs to accept your account before you can use the system.</p>
                        <button id="signOutButtonAwaiting" style="margin-top:1rem;">Sign out</button>
                    </div>
                `;
                const signOutBtn = document.getElementById('signOutButtonAwaiting');
                if (signOutBtn) signOutBtn.addEventListener('click', signOut);
            }
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