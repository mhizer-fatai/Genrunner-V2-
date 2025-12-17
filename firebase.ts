
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDLO27Kem0lLpVdBnCnRXZg4w7GNZPCsEY",
  authDomain: "my-server-a7b7.firebaseapp.com",
  projectId: "my-server-a7b7",
  storageBucket: "my-server-a7b7.firebasestorage.app",
  messagingSenderId: "131436092362",
  appId: "1:131436092362:web:9bc91e773722d1714d8d33"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
