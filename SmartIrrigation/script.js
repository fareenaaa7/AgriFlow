async function generateSchedule() {

    const crop = document.getElementById("crop").value;
    const stage = document.getElementById("stage").value;
    const soil = document.getElementById("soil").value;
    const location = document.getElementById("location").value.trim();

    const result = document.getElementById("result");


    // Check inputs

    if (
        crop === "" ||
        stage === "" ||
        soil === "" ||
        location === ""
    ) {

        result.innerHTML = `
            <p>⚠️ Please fill in all the details.</p>
        `;

        return;
    }


    result.innerHTML = `
        <p class="loading">
            🌦️ Checking weather conditions...
        </p>
    `;


    try {

        // ------------------------------------------------
        // STEP 1: Convert location into latitude & longitude
        // ------------------------------------------------

        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {

            throw new Error("Location service unavailable");

        }

        const geoData = await geoResponse.json();


        if (
            !geoData.results ||
            geoData.results.length === 0
        ) {

            result.innerHTML = `
                <p>❌ Location not found.</p>
                <p>Please enter a valid city or village name.</p>
            `;

            return;
        }


        const latitude = geoData.results[0].latitude;
        const longitude = geoData.results[0].longitude;

        const placeName = geoData.results[0].name;


        // ------------------------------------------------
        // STEP 2: Get weather forecast
        // ------------------------------------------------

        const weatherURL =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,precipitation_probability_max&forecast_days=1&timezone=auto`;


        const weatherResponse =
            await fetch(weatherURL);


        if (!weatherResponse.ok) {

            throw new Error("Weather service unavailable");

        }


        const weatherData =
            await weatherResponse.json();


        const rainfall =
            weatherData.daily.precipitation_sum[0];


        const rainProbability =
            weatherData.daily.precipitation_probability_max[0];


        // ------------------------------------------------
        // STEP 3: PREDEFINED IRRIGATION RULES
        // ------------------------------------------------

        let days;
        let water;

        if (soil === "wet") {

            days = 4;
            water = "Low";

        }

        else if (soil === "moist") {

            days = 3;
            water = "Moderate";

        }

        else {

            days = 2;
            water = "High";

        }


        // Growth stage rule

        if (stage === "flowering") {

            days = Math.max(1, days - 1);

        }


        if (stage === "maturity") {

            days = days + 1;

        }


        // ------------------------------------------------
        // STEP 4: WEATHER-BASED DECISION
        // ------------------------------------------------

        let recommendation;
        let status;


        if (rainfall >= 5) {

            status = "🌧️ Rainfall Expected";

            recommendation =
                "Postpone irrigation because sufficient rainfall is expected today.";

        }

        else if (
            rainfall > 0 &&
            rainProbability >= 50
        ) {

            status = "🌦️ Possible Rainfall";

            recommendation =
                "Consider postponing irrigation and monitor the weather.";

        }

        else if (soil === "dry") {

            status = "☀️ Low Rainfall";

            recommendation =
                "Irrigation is recommended because the soil is dry and significant rainfall is not expected.";

        }

        else {

            status = "🌱 Suitable Conditions";

            recommendation =
                "Follow the recommended irrigation schedule and monitor soil condition.";

        }


        // ------------------------------------------------
        // STEP 5: DISPLAY RESULT
        // ------------------------------------------------

        result.innerHTML = `

            <div class="weather-result">

                <h3>
                    🌦️ Weather Information
                </h3>

                <p>
                    📍 Location:
                    <b>${placeName}</b>
                </p>

                <p>
                    🌧️ Expected Rainfall:
                    <b>${rainfall} mm</b>
                </p>

                <p>
                    ☁️ Rain Probability:
                    <b>${rainProbability}%</b>
                </p>

            </div>


            <div class="irrigation-result">

                <h3>
                    💧 Recommended Irrigation Plan
                </h3>

                <p>
                    🌾 Crop:
                    <b>${crop}</b>
                </p>

                <p>
                    🌱 Growth Stage:
                    <b>${stage}</b>
                </p>

                <p>
                    🪨 Soil Condition:
                    <b>${soil}</b>
                </p>

                <p>
                    ⏱️ Suggested Interval:
                    <b>Every ${days} days</b>
                </p>

                <p>
                    💧 Water Requirement:
                    <b>${water}</b>
                </p>

                <hr>

                <h3>
                    ${status}
                </h3>

                <p class="recommendation">
                    ${recommendation}
                </p>

            </div>

        `;

    }


    catch (error) {

        console.error(error);

        result.innerHTML = `

            <p>
                ❌ Unable to fetch weather information.
            </p>

            <p>
                Please check your location and internet connection.
            </p>

        `;

    }

}