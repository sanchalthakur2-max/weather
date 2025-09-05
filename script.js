const userlocation = document.getElementById("userlocation"),
    converter = document.getElementById("converter"),
    weatherIcon = document.querySelector(".weatherIcon"),
    temperature = document.querySelector(".temperature"),
    feelslike = document.querySelector(".feelsLike"),
    description = document.querySelector(".description"),
    dayEl = document.querySelector(".day"),
    dateEl = document.querySelector(".date"),
    timeEl = document.querySelector(".time"),
    city = document.querySelector(".city"),
    HValue = document.getElementById("HValue"),
    WValue = document.getElementById("WValue"),
    SRValue = document.getElementById("SRValue"),
    SSValue = document.getElementById("SSValue"),
    CValue = document.getElementById("CValue"),
    VValue = document.getElementById("VValue"),
    PValue = document.getElementById("PValue"),
    Forecast = document.querySelector(".forecast");

const WEATHER_API_ENDPOINT =
    `https://api.openweathermap.org/data/2.5/weather?appid=7c06e059780742dd65003faa1ab7570c&units=metric&q=`;

const FORECAST_API_ENDPOINT =
    `https://api.openweathermap.org/data/2.5/forecast?appid=7c06e059780742dd65003faa1ab7570c&units=metric&q=`;

function findUserLocation() {
    const cityName = encodeURIComponent(userlocation.value.trim());

    if (!cityName) {
        alert("Please enter a city name!");
        return;
    }

    fetch(WEATHER_API_ENDPOINT + cityName)
        .then((response) => response.json())
        .then((weatherData) => {
            if (weatherData.cod != 200) {
                alert(weatherData.message);
                return;
            }

            console.log("Weather endpoint data:", weatherData);

            // City + Icon
            city.innerHTML = `${weatherData.name}, ${weatherData.sys.country}`;
            weatherIcon.style.background = `url(https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png) no-repeat center/contain`;

            // Date/Day/Time
            updateDateTime(weatherData.timezone);

            // Current temp + desc
            temperature.innerHTML = weatherData.main.temp + "°C";
            feelslike.innerHTML = "Feels like: " + weatherData.main.feels_like + "°C";
            const iconCode = weatherData.weather[0].icon;
            const descText = weatherData.weather[0].description;

            description.innerHTML = `
        <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="${descText}" 
          style="vertical-align: middle; width: 30px; height: 30px;">
        <span style="margin-left: 8px; text-transform: capitalize;">${descText}</span>
      `;



            // Convert Celsius ↔ Fahrenheit
            converter.addEventListener("change", () => {
                if (!temperature.innerHTML) return; // No data yet

                // Extract numeric values from temperature + feelslike
                let tempValue = parseFloat(temperature.innerText);
                let feelsLikeValue = parseFloat(feelslike.innerText.replace(/[^\d.-]/g, ""));

                if (converter.value === "°F") {
                    // Convert to Fahrenheit
                    tempValue = Math.round((tempValue * 9) / 5 + 32);
                    feelsLikeValue = Math.round((feelsLikeValue * 9) / 5 + 32);

                    temperature.innerHTML = `${tempValue}°F`;
                    feelslike.innerHTML = `Feels like: ${feelsLikeValue}°F`;

                    // Convert forecast temps
                    document.querySelectorAll(".forecast .day").forEach(day => {
                        if (day.innerText.includes("°C")) {
                            day.innerHTML = day.innerHTML.replace(/(-?\d+)°C/g, (_, c) => {
                                return `${Math.round((c * 9) / 5 + 32)}°F`;
                            });
                        }
                    });

                } else {
                    // Convert back to Celsius → easiest way: re-fetch city
                    findUserLocation();
                }
            });

            // Highlights
            HValue.innerHTML = Math.round(weatherData.main.humidity) + "<span>%</span>";
            WValue.innerHTML = Math.round(weatherData.wind.speed) + "<span> m/s</span>";
            SRValue.innerHTML = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            SSValue.innerHTML = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            CValue.innerHTML = weatherData.clouds.all + "<span>%</span>";
            PValue.innerHTML = weatherData.main.pressure + "<span> hPa</span>";
            VValue.innerHTML = (weatherData.visibility / 1000) + "<span> km</span>";

            // 🔥 Fetch forecast (5 days / 3 hours)
            fetch(FORECAST_API_ENDPOINT + cityName)
                .then((res) => res.json())
                .then((forecastData) => {
                    console.log("Forecast data:", forecastData);

                    Forecast.innerHTML = "";

                    if (forecastData.cod === "200") {
                        // 1️⃣ Add Today card
                        const todayEl = document.createElement("div");
                        todayEl.classList.add("day");
                        const today = new Date();
                        todayEl.innerHTML = `
        <p><strong>Today</strong></p>
        <p>${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png" alt="today-icon"/>
        <p>${Math.round(weatherData.main.temp)}°C</p>
      `;
                        Forecast.appendChild(todayEl);

                        // 2️⃣ Add next 5 days from /forecast
                        const dailyData = {};
                        forecastData.list.forEach(item => {
                            const date = item.dt_txt.split(" ")[0]; // YYYY-MM-DD
                            if (!dailyData[date]) dailyData[date] = [];
                            dailyData[date].push(item);
                        });

                        Object.keys(dailyData).slice(1, 6).forEach(date => {
                            const noonData =
                                dailyData[date].find(x => x.dt_txt.includes("12:00:00")) ||
                                dailyData[date][0];

                            const weekday = new Date(noonData.dt * 1000).toLocaleDateString("en-US", { weekday: "long" });
                            const dateText = new Date(noonData.dt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            const descText = noonData.weather[0].description;



                            const dayEl = document.createElement("div");
                            dayEl.classList.add("day");
                            dayEl.innerHTML = `
    <p><strong>${weekday}</strong></p>
    <p>${dateText}</p>
    <img src="https://openweathermap.org/img/wn/${noonData.weather[0].icon}.png" alt="icon"/>
    <p>${Math.round(noonData.main.temp)}°C</p>
    <p style="text-transform: capitalize; font-size: 14px; margin-top: 5px;">
      ${descText}
    </p>
  `;
                            Forecast.appendChild(dayEl);
                        });

                    } else {
                        Forecast.innerHTML = "<p>No forecast data available</p>";
                    }
                });

        })
        .catch((err) => {
            console.error(err);
            alert("Unable to fetch weather data.");
        });
}


// 🕒 Function to handle timezone date/time
function updateDateTime(timezoneOffset) {
    function format() {
        const now = new Date(new Date().getTime() + timezoneOffset * 1000);
        dayEl.innerHTML = now.toLocaleDateString("en-US", { weekday: "long" });
        dateEl.innerHTML = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        timeEl.innerHTML = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    // Update every second
    if (window.cityClock) clearInterval(window.cityClock);
    format();
    window.cityClock = setInterval(format, 1000);
}
