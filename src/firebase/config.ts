// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZqwtQQ0N21LHIyt2VJnafrGLvTjhJfS4",
  authDomain: "tcc-reconhecimento-facia-77899.firebaseapp.com",
  projectId: "tcc-reconhecimento-facia-77899",
  storageBucket: "tcc-reconhecimento-facia-77899.appspot.com",
  messagingSenderId: "947174756392",
  appId: "1:947174756392:web:226ba9adfa59c77534651d",
  measurementId: "G-BQ12X2X6DY"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const FirebaseAuth = getAuth(app);