/* Global Variables */
const serverUrl_base = 'http://localhost:8080/';
const url_weather = 'weather';
const api_forecast = 'forecast'; // Current weather and forecast
const api_predict = 'predict'; // Predicted forecast
const api_forecast_max_days = 16;
const api_min_days = -1;
const api_max_days = 3;
const api_max_photos = 4;

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
// Output (photos)
const outPhotos = document.getElementById("outPhotos");

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

// Update GUI while waiting API called and data processing
export function updateGUI_processing(isProcessing) {
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
    // Too long
    const diffDate = dayDifferenceFromToday(pickedDate);
    if(diffDate > api_forecast_max_days) {
        alert(`The date is too far. Currently app supports ${api_forecast_max_days} days`);
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
export async function postWeather(rawData) {
    if(!rawData) {
        // alert("Warning! Failed to handling GET data. Please try again!");
        console.error("null input!");
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

export async function updateGUI(info) {
    if(!info) {
        console.error("null input!");
        return;
    }
    console.log("updateGUI info: ", info);
    const apiType = info.apiType;

    // Update current
    updateGUI_current(info);

    // Check type of update forecast
    if(apiType === api_forecast) {
        // Update using Weather API
        updateGUI_forecast(info);
    } else if (apiType === api_predict) {
        // Update forecast base on predicted forecast
        updateGUI_predict(info);
    }

    // Update photos
    if(info.photos.length > 0) {
        updateGUI_photos(info.photos)
    }

}

// Function to update GUI
export async function updateGUI_current(info) {
    if(!info) {
        console.error("null input!");
        return;
    }
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
    outIconImg.alt = info.current.condition;
    outCondition.textContent = `${info.current.condition}`;
    // outFeeling.textContent = `Your feeling: ${inFeelings.value.trim()}`;
};

// Forecast infomation update by weatherAPI
export async function updateGUI_forecast(info) {
    outForecastInfo.style.display = 'none';
    outForecastInfo.innerHTML = ''    
    info.forecast.forEach(day => {
        createForecastDay(day);
    });
    outForecastInfo.style.border = "2px solid #444";
    outForecastInfo.offsetHeight; // force re-render
    outForecastInfo.style.display = '';
}

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

export async function updateGUI_predict(info) {
    // console.log("updateGUI_predict start: ", info);
    // Same interface -> reuse function
    updateGUI_forecast(info);
}


export async function updateGUI_photos(photos) {
    outPhotos.style.display = 'none';
    outPhotos.innerHTML = '';    
    let count = api_max_photos > photos.length ? photos.length : api_max_photos;
    let i = 0;
    photos.forEach(photo => {
        createPhotoItem(photo, i);
        i++;
    });
    outPhotos.style.border = "2px solid #444";
    outPhotos.offsetHeight; // force re-render
    outPhotos.style.display = '';
}

export async function createPhotoItem(photo, i) {
    const photoDiv = document.createElement("figure");
    photoDiv.id = "outPhoto";
    // Img
    const img = document.createElement("img");
    img.src = photo.previewURL;
    img.alt = "No Image";
    photoDiv.appendChild(img);
    
    // caption
    let arr = photo.pageURL.split('/');
    let txt = arr[arr.length-1].split('-');
    txt.pop();
    const caption = document.createElement("figcaption");
    caption.textContent = txt.join(' ');
    photoDiv.appendChild(caption);

    outPhotos.appendChild(photoDiv);
    if(i>api_max_photos) { photoDiv.style.display = 'none'; }
}
