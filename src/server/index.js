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
const API_CLIMATE = 'climate'; // climate normal
const API_PHOTOS_MAX = 16;

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

// Callback function to complete POST '/weather'
app.post('/weather', async (req, res) => {
    const reqBody = req.body;
    if( !reqBody || Object.keys(reqBody).length < 2 ){
        res.status(400).json({ error: 'Bad Request', message: 'city and diffdate are required.' });
        return;
    }
    const { city ,diffDate } = req.body;
    if( city === null || diffDate === null ){
        res.status(400).json({ error: 'Bad Request', message: 'city and diffdate are required.' });
        return;
    }
    console.log(req.body);

    // Based on date of difference call diff api
    let apiType = "";

    // Always acquire current or forecast
    let rawData = await getCurrentForecast(city, diffDate);
    if(rawData === null) {
        // create NG response
        res.status(500).json({ error: 'Processing error', message: 'Something went wrong on the server.' });
        return;
    }

    // Within max days
    if(diffDate < FORECAST_MAX_DAY) {
        apiType = API_FORECAST;
    }
    // max days or more
    else {
        apiType = API_PREDICT;
        // Call API to Get Coordinates From City Name
        const coordinates = await getCoordinatesByCity(city);
        if(coordinates === null || coordinates === undefined || coordinates === "") {
            // create NG response
            res.status(500).json({ error: 'Processing error', message: 'Something went wrong on the server.' });
            return;
        }
        // console.log("coordinates", coordinates);

        // Predicted forecast data
        rawData.forecast = await getPredictedForecast(coordinates.lat, coordinates.lon, FORECAST_MAX_DAY + diffDate);
        if(rawData.forecast === null || rawData.forecast === undefined || rawData.forecast === "") {
            // create NG response
            res.status(500).json({ error: 'Processing error', message: 'Something went wrong on the server.' });
            return;
        }
    }

    // Convert data
    const resData = await ConvertWeatherData(apiType, rawData);

    // Weather and forecast info are acquired and request for photos
    const photos = await getPhotosOfCity(city);
    resData.photos = photos;
    // console.log("resData.photos: ", resData.photos);
    res.json(resData);
});

// Get predicted forecast using http://api.weatherapi.com
async function getCurrentForecast(city, days) {
    // default apiUrl for current weather only
    let apiUrl = API_URL_BASE_CURRENT + API_KEY + `&q=${city}&aqi=no`;

    if (days < FORECAST_MAX_DAY) {
        // get forecast instead
        apiUrl = API_URL_BASE_FORECAST + API_KEY + `&q=${city}&days=${FORECAST_MAX_DAY}&aqi=no&alerts=no`;
    }
    // console.log("getCurrentForecast apiUrl: ", apiUrl);

    try {
        // call API
        let requestOptions = {
            method: 'GET'
        }
        const response = await fetch(apiUrl, requestOptions);

        // Process response
        if(!response.ok) {
            console.error(`Failed to fetch data: Code: ${response.status}, (${response.text})`);
            return null;
        }
        const rawData = await response.json();
        // console.log("getCurrentForecast rawData: ", rawData);
        return rawData;
    }
    catch(error) {
        // Error handling
        console.error("Failed to fetch data: ", error);
        return null;
    }
}

// Get predicted forecast using http://api.weatherbit.io
async function getPredictedForecast(lat, lon, days) {
    // default apiUrl for current weather only
    const apiUrl = process.env.API_URL_WEATHER_BIT +
    `&lat=${lat}&lon=${lon}&days=${days}&key=${process.env.API_KEY_WEATHER_BIT}`;
    // console.log("getPredictedForecast apiUrl: ", apiUrl);

    try {
        // call API
        const requestOptions = {
            method: 'GET'
        }
        const response = await fetch(apiUrl, requestOptions);

        // Process response
        if(!response.ok) {
            console.error(`Failed to fetch data: Code: ${response.status}, (${response.text})`);
            return null;
        }
        const rawData = await response.json();
        // console.log("getPredictedForecast rawData: ", rawData);
        return rawData;
    }
    catch(error) {
        // Error handling
        console.error("Failed to fetch data: ", error);
        return null;
    }
}

// Convert raw data to response format
async function ConvertWeatherData(apiType, rawData) {
    if(!rawData) {
        console.error("null input!");
    }
    // console.log("ConvertWeatherData rawData: ", rawData);

    let resData = {};
    // Return value
    resData = {
        apiType: apiType
    };

    let forecast = [];
    // Forecast
    if(apiType == API_FORECAST) {
        // Create Current
        resData.current = {
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
        // Create forecast
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
        rawData.forecast.data.forEach(day => {
            const dayForecast = {
                date: day.datetime
                ,maxtemp_c: day.max_temp
                ,maxtemp_f: celsiusToFahrenheit(day.max_temp).toFixed(2)
                ,mintemp_c: day.min_temp
                ,mintemp_f: celsiusToFahrenheit(day.min_temp).toFixed(2)
                ,condition_icon: getIconUrl(day.weather.icon)
                ,condition_txt: day.weather.description
                ,rain_chance: day.pop
            }
            forecast.push(dayForecast);
            // console.log("dayForecast: ", dayForecast);
        });
        resData.forecast = forecast;
    }

    // Return
    return resData;
}

// convert city names to latitude and longitude coordinates using API https://api.geoapify.com
async function getCoordinatesByCity(cityName) {
    const apiUrl = process.env.API_URL_GEO + `${cityName}&apiKey=${process.env.API_KEY_GEO}`;
    // console.log(apiUrl);
    const options = {
        method: 'GET'
    }
    let lat = 0, lon = 0;

    // fetch
    try {
        const response = await fetch(apiUrl, options);

        // check response
        if(!response.ok) {
            console.error(`Failed to fetch data: Code: ${response.status}, (${response.text})`);
            return null
        }
        const rawData = await response.json();

        // Get info
        if(rawData.features.length > 0) {
            // console.log("rawData.features[0] ==", rawData.features[0].properties);
            lat = rawData.features[0].properties.lat;
            lon = rawData.features[0].properties.lon;
        }
    }
    catch(error) {
        // Error handling
        console.error("Failed to fetch data: ", error);
        return null;
    }
    return {lat: lat, lon: lon};
}

// Get some photos of the place using API https://pixabay.com/
async function getPhotosOfCity(cityName) {
    // console.log("getPhotosOfCity ", cityName);
    const apiUrl = process.env.API_URL_PIXABAY + process.env.API_KEY_PIXABAY + `&q=${cityName}`;
    const options = {
        method: 'GET'
    }
    let photos = [];

    // fetch
    try {
        const response = await fetch(apiUrl, options);

        // check response
        if(!response.ok) {
            console.error(`Failed to fetch data: Code: ${response.status}, (${response.text})`);
            return null;
        }
        const rawData = await response.json();

        // check response data
        if(rawData.hits.length > 0) {
            const count = API_PHOTOS_MAX <= rawData.hits.length ? API_PHOTOS_MAX : rawData.hits.length;
            for (let i = 0; i < count; i++) {
                const photo = {
                    pageURL: rawData.hits[i].pageURL
                    ,previewURL: rawData.hits[i].previewURL
                }
                photos.push(photo);
            }
        }
    }
    catch(error) {
        // Error handling
        console.error("Failed to fetch data: ", error);
    }
    return photos;
}

// Weatherbit.io not support Fahrenheit, convert instead
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Callback function to complete GET '/photo'
app.post('/photo', async (req, res) => {
    console.log("req: ", req.body);
});

// Weatherbit.io not support icon url, using other instead
function getIconUrl(code) {
    const icons = {
        a01d: "https://i.ibb.co/wWfKNkz/a05d.png"
        ,a01n: "https://i.ibb.co/2WqcdmY/a05n.png"
        ,a02d: "https://i.ibb.co/wWfKNkz/a05d.png"
        ,a02n: "https://i.ibb.co/2WqcdmY/a05n.png"
        ,a03d: "https://i.ibb.co/wWfKNkz/a05d.png"
        ,a03n: "https://i.ibb.co/2WqcdmY/a05n.png"
        ,a04d: "https://i.ibb.co/wWfKNkz/a05d.png"
        ,a04n: "https://i.ibb.co/2WqcdmY/a05n.png"
        ,a05d: "https://i.ibb.co/wWfKNkz/a05d.png"
        ,a05n: "https://i.ibb.co/2WqcdmY/a05n.png"
        ,a06d: "https://i.ibb.co/wWfKNkz/a05d.png"
        ,a06n: "https://i.ibb.co/2WqcdmY/a05n.png"
        ,c01d: "https://i.ibb.co/nLGhTrX/c01d.png"
        ,c01n: "https://i.ibb.co/1QvTwHd/c01n.png"
        ,c02d: "https://i.ibb.co/n61wCqf/c02d.png"
        ,c02n: "https://i.ibb.co/CQDt1d2/c02n.png"
        ,c03d: "https://i.ibb.co/MfTkGfz/c03d.png"
        ,c03n: "https://i.ibb.co/KWmBCyq/c03n.png"
        ,c04d: "https://i.ibb.co/crp730Y/c04d.png"
        ,c04n: "https://i.ibb.co/crp730Y/c04d.png"
        ,d01d: "https://i.ibb.co/2cmdjm6/d03n.png"
        ,d01n: "https://i.ibb.co/2cmdjm6/d03n.png"
        ,d02d: "https://i.ibb.co/2cmdjm6/d03n.png"
        ,d02n: "https://i.ibb.co/2cmdjm6/d03n.png"
        ,d03d: "https://i.ibb.co/2cmdjm6/d03n.png"
        ,d03n: "https://i.ibb.co/2cmdjm6/d03n.png"
        ,f01d: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,f01n: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,r01d: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,r01n: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,r02d: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,r02n: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,r03d: "https://i.ibb.co/ftNpXP7/r03n.png"
        ,r03n: "https://i.ibb.co/ftNpXP7/r03n.png"
        ,r04d: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,r04n: "https://i.ibb.co/NSXnwFs/r06n.png"
        ,r05d: "https://i.ibb.co/yp5nVMQ/r05d.png"
        ,r05n: "https://i.ibb.co/NSXnwFs/r06n.png"
        ,r06d: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,r06n: "https://i.ibb.co/NSXnwFs/r06n.png"
        ,s01d: "https://i.ibb.co/JtxkpZ7/s04d.png"
        ,s01n: "https://i.ibb.co/Qm10p7m/s04n.png"
        ,s02d: "https://i.ibb.co/gPpmK7y/s03n.png"
        ,s02n: "https://i.ibb.co/gPpmK7y/s03n.png"
        ,s03d: "https://i.ibb.co/gPpmK7y/s03n.png"
        ,s03n: "https://i.ibb.co/gPpmK7y/s03n.png"
        ,s04d: "https://i.ibb.co/JtxkpZ7/s04d.png"
        ,s04n: "https://i.ibb.co/Qm10p7m/s04n.png"
        ,s05d: "https://i.ibb.co/LSSbtM7/s05n.png"
        ,s05n: "https://i.ibb.co/LSSbtM7/s05n.png"
        ,s06d: "https://i.ibb.co/4Z1Sd5V/s06d.png"
        ,s06n: "https://i.ibb.co/4Z1Sd5V/s06d.png"
        ,t01d: "https://i.ibb.co/bgX9VJK/t03d.png"
        ,t01n: "https://i.ibb.co/Vg8DsgQ/t03n.png"
        ,t02d: "https://i.ibb.co/bgX9VJK/t03d.png"
        ,t02n: "https://i.ibb.co/Vg8DsgQ/t03n.png"
        ,t03d: "https://i.ibb.co/bgX9VJK/t03d.png"
        ,t03n: "https://i.ibb.co/Vg8DsgQ/t03n.png"
        ,t04d: "https://i.ibb.co/NFLX7GG/t05d.png"
        ,t04n: "https://i.ibb.co/kGMnGCS/t05n.png"
        ,t05d: "https://i.ibb.co/NFLX7GG/t05d.png"
        ,t05n: "https://i.ibb.co/kGMnGCS/t05n.png"
        ,u00d: "https://i.ibb.co/HX0bZQK/u00n.png"
        ,u00n: "https://i.ibb.co/HX0bZQK/u00n.png"
    }
    return icons[code];
}

// Export for testing
module.exports = app;