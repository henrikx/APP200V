import { app } from '/js/firebase.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.error("No user is signed in.");
        console.log("Redirecting to login page...");
        window.location.href = "/index.html?page=overview";
        return;
    }
});

function handleLoginButton()
{
  const auth = getAuth();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth, username, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      // ...
      window.location.href = '/?page=overview';
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // add error message to the page
      document.getElementById('error').innerHTML = errorMessage
    });
}

document.querySelector('.LoginButton1').addEventListener('click', handleLoginButton);