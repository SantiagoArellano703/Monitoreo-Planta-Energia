import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { auth } from "./firebaseInit.js";
import { createUser, getUser, protectRoute, logout } from "./app.js";
// import { createUser, getUser, logout } from "./app.js";
// import { protectRoute } from "./routes.js";

protectRoute();

const provider = new GoogleAuthProvider();

document.getElementById('form-register').addEventListener('submit', function(event) {
    event.preventDefault();

    let email = document.getElementById('email-register').value;
    let password = document.getElementById('password-register').value;
    let name = document.getElementById('username').value;
    let lastname = document.getElementById('lastname').value;

    registerUser(email, password, name, lastname);
    
});

document.getElementById('form-login').addEventListener('submit', function(event) {
    event.preventDefault();

    let email = document.getElementById('email-login').value;
    let password = document.getElementById('password-login').value;

    loginUser(email, password);
});

document.getElementById("google-login").addEventListener("click", () => {
    loginWithGoogle();
});

function registerUser (email, password, name, lastname) {
    if (!validateEmail(email)) {
        alert("Correo inválido");
        return;
    }
    if (!validatePassword(password)) {
        alert("La contraseña debe tener al menos 6 caracteres, una mayúscula y un número.");
        return;
    }
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed up 
        let user = userCredential.user;
        createUser(user, email, name, lastname).then(() => { window.location.href = "./dashboard.html"; });
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
    });
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
}

function loginUser (email, password) {
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed up 
        const user = userCredential.user;
        window.location.href = "dashboard.html";
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(errorMessage);
    });
}

function loginWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;

            getUser(user.uid).then((userData) => {
                console.log("USUARIO: ", userData);
            }).catch((error) => {
                console.log("CREA USER");
                createUser(user,user.email, user.displayName, "null", "cliente").then(() => {
                    window.location.href = "dashboard.html";
                })
            });

            // setTimeout(() => {logout(auth);}, 10000) ;
        })
        .catch((error) => {
            console.error("Error al iniciar sesión con Google:", error.message);
        });
}