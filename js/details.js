import { auth } from "./firebaseInit.js";
import { protectRoute, getCurrentUserData, getUserEnergy, deleteEnergy, logout } from "./app.js";

protectRoute();
const [uid, userData] = await getCurrentUserData();
let listEnergyUser = await getUserEnergy(uid);
let tableBody = document.getElementById("details-table-body");

await chargeTable();

document.getElementById("btn-logout").addEventListener("click", () => {
    logout(auth);
});

document.getElementById("selectFilter").addEventListener("change", async () => {
    await chargeTable();
});

async function chargeTable(){
    if (!listEnergyUser) return;

    let optionFilter = document.getElementById("selectFilter").value;
    let position = 1;
    let listOrdered = Object.entries(listEnergyUser);
    listOrdered.sort((a, b) => new Date(b[1].date) - new Date(a[1].date)); 

    if (optionFilter == 1) {
        listOrdered = listOrdered.filter(([id, energy]) => energy.excess == false);
    } else if (optionFilter == 2) {
        listOrdered = listOrdered.filter(([id, energy]) => energy.excess == true);
    }

    tableBody.innerHTML = "";

    for (let [id, dataEnergy] of listOrdered){
        let row = document.createElement("tr");
        let excess = dataEnergy.excess ? "Sí" : "No";

        row.innerHTML = `<th scope="row">${position}</th>
                        <td>${dataEnergy.date}</td>
                        <td>${dataEnergy.morning_kwh}</td>
                        <td>${dataEnergy.afternoon_kwh}</td>
                        <td>${dataEnergy.total_kwh}</td>
                        <td>${excess}</td>
                        <td><button class="btn btn-danger btn-sm delete-btn">-</button></td>`

        position++;
        if (dataEnergy.excess) {
            row.classList.add("table-danger");
        }
        tableBody.appendChild(row);

        row.querySelector(".delete-btn").addEventListener("click", async function() {
            deleteEnergy(uid, id);
            row.remove();
            listEnergyUser = await getUserEnergy(uid);
        });
    }
}
