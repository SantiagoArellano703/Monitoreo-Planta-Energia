import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

export {app, auth, db};