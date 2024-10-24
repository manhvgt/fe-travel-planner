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
const API_KEY = process.env.API_KEY;
const API_URL_BASE_CURRENT = process.env.API_URL_BASE_CURRENT;
const API_URL_BASE_FORECAST = process.env.API_URL_BASE_FORECAST;
const FORECAST_MAX_DAY = process.env.FORECAST_MAX_DAY;
const API_CURRENT = 'current'
const API_FORECAST = 'forecast'

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
    if(diffDate < 1) {
        // Get current weather url
        apiUrl = API_URL_BASE_CURRENT + API_KEY + `&q=${city}&aqi=no`;
        apiType = API_CURRENT;
    }
    else {
        // Get forecast weather data url
        const days = diffDate > FORECAST_MAX_DAY ? FORECAST_MAX_DAY : diffDate;
        apiUrl = API_URL_BASE_FORECAST + API_KEY + `&q=${city}&days=${days}&aqi=no&alerts=no`;
        apiType = API_FORECAST;
    }
    // apiUrl
    console.log("apiUrl: ", apiUrl);

    try {
        // call API
        const response = await fetch(apiUrl, {
            method: 'GET'
        });

        // Process response
        if(!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const rawData = await response.json();

        const resData = await ConvertWeatherData(apiType, rawData);
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

    // Return value
    const restData = {
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
        restData.forecast = forecast;
    }

    return restData;
}

function dayDifferenceFromToday(pickedDate) {
    const todayDate = new Date();
    const tempDate = new Date(pickedDate);
    const diffTime = (tempDate.getTime() - todayDate.getTime());
    const ret = Math.ceil(diffTime / (1000 * 3600 * 24));
    return ret;
}

