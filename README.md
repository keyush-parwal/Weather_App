# README - Weather App
This is a Node.js weather app that uses the OpenWeatherMap API to fetch real-time weather data and store it in a MySQL database. The app can check weather conditions, store weather data, and alert users if the temperature of a specific city exceeds a threshold.

Prerequisites
Before you begin, ensure you have met the following requirements:

Node.js and npm installed (download from Node.js).
MySQL installed (download from MySQL).
An API key from OpenWeatherMap (free registration).
Project Setup
Clone the repository:

Copy code
git clone <repository-url>
Navigate into the project directory:

Copy code
cd nodejs-weatherapp
Install project dependencies:

Copy code
npm install
Configure MySQL Database:

Set up a MySQL database called weatherapp.
Create the weather_data table using the SQL commands provided below.
Set up environment variables:

Create a .env file in the project root.
Add the following variables:
makefile
Copy code
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=weatherapp
WEATHER_API_KEY=your_openweathermap_api_key
Start the server:

Copy code
npm start
The app should now be running on http://localhost:3000.

Creating the weather_data Table in weatherapp Database
To set up the database, follow these steps:

Login to MySQL:

Copy code
mysql -u root -p
Create the weatherapp database:

sql
Copy code
CREATE DATABASE weatherapp;
Use the weatherapp database:

sql
Copy code
USE weatherapp;
Create the weather_data table:

sql
Copy code
create table weather_data( 
id int auto_increment primary key,
city varchar(20),
temperature decimal,
date timestamp, 
weatherCondition varchar(20));

Verify the table is created:

sql
Copy code
SHOW TABLES;
Check the table structure:

sql
Copy code
DESCRIBE weather_data;
Available Scripts
npm start: Starts the Node.js server on the default port (3000).
npm run dev: Starts the Node.js server with nodemon for development.
Additional Notes
Ensure your MySQL server is running.
Replace your_password and your_openweathermap_api_key in the .env file with your actual MySQL password and OpenWeatherMap API key.
