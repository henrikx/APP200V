import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
  // Configuration fetched from firebase console
  
  // Import the functions you need from the SDKs you need

  // TODO: Add SDKs for Firebase products that you want to use

  // https://firebase.google.com/docs/web/setup#available-libraries


  // Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyB8NgzRkO7937ehuP-S8ABq7GEaSx69lVE",

  authDomain: "app200v-gruppe-4.firebaseapp.com",

  databaseURL: "https://app200v-gruppe-4-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "app200v-gruppe-4",

  storageBucket: "app200v-gruppe-4.firebasestorage.app",

  messagingSenderId: "57768003349",

  appId: "1:57768003349:web:de164e69824fa5c3920b1c"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

export { app };