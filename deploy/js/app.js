import { ref, push, set, get, update, remove } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { db, auth } from "./firebaseInit.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Crear Usuario
const createUser = async (user, email, name, lastname) => {
    let newUserRef = ref(db, `users/${user.uid}`);
    await set(newUserRef, {
        email,
        name,
        lastname
    });
    console.log('Usuario creado:', newUserRef.key);
};

const createEnergy = async (userId, date, morning_kwh, afternoon_kwh, excess = false) => {
    let energyCollection = ref(db, `energy/${userId}`);
    let newEnergy = push(energyCollection);
    await set(newEnergy, {
        date,
        morning_kwh,
        afternoon_kwh,
        total_kwh:  morning_kwh + afternoon_kwh,
        excess
    });
    console.log('Registro creado:', newEnergy.key);
};

const createLimit = async (userId, limit) => {
    let limitCollection = ref(db, `limits/${userId}`);
    let newLimit = push(limitCollection);
    await set(newLimit, {
        limit
    });
    console.log('Limite creado:', newLimit.key);
};

async function getUserEnergy(uid) {
    try {
        let energyForUser = ref(db, `energy/${uid}`);
        let energyData = await get(energyForUser); 
        
        if (energyData.exists()) {
            return energyData.val(); 
        } else {
            console.log("No se encontró registros de consumo para este usuario");
            return null;  
        }
    } catch (error) {
        console.log("Error al obtener registros de consumo:", error); 
        return null;    
    }
}

async function getLimit(uid) {
    try {
        let limitForUser = ref(db, `limits/${uid}`);
        let limitData = await get(limitForUser); 
        
        if (limitData.exists()) {
            return limitData.val(); 
        } else {
            console.log("No se encontró límite para este usuario");
            return null;  
        }
    } catch (error) {
        console.log("Error al obtener el límite:", error); 
        return null;    
    }
}

async function getUser(uid) {
    return new Promise((resolve, reject) => {
        let userRef = ref(db, "users/" + uid);

        get(userRef).then((userData) => {
            if (userData.exists()) {
                resolve(userData.val());
            } else {
                reject("No se encontró el usuario");
            }
        });
    });
}

async function getCurrentUserData() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                let uid = user.uid;
                let userRef = ref(db, `users/${uid}`);
                try {
                    let userData = await get(userRef);
                    if (userData.exists()) {
                        resolve([uid, userData.val()]);
                    } else {
                        reject("No se encontraron datos para este usuario.");
                    }
                } catch (error) {
                    reject(error.message);
                }
            } else {
                reject("No hay usuario autenticado.");
            }
        })
    })
}

const updateEnergyExcess = async (userId, energyId, newExcess) => {
    let energyRef = ref(db, `energy/${userId}/${energyId}`);
     
    try {
        await update(energyRef, {
            excess: newExcess
        });
        console.log('Registro actualizado');
    } catch (error) {
        console.log('No se puedo actualizar el registro:', error);
    }
    
};

// const updateEnergyTotal = async (userId, energyId, newTotal) => {
//     let energyRef = ref(db, `energy/${userId}/${energyId}`);
     
//     try {
//         await update(energyRef, {
//             total_kwh: newTotal
//         });
//         console.log('Registro actualizado');
//     } catch (error) {
//         console.log('No se puedo actualizar el registro:', error);
//     } 
// };

const updateLimit = async (userId, newLimit) => {
    let limit = await getLimit(userId);
    limit = Object.entries(limit)[0][0];
    let limitRef = ref(db, `limits/${userId}/${limit}`);
    
    await update(limitRef, {
        limit: newLimit
    });
    
    console.log('Límite actualizado:', limit);
};

const deleteEnergy = async (userId, energyId) => {
    let energyRef = ref(db, `energy/${userId}/${energyId}`);
     
    try {
        await remove(energyRef);
        console.log('Registro eliminado');
    } catch (error) {
        console.log('No se puedo eliminar el registro:', error);
    }
};

function logout(auth) {
    signOut(auth)
    .then(() => {
        console.log("Sesión cerrada exitosamente.");
        window.location.href = "../index.html";
    })
    .catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
}

function protectRoute() {
    onAuthStateChanged(auth, (user) => {
        if (!user && (window.location.pathname.includes("dashboard.html") || window.location.pathname.includes("details.html"))){
            window.location.href = "./login.html";
        }
        else if (user && window.location.pathname.includes("login.html")) {
            getCurrentUserData().then(([uid, dataUser]) => {
                if (dataUser != null) {
                    window.location.href = "dashboard.html";
                }
            });
        }
    }); 
}

function validateEnergy(listEnergyUser, date){
    if (!listEnergyUser) return true;
    if (!date) return [false, "Dia no válido"];

    for(let [id, energy] of Object.entries(listEnergyUser)){
        if (energy.date == date) {
            return false;
        }
    }

    return true;
}

export { 
    createUser, 
    getUser, 
    getCurrentUserData, 
    createEnergy, 
    logout, 
    protectRoute,
    createLimit,
    updateLimit,
    getUserEnergy,
    validateEnergy,
    getLimit,
    updateEnergyExcess,
    deleteEnergy
};