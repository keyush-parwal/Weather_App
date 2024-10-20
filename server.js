import express from "express";
import fetch from "node-fetch";
import mysql from "mysql2"; // For MySQL connection
const app = express();
const PORT = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set("view engine", "ejs");

// Your OpenWeatherMap API key
const API_KEY = "your_key";

// MySQL Connection Setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Your MySQL user
  password: "your_password", // Your MySQL password
  database: "weatherapp", // Your database name
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database.");
});

// Route to render the form and weather cards
app.get("/", (req, res) => {
  const sql = `
        SELECT city, temperature, weatherCondition, date
        FROM weather_data 
        WHERE date = (
            SELECT MAX(date) FROM weather_data AS wd WHERE wd.city = weather_data.city
        )
        ORDER BY city ASC
    `;

  db.query(sql, (err, weatherData) => {
    if (err) throw err;
    res.render("index", { weatherData }); // Send the latest weather data for each city to the client
  });

  // // Fetch all cities from the database
  // db.query(sql, async (err, results) => {
  //     if (err) throw err;

  //     // Fetch weather data for each city
  //     const weatherData = [];
  //     for (const city of results) {
  //         const url = `https://api.openweathermap.org/data/2.5/weather?q=${city.city}&appid=${API_KEY}&units=metric`;

  //         try {
  //             const response = await fetch(url);
  //             const data = await response.json();
  //             console.log(data);
  //             if (data.cod === 200) {
  //                 weatherData.push({
  //                     city: data.name,
  //                     temperature: data.main.temp,
  //                     feels_like: data.main.feels_like,
  //                     weatherCondition: data.weather[0].main,
  //                 });
  //             }
  //         } catch (error) {
  //             console.error(`Error fetching weather for ${city.name}:`, error);
  //         }
  //     }

  //     // Render the page with weather data
  //     res.render('index', { weatherData, error: null });
  // });
});
function calculateAverage(array) {
  let sum = 0;
  array.forEach(function (element) {
    sum += parseFloat(element);
  });
  return (sum / array.length).toFixed(2);
}

app.post("/showGraph", (req, res) => {
  const cityName = req.body.city;

  // Query the past 7 days of temperature data for the city
  const sql = `
        SELECT temperature, date, weatherCondition 
        FROM weather_data 
        WHERE city = ? 
        ORDER BY date DESC 
        LIMIT 7
    `;
  console.log(cityName);

  db.query(sql, [cityName], (err, results) => {
    if (err) throw err;

    // Calculate average, maximum, and minimum temperature
    const temperatures = results.map((row) => row.temperature);
    const avgTemp = calculateAverage(temperatures);
    console.log(avgTemp);
    const maxTemp = Math.max(...temperatures).toFixed(2);
    const minTemp = Math.min(...temperatures).toFixed(2);

    // Calculate the dominant weather condition
    const weatherConditions = results.map((row) => row.weatherCondition);
    const dominantCondition = getDominantCondition(weatherConditions);

    // Send the data to the EJS template
    res.render("graph", {
      city: cityName,
      pastTemperatures: results,
      avgTemp,
      maxTemp,
      minTemp,
      dominantCondition,
    });
  });
});

// Function to calculate dominant weather condition
function getDominantCondition(conditions) {
  const conditionCount = {};

  conditions.forEach((condition) => {
    conditionCount[condition] = (conditionCount[condition] || 0) + 1;
  });

  // Find the condition with the highest count
  return Object.keys(conditionCount).reduce((a, b) =>
    conditionCount[a] > conditionCount[b] ? a : b
  );
}

async function fetchWeather(cityName) {
  const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`;

  try {
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (weatherData.cod === 200) {
      const temperature = weatherData.main.temp;
      const weathercond = weatherData.weather[0].main;
      const sql = `INSERT INTO weather_data (city, temperature, weatherCondition, date) VALUES (?, ?, ?, NOW())`;
      db.query(sql, [cityName, temperature, weathercond], (err) => {
        if (err) console.error(err);
        console.log(`Weather updated for ${cityName}: ${temperature}°C`);
      });
    } else {
      console.error(
        `Error fetching weather for ${cityName}:`,
        weatherData.message
      );
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Function to update weather for all cities in the database
function updateWeatherForAllCities() {
  const sql = "SELECT DISTINCT city FROM weather_data";
  db.query(sql, (err, results) => {
    if (err) throw err;

    results.forEach((row) => {
      fetchWeather(row.city);
    });
  });
}

// Call updateWeatherForAllCities every 5 minutes (300000 ms)
setInterval(updateWeatherForAllCities, 3000);

// Fetch the weather immediately when the server starts
updateWeatherForAllCities();

// Route to handle adding a new city and fetching its weather
app.post("/addCity", async (req, res) => {
  const cityName = req.body.city;

  const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`;

  try {
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (weatherData.cod !== 200) {
      return res.send("City not found!");
    }

    const temperature = weatherData.main.temp;
    const weathercond = weatherData.weather[0].main;

    // Save the city, temperature, and date in the database
    const sql = `INSERT INTO weather_data (city, temperature, weatherCondition, date) VALUES (?, ?, ?, CURDATE())`;
    db.query(sql, [cityName, temperature, weathercond], (err) => {
      if (err) throw err;
      res.redirect("/");
    });
  } catch (error) {
    console.log(error);
    res.send("Error fetching weather data.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
