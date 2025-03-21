import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import Card from "@/components/Card";
import Header from "@/components/Header";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Chart from "@/components/Chart";
import { fetchLux } from "@/utils/api";
import { useState, useEffect } from "react";
import mqtt from "mqtt";

//-------test hardcode data-------//
interface DataItem {
  dataId: number;
  soilMoisture: number;
  recordedAt: string;
}
interface TransformedData {
  value: number;
  time: string;
}
let testData =[
    { dataId: 145, soilMoisture: 18.12, recordedAt: "22" },
    { dataId: 139, soilMoisture: 22.2, recordedAt: "20" },
    { dataId: 133, soilMoisture: 18.06, recordedAt: "18" },
    { dataId: 127, soilMoisture: 22.2, recordedAt: "16" },
    { dataId: 121, soilMoisture: 26.9, recordedAt: "14" },
    { dataId: 145, soilMoisture: 30.12, recordedAt: "12" },
    { dataId: 139, soilMoisture: 28.2, recordedAt: "10" },
    { dataId: 133, soilMoisture: 26.06, recordedAt: "8" },
    { dataId: 127, soilMoisture: 18.2, recordedAt: "6" },
    { dataId: 121, soilMoisture: 18.9, recordedAt: "4" },
    { dataId: 145, soilMoisture: 13.12, recordedAt: "2" },
    { dataId: 139, soilMoisture: 11.2, recordedAt: "0" },
  ];

  
export default function LightDashboard() {
  //--------------fetch real data, chua co backend nen k test ddc--------------//

  const [sensorValue, setSensorValue] = useState<number>(99);
  const [data, setData] = useState<{ dataId: number;soilMoisture: number; recordedAt: string }[]>([]);

  const AIO_USERNAME = "caigidoha"; //
      const AIO_KEY = "something"; 
    
     useEffect(() => {
        // Connect to MQTT Broker
    
        // const client = mqtt.connect(`wss://${AIO_USERNAME}:${AIO_KEY}@io.adafruit.com`, {
        //   port: 443, 
        //   protocol: "wss",
        // });
        const client = mqtt.connect("ws://localhost:9001");
    
    
        // client.on("connect", () => {
        //   console.log("Connected to Adafruit IO!");
        //   client.subscribe(`${AIO_USERNAME}/feeds/temperature`); 
        // });
        client.on("connect", () => {
          console.log("Connected to MQTT Broker");
          client.subscribe("iot/lux"); // Subscribe
        });
    
    
    
        // client.on("message", (topic, message) => {
        //   const AIO_FEED = `${AIO_USERNAME}/feeds/temperature`; 
          
        //   if (topic === AIO_FEED) {
        //     const temp = parseFloat(message.toString());
        //     console.log("Received:", temp);
        //     setSensorValue(temp);
        //   }
        // });
        client.on("message", (topic, message) => {
          if (topic === "iot/lux") {
            const temp = parseFloat(message.toString());
            console.log("Received:", temp);
            setSensorValue(temp);
          }
        });
    
        return () => {
          client.end(); //unmount
        };
      }, []);










  useEffect(() => {

    async function getData() {
      const dat = await fetchLux();
      if (dat && dat.length > 0) {
        setSensorValue(dat[0].soilMoisture);
        setData(dat);
        testData = dat;
      }
    }

    getData();
  }, []);

  const transformData = (testData: DataItem[]): TransformedData[] => {
    return testData.map(item => ({
      value: item.soilMoisture,
      time: item.recordedAt, // Use recordedAt as the time
    }));
  };
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header />
        <Card data={sensorValue} title="Ánh sáng" color="#F1DC00" unit="lux" />
        <Chart data={transformData(testData)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
    gap: 10
  },
  title: { fontSize: 24, fontWeight: "bold" },
  data: { fontSize: 40, color: "yellow" },
});
