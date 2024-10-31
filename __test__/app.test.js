/**
 * @jest-environment jsdom
 */

// import * as app from '../src/client/js/app.js';
import { getDataByCityListener, postWeather, dayDifferenceFromToday } from '../src/client/js/app.js';

describe('Weather App Functions', () => {
    beforeEach(() => {
        // Set up DOM elements
        document.body.innerHTML = `
            <input type="text" id="inCityName">
            <input type="date" id="dpkPlanningDate" name="dpkPlanningDate">
            <div class="holder generate">
                <button id="btnGenerateByCity" type = "submit">Generate Information</button>
            </div>
            <div id="outputCurrentInfo">
                <div id="weatherIllustration">
                    <div id="outIcon">
                        <img id="outIconImg">
                    </div>
                    <div id="outCondition"></div>
                    <div id="outTemp"></div>
                </div>
                <div id="weatherInfo">
                    <div id="outCountry"></div>
                    <div id="outCity"></div>
                    <div id="outLocaltime"></div>
                    <div id="outHumidity"></div>
                    <div id="outFeelslike"></div>
                </div>
            </div>
            <div id="forecastInfo"></div>
            <div id="outPhotos">
                <img id="outImageViewer" alt="Image Viewer">
                <div id="imgProgressBar"></div>
            </div>
        `;
        global.inCityName = document.getElementById("inCityName");
        global.dpkPlanningDate = document.getElementById("dpkPlanningDate");
        global.btnGenerateByCity = document.getElementById("btnGenerateByCity");
        global.outCurrentInfo = document.getElementById("outputCurrentInfo");
        global.outCountry = document.getElementById("outCountry");
        global.outCity = document.getElementById("outCity");
        global.outLocaltime = document.getElementById("outLocaltime");
        global.outTemp = document.getElementById("outTemp");
        global.outFeelslike = document.getElementById("outFeelslike");
        global.outHumidity = document.getElementById("outHumidity");
        global.outIconImg = document.getElementById("outIconImg");
        global.outCondition = document.getElementById("outCondition");
        global.outForecastInfo = document.getElementById("forecastInfo");
        global.outPhotos = document.getElementById("outPhotos");
        global.imgViwer = document.getElementById("outImageViewer");

        global.alert = jest.fn();
    });

    test('getDataByCityListener handles empty inputs', async () => {
        inCityName.value = '';
        dpkPlanningDate.value = '';

        const event = { preventDefault: jest.fn() };
        
        await getDataByCityListener(event);

        expect(alert).toHaveBeenCalledWith('Please enter city name and pick a date then retry!');
    });

    test('getDataByCityListener handles valid inputs', async () => {
        inCityName.value = 'Hanoi';
        let aDay = new Date();
        aDay.setDate(aDay.getDate() + 2);
        dpkPlanningDate.value = aDay.toISOString().split('T')[0];

        // Mock postWeather function
        // const mockPostWeather = jest.spyOn(app, 'postWeather');
        // const mockDayDifferenceFromToday = jest.spyOn(app, 'dayDifferenceFromToday');

        const event = { preventDefault: jest.fn() };
        await getDataByCityListener(event);

        expect(event.preventDefault).toHaveBeenCalled();
        // expect(mockDayDifferenceFromToday).toHaveBeenCalled();
        // expect(mockPostWeather).toHaveBeenCalled();
    });

    test('postWeather handles null input', async () => {
        console.error = jest.fn(); // Mock console.error to avoid actual logging

        await postWeather(null);

        expect(console.error).toHaveBeenCalledWith('null input!');
    });

    test('postWeather sends request with valid data', async () => {
        const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const rawData = { city: 'Hanoi', diffDate: 2 };
        await postWeather(rawData);

        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawData)
        }));

        expect(mockResponse.json).toHaveBeenCalled();
    });

    test('postWeather handles server error response', async () => {
        const mockResponse = { ok: false, statusText: 'Internal Server Error' };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const rawData = { city: 'Hanoi', diffDate: 2 };
        await postWeather(rawData);

        expect(alert).toHaveBeenCalledWith('Failed to get data. Something went wrong on the server!');
    });
});
