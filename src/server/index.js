// Require Express to run server and routes
var path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

// Start up an instance of app
const app = express();

// Cors for cross origin allowance
const cors = require('cors');
app.use(cors());

// Middleware
// Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.json());

// Initialize the main project folder
app.use(express.static('dist'));
console.log(__dirname);

// Global Variables
const API_KEY = process.env.API_KEY_WEATHER_COM;
const API_URL_BASE_CURRENT = process.env.API_URL_BASE_CURRENT;
const API_URL_BASE_FORECAST = process.env.API_URL_BASE_FORECAST;
const FORECAST_MAX_DAY = process.env.FORECAST_MAX_DAY;
const API_FORECAST = 'forecast'; // Current weather and forecast
const API_PREDICT = 'predict'; // Predicted forecast

// Setup Server
const hostname = process.env.HOST_NAME;;
const port = process.env.PORT;
app.listen(port, listening);
function listening() {
    console.log(`Server running at ${hostname}:${port}`);
};

// Callback function to complete GET '/weather'
app.get('/weather', async (req, res) => {
    console.log("req: ", req.body);
    res.send(projectData);
});

/* Using https://weatherapi.com */
// Callback function to complete POST '/weather'
app.post('/weather', async (req, res) => {
    console.log(req.body);
    const { city, date } = req.body;

    // if today -> request for current data
    const diffDate = dayDifferenceFromToday(date);

    // Based on date of difference call diff api
    let apiUrl = "";
    let apiType = "";
    let apiRequestOptions = {
        method: 'GET'
    }

    // Within 3 days
    if(diffDate < FORECAST_MAX_DAY) {
        // Get forecast weather data url
        const days = FORECAST_MAX_DAY;
        apiUrl = API_URL_BASE_FORECAST + API_KEY + `&q=${city}&days=${days}&aqi=no&alerts=no`;
        apiType = API_FORECAST;
        
    } 
    // 3 days or more
    else {
        console.log("3 days or more. diffDate = ", diffDate);
        // Get Coordinates From City Name
        const coordinates = await getCoordinatesByCity(city);
        console.log("coordinates", coordinates);

        // Get Weather Forecast from Coordinates setup
        apiUrl = API_URL_BASE_CURRENT + API_KEY + `&q=${city}&aqi=no`;
        apiType = API_PREDICT;
    }
    // apiUrl
    console.log("apiUrl: ", apiUrl);

    try {
        // call API
        const response = await fetch(apiUrl, apiRequestOptions);

        // Process response
        if(!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const rawData = await response.json();
        const resData = await ConvertWeatherData(apiType, rawData);
        
        // Get some picture of the place
        const photos = getPhotosOfCity(city);
        resData.photos = photos;

        console.log("resData: \n", resData);
        res.json(resData);
    }
    catch(error) {
        // Error handling
        console.error("Failed to fetch data: ", error);
    }
});

async function ConvertWeatherData(apiType, rawData) {
    if(!rawData) {
        console.error("null input!");
    }
    // console.log("rawData: ", rawData);
    let resData = {};
    // Return value
    resData = {
        apiType: apiType
        ,current: {
            country: rawData.location.country
            ,city: rawData.location.name
            ,localtime: rawData.location.localtime
            ,tempc: rawData.current.temp_c
            ,tempf: rawData.current.temp_f
            ,feelslikec: rawData.current.feelslike_c
            ,feelslikef: rawData.current.feelslike_f
            ,humidity: rawData.current.humidity
            ,icon: rawData.current.condition.icon
            ,condition: rawData.current.condition.text
        }
    };

    // Forecast
    if(apiType == API_FORECAST) {
        // Create forecast
        const forecast = [];
        rawData.forecast.forecastday.forEach(day => {
            const dayForecast = {
                date: day.date
                ,maxtemp_c: day.day.maxtemp_c
                ,maxtemp_f: day.day.maxtemp_f
                ,mintemp_c: day.day.mintemp_c
                ,mintemp_f: day.day.mintemp_f
                ,condition_icon: day.day.condition.icon
                ,condition_txt: day.day.condition.text
                ,rain_chance: day.day.daily_chance_of_rain
            }
            forecast.push(dayForecast);
        });
        resData.forecast = forecast;
    }
    // Predicted forecast
    else if(apiType == API_PREDICT) {

    }

    // Return
    return resData;
}

// Calculation the date
function dayDifferenceFromToday(pickedDate) {
    const todayDate = new Date();
    const tempDate = new Date(pickedDate);
    const diffTime = (tempDate.getTime() - todayDate.getTime());
    const ret = Math.ceil(diffTime / (1000 * 3600 * 24));
    return ret;
}

// convert city names to latitude and longitude coordinates
async function getCoordinatesByCity(cityName) {
    console.log("getCoordinatesByCity ", cityName);
    return {lat: 1, lon: 2};
}

// Get some photos of the place
async function getPhotosOfCity(cityName) {
    console.log("getPhotosOfCity ", cityName);
    return {url: "photoURL"};
}
