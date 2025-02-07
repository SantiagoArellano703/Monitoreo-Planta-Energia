import { auth } from "./firebaseInit.js";
import { protectRoute, getCurrentUserData, createEnergy, createLimit, getUserEnergy, getLimit, updateLimit, validateEnergy, updateEnergyExcess, logout } from "./app.js";

protectRoute();
const [uid, userData] = await getCurrentUserData();
let listEnergyUser = await getUserEnergy(uid);
let limit = await getLimit(uid);
let isFetching = false;
let [daysChart, dataChart, dataPieChart] = [];
let chart = [];
let pieChart = [];

await initializeDashboard();

document.getElementById("btn-logout").addEventListener("click", () => {
    logout(auth);
});

document.getElementById("form-energy").addEventListener("submit", async (event) => {
    event.preventDefault();
    let date = document.getElementById("form-date").value;
    let morning = parseFloat(document.getElementById("form-morning").value);
    let afternoon = parseFloat(document.getElementById("form-afternoon").value);

    if (validateEnergy(listEnergyUser, date)) {
        if (morning + afternoon > limit) {
            createEnergy(uid, date, morning, afternoon, true);
            createAlert("danger", "El consumo excedió el límite diario");
        } else {
            createEnergy(uid, date, morning, afternoon);
            createAlert("success", "Consumo de energía registrado exitosamente.");
        }
        
        await updateExcessUser();
        await chargeDashboard();
    } else {
        alert("Ya hay un registro para ese día");
    }
    
});

document.getElementById("form-limit").addEventListener("submit", async (event) => {
    event.preventDefault();
    let newLimitValue = parseFloat(document.getElementById("form-limit-modified").value);

    await updateLimit(uid, newLimitValue);
    await updateExcessUser();
    await chargeDashboard();
});

document.getElementById("monthChart").addEventListener("change", (event) => {
    let month = new Date(event.target.value + "T00:00:00");
    [daysChart, dataChart, dataPieChart] = getDataForChart(month.getMonth() + 1);
    updateChart(chart, daysChart, dataChart, pieChart, dataPieChart);
});

document.getElementById("selectChart").addEventListener("change", (event) => {
    let lineChart = document.getElementById("historyChart");
    let pieChart = document.getElementById("pieChart");

    if (event.target.value == "line") {
        lineChart.setAttribute("style", "display: block;");
        pieChart.setAttribute("style", "display: none;");
    } else {
        pieChart.setAttribute("style", "display: block;");
        lineChart.setAttribute("style", "display: none;");
    }
});

document.querySelectorAll(".card-details").forEach(element => {
    element.addEventListener("click", () => {window.location.href = "details.html"});
});

/*-------------------------*\
   Funciones
\*-------------------------*/

async function initializeDashboard() {
    setInitialMonth();
    let month = new Date(document.getElementById("monthChart").value + "T00:00:00");
    [daysChart, dataChart, dataPieChart] = getDataForChart(month.getMonth() + 1);
    chart = createChart(daysChart, dataChart);
    pieChart = createPieChart();
    await chargeDashboard();
}

async function chargeDashboard() {
    if ( !limit ) {
        createLimit(uid, 100);
    }

    limit = await getLimit(uid);
    limit = Object.entries(limit)[0][1].limit;
    let average = document.getElementById("consumeAverage");
    let limitDiv = document.getElementById("limitValue");
    let excessDiv = document.getElementById("excessValue");

    listEnergyUser = await getUserEnergy(uid);
    average.innerText = calculateAverage();
    limitDiv.innerText = limit;
    excessDiv.innerHTML = getExcess().length;

    setLastDays();
    let month = new Date(document.getElementById("monthChart").value + "T00:00:00");
    [daysChart, dataChart, dataPieChart] = getDataForChart(month.getMonth() + 1);
    updateChart(chart, daysChart, dataChart, pieChart, dataPieChart);
}

function calculateAverage(){
    if (!listEnergyUser) return 0;
    let arrayEnergy = Object.values(listEnergyUser);
    let average = 0;

    for (let dataEnergy of arrayEnergy) {
        average += dataEnergy.total_kwh;
    }

    average = (average/arrayEnergy.length).toFixed(2);
    return average;
}

function getExcess(){
    if (!listEnergyUser) return [];
    return Object.entries(listEnergyUser).filter(([key, dataEnergy]) => dataEnergy.excess == true);
}

function getDataForChart(month){
    if (!listEnergyUser) return [];
    let dataChart = [];
    let daysChart = [];
    let dataPieChart = [];
    let morning_kwh_total = 0;
    let afternoon_kwh_total = 0;

    let listOrdered = Object.values(listEnergyUser).filter(data => 
        new Date(data.date + "T00:00:00").getMonth() + 1 == month
    );

    // console.log(listOrdered);

    listOrdered.sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let dataEnergy of listOrdered) {
        let totalValue = dataEnergy.total_kwh;
        dataChart.push(totalValue);
        daysChart.push(new Date(dataEnergy.date + "T00:00:00").getDate());
        morning_kwh_total += dataEnergy.morning_kwh;
        afternoon_kwh_total += dataEnergy.afternoon_kwh;
    }

    dataPieChart = [morning_kwh_total, afternoon_kwh_total];
    return [daysChart, dataChart, dataPieChart];
}

function createChart(daysChart, dataChart) {
    const ctx = document.getElementById("historyChart");
    const config = {
        type: 'line',
        data: {
            labels: daysChart,
            datasets: [{
                label: 'kWh Consumidos',
                data: dataChart,
                fill: false,
                borderColor: '#7e9378',
                tension: 0.1
            }] 
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Día' 
                    }
                },
                y: {
                    beginAtZero: true,
                }
            }
        }
    }

    return new Chart(ctx, config);
}

function createPieChart(data) {
    const ctx = document.getElementById("pieChart");
    const config = {
        type: 'pie',
        data: {
            datasets: [{
                label: 'kWh Consumidos',
                data: [20, 50],
                fill: true,
                backgroundColor: [
                    '#7e9378',
                    '#97bbf0'
                ],
                tension: 0.1
            }],
            labels: [
                'Turno de mañana',
                'Turno de tarde'
            ]
        },
        options: {
            responsive: true,
        }
    }

    return new Chart(ctx, config);
}

function updateChart(chart, newLabels, newData, pieChart, dataPieChart) {
    chart.data.labels = newLabels; 
    chart.data.datasets[0].data = newData;
    pieChart.data.datasets[0].data = dataPieChart

    chart.update();
    pieChart.update();
}

async function updateExcessUser() {
    if (!listEnergyUser) return;

    limit = await getLimit(uid);
    limit = Object.entries(limit)[0][1].limit;
    let newExcess = false;

    for (let [id, dataEnergy] of Object.entries(listEnergyUser)) {
        newExcess = (dataEnergy.total_kwh > limit) ? true : false;
        await updateEnergyExcess(uid, id, newExcess);
    }
}

function setInitialMonth(){
    let today = new Date();
    let currentMonth = today.getMonth() + 1;
    let currentYear = today.getFullYear();

    let formattedDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

    document.getElementById("monthChart").value = formattedDate;
}

function setLastDays(){
    if (!listEnergyUser) return;

    let lastDays = document.getElementById("lastDays");
    let listOrdered = Object.values(listEnergyUser);
    listOrdered.sort((a, b) => new Date(b.date) - new Date(a.date));
    lastDays.innerHTML = "";   
    
    let max = listOrdered.length >= 3 ? 3 : listOrdered.length;

    for (let i = 0; i < max; i++ ) {
        let textExcess = listOrdered[i].excess ? "Excede el límite de consumo." : "No excede el límite de consumo."

        lastDays.innerHTML += `<a href="details.html" class="list-group-item list-group-item-action">
                              <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1">Día ${i+1}</h5>
                                <small class="text-muted">${listOrdered[i].date}</small>
                              </div>
                              <p class="mb-1">Turno de mañana: ${listOrdered[i].morning_kwh} kWh. <br>Turno de tarde: ${listOrdered[i].afternoon_kwh} kWh.</p>
                              <small class="text-muted">${textExcess}</small>
                                </a>`
    }
}

function createAlert(alertType, message) {
    let newAlert = document.createElement("div");
    newAlert.className = `alert alert-${alertType} alert-top shadow`;
    newAlert.role = "alert";
    newAlert.textContent = message;

    document.body.prepend(newAlert);

    setTimeout(() => {
        newAlert.remove();
    }, 2500);
}
