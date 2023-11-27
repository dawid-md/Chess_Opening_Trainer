// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfW2_6ZYFcwYzAGeCoLrWkdW29t1CGRsM",
  authDomain: "opening-trainer.firebaseapp.com",
  databaseURL: "https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "opening-trainer",
  storageBucket: "opening-trainer.appspot.com",
  messagingSenderId: "1047030054822",
  appId: "1:1047030054822:web:b52a8267c5ee47c6e2d967",
  measurementId: "G-W1EBRYPK9K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);