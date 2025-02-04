import { auth } from "./firebaseInit.js";
import { protectRoute, getCurrentUserData, createEnergy, createLimit, getUserEnergy, getLimit, updateLimit, validateEnergy, logout } from "./app.js";
// import { protectRoute } from "./routes.js";

protectRoute();
const [uid, userData] = await getCurrentUserData();
let listEnergyUser = await getUserEnergy(uid);
let limit = await getLimit(uid);
let isFetching = false;
let [daysChart, dataChart] = getDataForChart(2);
let chart = [];

await initializeDashboard(limit);
// console.log(limit)
// console.log(listEnergyUser);

// setInterval(async () => {
//     if (isFetching) return; // Si ya está obteniendo datos, evita otra llamada
//     isFetching = true;

//     try {
//         listEnergyUser = await getUserEnergy(uid);
//         // console.log(listEnergyUser);
//     } catch (error) {
//         console.error("Error al obtener consumos:", error);
//     } finally {
//         isFetching = false; // Libera el bloqueo después de completar la ejecución
//     }
// }, 2000);


document.getElementById("btn-logout").addEventListener("click", () => {
    logout(auth);
});

document.getElementById("form-energy").addEventListener("submit", async () => {
    let date = document.getElementById("form-date").value;
    let morning = parseFloat(document.getElementById("form-morning").value);
    let afternoon = parseFloat(document.getElementById("form-afternoon").value);

    if (validateEnergy(listEnergyUser, date)) {
        if (morning + afternoon > limit) {
            createEnergy(uid, date, morning, afternoon, true);
            alert("Se excedió el límite diario");
        } else {
            createEnergy(uid, date, morning, afternoon);
            alert("Creado");
        }
        
        listEnergyUser = await getUserEnergy(uid);
        chargeDashboard();
    } else {
        alert("Ya hay un registro para ese día");
    }
    
});


/*-------------------------*\
   Funciones
\*-------------------------*/

async function initializeDashboard() {
    if ( !limit ) {
        createLimit(uid, 100);
        limit = await getLimit(uid);
    }
    limit = Object.entries(limit)[0][1].limit;

    chart = createChart(daysChart, dataChart);
    chargeDashboard();
}

function chargeDashboard() {
    let average = document.getElementById("consumeAverage");
    let limitDiv = document.getElementById("limitValue");
    let excessDiv = document.getElementById("excessValue");

    average.innerText = calculateAverage();
    limitDiv.innerText = limit;
    excessDiv.innerHTML = getExcess().length;
    [daysChart, dataChart] = getDataForChart(2);
    updateChart(chart, daysChart, dataChart);
}

function calculateAverage(){
    if (!listEnergyUser) return 0;
    let arrayEnergy = Object.values(listEnergyUser);
    let average = 0;

    for (let dataEnergy of arrayEnergy) {
        average += dataEnergy.morning_kwh + dataEnergy.afternoon_kwh;
    }

    average = (average/arrayEnergy.length).toFixed(2);
    return average;
}

function getExcess(){
    if (!listEnergyUser) return {};
    return Object.entries(listEnergyUser).filter(([key, dataEnergy]) => dataEnergy.excess == true);
}

function getDataForChart(month){
    if (!listEnergyUser) return [];
    let dataChart = [];
    let daysChart = [];

    let listOrdered = Object.values(listEnergyUser).filter(data => 
        new Date(data.date + "T00:00:00").getMonth() + 1 == month
    );

    console.log(listOrdered);

    listOrdered.sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let dataEnergy of listOrdered) {
        let totalValue = dataEnergy.morning_kwh + dataEnergy.afternoon_kwh;
        dataChart.push(totalValue);
        daysChart.push(new Date(dataEnergy.date + "T00:00:00").getDate());
    }

    return [daysChart, dataChart];
}

function createChart(daysChart, dataChart) {
    const ctx = document.getElementById("historyChart");
    const data = {
        labels: daysChart,
        datasets: [{
          label: 'My First Dataset',
          data: dataChart,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
    };
    return new Chart(ctx, {
        type: 'line',
        data: data
    });
}

function updateChart(chart, newLabels, newData) {
    chart.data.labels = newLabels; 
    chart.data.datasets[0].data = newData;

    chart.update();
}



