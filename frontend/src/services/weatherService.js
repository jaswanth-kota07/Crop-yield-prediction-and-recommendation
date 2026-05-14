import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const weatherService = {
  /**
   * Get current weather by coordinates
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   */
  getCurrentWeather: async (lat, lon) => {
    if (!API_KEY || API_KEY === 'YOUR_OPENWEATHER_API_KEY_HERE') {
      throw new Error('OpenWeatherMap API key is missing. Please add it to your .env file.');
    }

    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric',
        },
      });

      const data = response.data;
      
      // Rainfall data is sometimes missing if it's not raining
      const rainfall = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
      
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        rainfall: rainfall * 10, // Approximate daily rainfall or just use hourly for now
        locationName: data.name,
        country: data.sys.country
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  },

  /**
   * Get coordinates from browser
   */
  getLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (error) => {
            reject(new Error('Unable to retrieve your location. Please enable location access.'));
          }
        );
      }
    });
  }
};
