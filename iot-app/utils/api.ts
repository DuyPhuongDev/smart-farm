const URL=""

export async function fetchSensorData(endpoint: string) {
    try {
      // const response = await fetch(`${URL}/sensor-data/${endpoint}`);
      const response = await fetch(`https://run.mocky.io/v3/f81811ba-e112-46d8-a1a1-8005a1751fda`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint} data`);
      }
      const result = await response.json();
  
      if (result.status_code !== 200 || !result.data) {
        throw new Error(`Invalid ${endpoint} API response`);
      }
      console.log(result.data);
      return result.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint} data:`, error);
      return null;
    }
  }
  
  export const fetchHumidity = () => fetchSensorData("humidity");
  export const fetchTemperature = () => fetchSensorData("temperature");
  export const fetchLux = () => fetchSensorData("lux");
  export const fetchsoilMoisture = () => fetchSensorData("soilMoisture");
  