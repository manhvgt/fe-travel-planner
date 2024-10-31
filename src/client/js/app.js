/* Global Variables */
const serverUrl_base = 'http://localhost:8080/';
const url_weather = 'weather';
const api_forecast = 'forecast'; // Current weather and forecast
const api_predict = 'predict'; // Predicted forecast
const api_forecast_max_days = 16;
const api_min_days = -1;
const api_max_days = 4;

// For Image viewer
let imgViewerInterval = 3500;
let imgViewerEnable = false;
let imgViewerCount = 16;
let imgViewerSrc = [];
let imgViewerIdx = 0;

// DOM elements
// Input
const btnGenerateByCity = document.getElementById("btnGenerateByCity");
const lblCountdown = document.getElementById("lblPlanningDateCount");
const btnSave = document.getElementById("btnSaveData");
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
// Output (Forecast)
const outForecastInfo = document.getElementById("forecastInfo");
// Output (photos)
const outPhotos = document.getElementById("outPhotos");
const imgViwer = document.getElementById("outImageViewer");

// Add event listener to get data button
document.addEventListener('DOMContentLoaded', () => {
    // Set default value as today
    setDefaultDateAndGui();
    setInterval(switchImage, imgViewerInterval);

    // Add listener
    btnGenerateByCity.addEventListener('click', getDataByCityListener);
    dpkPlanningDate.addEventListener('change', countdownListener);
    btnSave.addEventListener('click', requestCRUDListener);
});

function setDefaultDateAndGui() {
    const today = new Date().toISOString().split('T')[0];
    dpkPlanningDate.setAttribute("min", today);
    dpkPlanningDate.value = today;
    btnSave.style.display = 'none';
    btnSave.disabled = true;
    btnSave.classList.add('disabled');
    document.getElementById("weatherArea").style.display = 'none';
}

function countdownListener(event) {
    event.preventDefault();
    const difDate = dayDifferenceFromToday(dpkPlanningDate.value);
    lblCountdown.innerHTML = `Countdown: <span style="color: blue; font-size: 1.2em">${difDate}</span> days left`;
}

function requestCRUDListener(event) {
    event.preventDefault();
    console.log("Button clicked. Request server to process. (Future function)");
}

// Update GUI while waiting API called and data processing
function updateGUI_processing(isProcessing) {
    if(isProcessing) {
        btnGenerateByCity.disabled = true;
        btnGenerateByCity.classList.add('disabled');
        btnGenerateByCity.textContent = 'Processing...';
        document.body.style.cursor = 'wait';
    } else {
        btnGenerateByCity.disabled = false;
        btnGenerateByCity.classList.remove('disabled');
        btnGenerateByCity.textContent = 'Generate Information';
        document.body.style.cursor = 'default';
    }
}

// Calculation the date
function dayDifferenceFromToday(pickedDate) {
    const todayDate = new Date();
    const tempDate = new Date(pickedDate);
    const diffTime = (tempDate.getTime() - todayDate.getTime());
    const ret = Math.ceil(diffTime / (1000 * 3600 * 24));
    return ret;
}

function dayDifference(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = (endDate.getTime() - startDate.getTime());
    const ret = Math.ceil(diffTime / (1000 * 3600 * 24));
    return ret;
}

// Function to handle generate button by City Name
async function getDataByCityListener(event) {
    // setup
    const inCityName = document.getElementById("inCityName");
    const dpkPlanningDate = document.getElementById("dpkPlanningDate");
    // Input validation
    if(!inCityName.value || !dpkPlanningDate.value) {
        alert("Please enter city name and pick a date then retry!");
        return;
    }
    event.preventDefault();

    const city = inCityName.value.trim();
    const pickedDate = dpkPlanningDate.value;

    // Too long
    const diffDate = dayDifferenceFromToday(pickedDate);
    if(diffDate > api_forecast_max_days) {
        alert(`The date is too far. Currently app supports ${api_forecast_max_days} days from today!`);
        return;
    }

    // set data
    const rawData = {
        city: city
        // ,date: pickedDate
        ,diffDate: diffDate
    };

    // get weather data
    try {
        // req data
        updateGUI_processing(true);
        await postWeather(rawData);
        updateGUI_processing(false);
    } 
    catch(error) {
        // Error handling
        console.error("Failed handling data: ", error);
        // alert("Error! Failed to get data! Please check the input and retry!");
        return null;
    }
};

// Function for POST to request for current weather data.
async function postWeather(rawData) {
    if(!rawData) {
        // alert("Warning! Failed to handling GET data. Please try again!");
        console.error("null input!");
        return;
    }

    // console.log("rawData: ", rawData);
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
            alert("Failed to get data. Something went wrong on the server!");
            return;
        }
        const data = await response.json();
        // Update current weather info
        await updateGUI(data);
    }
    catch(error) {
        // Error handling
        console.error("Failed to fetch data: ", error);
    }
};

async function updateGUI(info) {
    if(!info) {
        console.error("null input!");
        return;
    }
    console.log("updateGUI info: ", info);
    const apiType = info.apiType;

    // Check type of update forecast
    if(apiType === api_forecast) {
        updateGUI_reset();
        // Update current
        updateGUI_current(info);
        // Update using Weather API
        updateGUI_forecast(info);
    } else if (apiType === api_predict) {
        updateGUI_reset();
        // Update forecast base on predicted forecast
        updateGUI_predict(info);
    }
    // Update photos
    if(info.photos.length > 0) {
        updateGUI_photos(info.photos)
    }

    // Button save
    btnSave.style.display = '';
    btnSave.disabled = false;
    btnSave.classList.remove('disabled');
    document.getElementById("weatherArea").style.display = '';
}

async function updateGUI_reset() {
    outCurrentInfo.style.display = 'none';
    outForecastInfo.style.display = 'none';
    outForecastInfo.innerHTML = '';
    outPhotos.style.display = 'none';
    imgViewerEnable = false;
    imgViewerSrc = [];
    document.getElementById("weatherArea").style.display = 'none';
}

// Function to update GUI
async function updateGUI_current(info) {
    if(!info) {
        console.error("null input!");
        return;
    }
    // country, city, localtime, tempc, tempf, feelslikec, feelslikef, humidity, icon, condition
    outCountry.textContent = 'Country: ' + info.current.country;
    outCity.textContent = 'City: ' + info.current.city;
    outLocaltime.textContent = `Local time: ${info.current.localtime}`;
    outTemp.innerHTML = `<span style="color: blue; font-size: 1.2em">${info.current.tempc}\u00B0C</span>  (${info.current.tempf}\u00B0F)`;
    outHumidity.textContent = `Humidity: ${info.current.humidity}%`;
    outFeelslike.innerHTML = `Feel like: ${info.current.feelslikec}\u00B0C (${info.current.feelslikef}\u00B0F)`;

    outIconImg.src = info.current.icon;
    outIconImg.alt = info.current.condition;
    outCondition.textContent = `${info.current.condition}`;

    // update GUI
    outCurrentInfo.style.border = "2px solid #444";
    outForecastInfo.offsetHeight; // force re-render
    outCurrentInfo.style.display = '';
};

// Forecast infomation update by weatherAPI
async function updateGUI_forecast(info) {
    info.forecast.forEach(day => {
        createForecastDay(day);
    });
    outForecastInfo.style.border = "2px solid #444";
    outForecastInfo.offsetHeight; // force re-render
    outForecastInfo.style.display = '';
}

async function createForecastDay(dayInfo) {
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
    iconImg.alt = dayInfo.condition;
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
    // add child
    
    // check
    const dayDiff = dayDifference(dpkPlanningDate.value, dayInfo.date);
    if( api_min_days <= dayDiff && dayDiff <= api_max_days ) {
        dayDiv.style.display = '';
    } else {
        dayDiv.style.display = 'none';
    }
    outForecastInfo.appendChild(dayDiv);
}

async function updateGUI_predict(info) {
    // console.log("updateGUI_predict start: ", info);
    // Same interface -> reuse function
    updateGUI_forecast(info);
}


async function updateGUI_photos(photos) {
    outPhotos.style.display = 'none';
    imgViewerEnable = true;
    imgViewerCount = photos.length;
    imgViewerSrc = Array.from(photos);
    outPhotos.style.border = "2px solid #444";
    outPhotos.offsetHeight; // force re-render
    outPhotos.style.display = 'block';
    switchImage();
}

function switchImage() {
    if(imgViewerEnable) {
        imgViewerIdx = (imgViewerIdx + 1) % imgViewerCount;
        imgViwer.src = imgViewerSrc[imgViewerIdx].previewURL;
    }
}

export {getDataByCityListener, postWeather, updateGUI_processing, dayDifferenceFromToday};