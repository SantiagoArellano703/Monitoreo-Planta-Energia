import { auth } from "./firebaseInit.js";
import { protectRoute, getCurrentUserData, createEnergy, createLimit, getUserEnergy, getLimit, updateLimit, validateEnergy, logout } from "./app.js";
// import { protectRoute } from "./routes.js";

protectRoute();
const [uid, userData] = await getCurrentUserData();
let listEnergyUser = await getUserEnergy(uid);
let limit = await getLimit(uid);
let isFetching = false;

if ( !limit ) {
    createLimit(uid, 100);
    limit = await getLimit(uid);
}

limit = Object.entries(limit)[0][1].limit;

console.log(listEnergyUser);

setInterval(async () => {
    if (isFetching) return; // Si ya está obteniendo datos, evita otra llamada
    isFetching = true;

    try {
        listEnergyUser = await getUserEnergy(uid);
        // console.log(listEnergyUser);
    } catch (error) {
        console.error("Error al obtener consumos:", error);
    } finally {
        isFetching = false; // Libera el bloqueo después de completar la ejecución
    }
}, 2000);


document.getElementById("btn-logout").addEventListener("click", () => {
    logout(auth);
});

document.getElementById("form-energy").addEventListener("submit", () => {
    let date = document.getElementById("form-date").value;
    let morning = parseInt(document.getElementById("form-morning").value);
    let afternoon = parseInt(document.getElementById("form-afternoon").value);

    if (validateEnergy(listEnergyUser, date)) {
        if (morning + afternoon > limit) {
            // createEnergy(uid, date, morning, afternoon, true);
            alert("Se excedió el límite diario");
        } else {
            // createEnergy(uid, date, morning, afternoon);
            alert("Creado");
        }
        
    } else {
        alert("Ya hay un registro para ese día");
    }
    
});
