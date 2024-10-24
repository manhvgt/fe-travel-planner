/* Global Variables */
const serverUrl_base = 'http://localhost:8080/';
const url_weather = 'weather';
const api_current = 'current';
const api_forecast = 'forecast';

// DOM elements
// Input
const btnGenerateByCity = document.getElementById("btnGenerateByCity");
const inCityName = document.getElementById("inCityName");
// const inFeelings = document.getElementById("inFeelings");
// const btnGenerateForecast = document.getElementById("btnGenerateForecast");
const dpkPlanningDate = document.getElementById("dpkPlanningDate");
// Output (Current)
const outCurrentInfo = document.getElementById("outputCurrentInfo");
const outCountry = document.getElementById("outCountry");
const outCity = document.getElementById("outCity");
const outLocaltime = document.getElementById("outLocaltime");
const outTemp = document.getElementById("outTemp");
const outFeelslike = document.getElementById("outFeelslike");
const outHumidity = document.getElementById("outHumidity");
const outIconImg = document.getElementById("outIconImg");
const outCondition = document.getElementById("outCondition");
// const outFeeling = document.getElementById("outFeeling");
// Output (Forecast)
const outForecastInfo = document.getElementById("forecastInfo");

// Add event listener to get data button
document.addEventListener('DOMContentLoaded', () => {
    // Set default value as today
    setDefaultDate();

    // Add listener
    btnGenerateByCity.addEventListener('click', getDataByCityListener);

});

export function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    dpkPlanningDate.setAttribute("min", today);
    dpkPlanningDate.value = today;
}

export function enableSubmitButton(enable) {
    if(enable) {
        btnGenerateByCity.disabled = false;
        btnGenerateByCity.classList.remove('disabled');
        btnGenerateByCity.textContent = 'Submit';
    } else {
        btnGenerateByCity.disabled = true;
        btnGenerateByCity.classList.add('disabled');
        btnGenerateByCity.textContent = 'Processing...';
    }
}

// Function to handle generate button by City Name
export async function getDataByCityListener(event) {
    // setup
    event.preventDefault();

    // Input validation
    const city = inCityName.value.trim();
    const pickedDate = dpkPlanningDate.value;
    // const feelings = inFeelings.value.trim();
    if(!city || !pickedDate) {
        alert("Please enter city name and pick a date then retry!");
        return;
    }
    // set data
    const rawData = {
        city: city
        ,date: pickedDate
    };

    // get weather data
    try {
        // req data
        enableSubmitButton(false);
        await postWeather(rawData);
        enableSubmitButton(true);
    } 
    catch(error) {
        // Error handling
        console.error("Failed handling data: ", error);
        // alert("Error! Failed to get data! Please check the input and retry!");
        return null;
    }
};

// Function for POST to request for current weather data.
export async function postWeather(rawData) {
    if(!rawData) {
        // alert("Warning! Failed to handling GET data. Please try again!");
        console.error("null input!");
    }

    console.log("rawData: ", rawData);
    // Setup data
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(rawData)
    }

    try {
        // Send rquest
        const url = serverUrl_base + url_weather;
        const response = await fetch(url, requestOptions);

        // check response
        if(!response.ok) {
            console.error(`Ressponse status: ${response.statusText}`);
        }
        const data = await response.json();
        const apiType = data.kpiType;
        await updateGUI_current(data);

        // Check if need update forecast
        if(apiType === api_forecast) {
            await updateGUI_current(data);
        }
        
    }
    catch(error) {
        // Error handling
        console.error("Failed to fetch data: ", error);
    }
};

// Function to update GUI
export async function updateGUI_current(info) {
    if(!info) {
        console.log("null input!");
        return;
    }
    console.log("info: ", info);
    // update GUI
    outCurrentInfo.style.border = "2px solid #444";

    // country, city, localtime, tempc, tempf, feelslikec, feelslikef, humidity, icon, condition, feelings
    outCountry.textContent = 'Country: ' + info.current.country;
    outCity.textContent = 'City: ' + info.current.city;
    outLocaltime.textContent = `Local time: ${info.current.localtime}`;
    outTemp.innerHTML = `<span style="color: blue; font-size: 1.2em">${info.current.tempc}\u00B0C</span>  (${info.current.tempf}\u00B0F)`;
    outHumidity.textContent = `Humidity: ${info.current.humidity}%`;
    outFeelslike.innerHTML = `Feel like: ${info.current.feelslikec}\u00B0C (${info.current.feelslikef}\u00B0F)`;

    outIconImg.src = info.current.icon;
    outCondition.textContent = `${info.current.condition}`;
    // outFeeling.textContent = `Your feeling: ${inFeelings.value.trim()}`;

    // Forecast part
    if(info.apiType === api_forecast) {
        outForecastInfo.style.display = 'none';
        outForecastInfo.innerHTML = ''
        info.forecast.forEach(day => {
            createForecastDay(day);
        });
        outForecastInfo.style.border = "2px solid #444";
        outForecastInfo.offsetHeight; // force re-render
        outForecastInfo.style.display = '';
    }
};

export async function createForecastDay(dayInfo) {
    // outForecastDay
    const dayDiv = document.createElement("div");
    dayDiv.id = "outForecastDay";
    // date
    const dateDiv = document.createElement("div");
    dateDiv.innerHTML = `<span style="color: blue; font-size: 1.1em"> ${dayInfo.date}`;
    dayDiv.appendChild(dateDiv);
    // icon
    const iconDiv = document.createElement("div");
    const iconImg = document.createElement("img");
    iconImg.src = dayInfo.condition_icon;
    iconDiv.appendChild(iconImg);
    dayDiv.appendChild(iconDiv);
    // condition
    const conditionDiv = document.createElement("div");
    conditionDiv.textContent = dayInfo.condition_txt;
    dayDiv.appendChild(conditionDiv);
    // min temp
    const minTempDiv = document.createElement("div");
    minTempDiv.textContent = `Min: ${dayInfo.mintemp_c}\u00B0C (${dayInfo.mintemp_f}\u00B0F)`;
    dayDiv.appendChild(minTempDiv);
    // max temp
    const maxTempDiv = document.createElement("div");
    maxTempDiv.textContent = `Max: ${dayInfo.maxtemp_c}\u00B0C (${dayInfo.maxtemp_f}\u00B0F)`;
    dayDiv.appendChild(maxTempDiv);
    // chance of rain
    const chanceOfRain = document.createElement("div");
    chanceOfRain.textContent = `Rain: ${dayInfo.rain_chance}%`;
    dayDiv.appendChild(chanceOfRain);

    outForecastInfo.appendChild(dayDiv);
}

