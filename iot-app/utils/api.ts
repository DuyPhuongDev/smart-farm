const URL="caigiday.com"

export async function fetchSensorData(endpoint: string) {
    try {
      const response = await fetch(`${URL}/sensor-data/${endpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint} data`);
      }
      const result = await response.json();
  
      if (result.status_code !== 200 || !result.data) {
        throw new Error(`Invalid ${endpoint} API response`);
      }
  
      return result.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint} data:`, error);
      return null;
    }
  }
  
  export const fetchHumidityData = () => fetchSensorData("humidity");
  export const fetchTemperatureData = () => fetchSensorData("temperature");
  export const fetchLux = () => fetchSensorData("lux");
  