const express = require('express')
const mqtt = require('mqtt');
const cors= require('cors');
const solarDataLocally = require("./modules/sunposition.js");

const dotenv = require('dotenv');
dotenv.config();

const app = express()
const port = 3000

const MAX_READINGS = 100;
var voltageReadings= [];
var temperatureReadings= [];
var accelerometerReadings= [];

const corsOptions={
    origin:"*",// "http://localhost:5173",
    methods: "GET,POST",
    allowedHeaders: ['Content-Type','Authorization']
}

async function solarData(){
    const response=await fetch(`https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=2025-11-01&time=14:30&offset=+02:00`);
    const data=await response.json();
    console.log(data);
    return data;
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended:true}));


// Neutral defaults; configure your location locally or through the UI.
let lat = Number(process.env.TRACKER_LATITUDE ?? 0);
let lon = Number(process.env.TRACKER_LONGITUDE ?? 0);

const client = mqtt.connect(process.env.MQTT_SERVER || 'mqtt://localhost:1883', {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});
client.on("connect",()=>{
    client.subscribe("TEMPERATURE", (err)=>{
        if(err)
            console.log(err);
    })
    client.subscribe("sensorReadings/#", (err)=>{
        if(err)
            console.log(err);
    })
})

client.on("message",(topic,message)=>{

    console.log(topic, message.toString());
    if(topic == "sensorReadings/voltage"){
        try{
            const payload = JSON.parse(message.toString());
            const reading ={
                voltage: payload.voltage,
                timestamp: new Date()
            };

            voltageReadings.push(reading);
            if(voltageReadings.length>MAX_READINGS)
                voltageReadings.shift();//mai taiem din ele
        } catch (error){
            console.error("error:", error);
        }
    }

    if(topic == "sensorReadings/accelerometer"){
        try{
            const payload = JSON.parse(message.toString());
            const reading ={
                pitch: payload.pitch,
                roll: payload.roll,
                timestamp: new Date()
            };

            accelerometerReadings.push(reading);
            if(accelerometerReadings.length>MAX_READINGS)
                accelerometerReadings.shift();//mai taiem din ele
        } catch (error){
            console.error("error:", error);
        }
    }

    if(topic == "sensorReadings/temperature"){
        try{
            const payload = JSON.parse(message.toString());
            const reading ={
                temperature: payload.temperature,
                timestamp: new Date()
            };

            temperatureReadings.push(reading);
            if(temperatureReadings.length>MAX_READINGS)
                temperatureReadings.shift();//mai taiem din ele
        } catch (error){
            console.error("error:", error);
        }
    }


})

var elevation;
var azimuth;
function sendSunPos(now,lat,lon){

    const data= solarDataLocally(lat,lon,now);
    elevation=Number(data.elevation.toFixed(2));
    azimuth=Number(data.azimuth.toFixed(2));
    console.log("Sentdata:" + elevation+" "+azimuth)
    client.publish("COORD",elevation+" "+azimuth);
}
sendSunPos(new Date(),lat,lon);// vreau sa inceapa in modul de curent sun


timeout=setInterval(()=>{},2000);
timeout2=setInterval(()=>{},2000);

function stopAllIntervals() {
    if (timeout) {
        clearInterval(timeout);
        timeout = null;
    }
    if (timeout2) {
        clearInterval(timeout2);
        timeout2 = null;
    }
}

app.post('/v1/actions/clearInterval1', (req, res) => {
    stopAllIntervals();
    return res.status(200).json({message: "Clear interval 1 request has been recieved"});
})

app.post('/v1/actions/clearInterval2', (req, res) => {
    stopAllIntervals();
    return res.status(200).json({message: "Clear interval 2 request has been recieved"});
})
app.post('/v1/actions/currentSun', (req,res)=>{
    stopAllIntervals();
    timeout= setInterval((date= new Date())=>{
        sendSunPos(date,lat,lon);
    },2000)
    return res.status(200).json({message: "Current sun mode activated"});
})


//pentru ca folosesc put ar trebui ca de pe front sa se actualizeze coordonatele entirely
//altfel mai trebuie un endpoint pentru patch
//trimitem in bodyul requestului informatia
//
//
//     {
//          "id": 21, 
//          "latitude": ...,
//          "longitude": ...,
//     }




app.post('/v1/actions/setLocation', (req, res)=>{ 
    const {latitude, longitude} = req.body;
    lat=latitude;
    lon=longitude;
    stopAllIntervals();
    timeout= setInterval((date= new Date())=>{
        sendSunPos(date,lat,lon);
    },2000)
    return res.status(200).json({message:"Latitude and longitude succesfully set"});

    //aici ar trbeui sa fac un update in baza de date pe baza id-ului trackerului solar
    //dar momentan e ok pentru a vedea daca merge
})

app.put('/v1/actions/setLocationByMap', (req, res)=>{ 
    //AR FI MISTO DACA AS PUTEA SETA LOCATIA FOLOSIND HARTA AIA DE LA GOOGLE MAPS
    const {altitude, longitude} = req.body;
    lat=altitude;
    lon=longitude;
    return res.status(200).json({message:"Latitude and longitude succesfully set"});

    //aici ar trbeui sa fac un update in baza de date pe baza id-ului trackerului solar
    //dar momentan e ok pentru a vedea daca merge
})


app.post('/v1/actions/simulatedSun',(req,res)=>{
    //var date= new Date();
    //console.log(req.body);
    var startDate= req.body.date;
    var date= startDate ? new Date(startDate) : new Date();;
    const {latitude, longitude}=req.body;
    var i=1;
    var j=0;
    stopAllIntervals();
    timeout2= setInterval(()=>{
        date.setHours(i,j,0);
        console.log(date);
        sendSunPos(date,latitude,longitude);
        j+=10;
        if(j>=60){
            i++;
            j=0;
        }
        if(i>24){clearInterval(timeout2);}

    },500)
    return res.status(200).json({message:"Simulated sun mode succesfully set"});

})

app.post('/v1/actions/setAngles',(req,res)=>{
    stopAllIntervals();
    let {baseServo,panelServo}=req.body;
    console.log("Base Servo: "+baseServo+"Panel Servo: "+panelServo);
    client.publish("MANUAL",baseServo+" "+panelServo);
    return res.status(200).json({message:"Simulated sun mode succesfully set"});
})
app.post('/v1/actions/setSimulationAngles',(req,res)=>{
    stopAllIntervals();
    let {elevation,azimuth}=req.body;
    console.log("Elevation: "+elevation+"Azimuth: "+azimuth);
    client.publish("COORD",elevation+" "+azimuth);
    return res.status(200).json({message:"Simulated sun mode succesfully set"});
})

app.post('/v1/actions/cmd',(req,res)=>{
    const {action}=req.body;
    console.log("Recieved action: ", action);
    client.publish("CMD",action);
    stopAllIntervals();
    return res.status(200).json({message:"Simulated sun mode succesfully set"});

})
/*
app.get('/v1/sensorsReadings',(req,res)=>{

    if(sensorReadings.length === 0){
        return res.status(503).json({error:"nodata available"});
    }
    console.log(sensorReadings[sensorReadings.length-1].data);
    res.json(sensorReadings[sensorReadings.length-1].data);
})
*/
app.get('/v1/position',(req,res)=>{
    //avem elevation si azimuth globale si se trimit mai jos 
    //in mod normal am facut asta pentru cand avem modul cu soarele simulat
    //pentru a nu simula in doua functii, fiunctia de simulare modifica variabila globala ce o transmitem aici
    //
    //in mod normal trebuie sa folosesc server side events sau websockets
    //in specila in cazul asta pentru ca ar fi naspa sa ajustez setinterval
    //din frontend sa faca mai multe requesturi pentru modul simulat
    

    //am nevoie de pos asta pentru ca pe front datele le procesez prin "<xxxx>.posData.elevation" etc
    const pos={
        posData:{
            elevation: elevation,
            azimuth: azimuth
        }
    }
    //console.log("Debug:",pos);
    return res.status(200).json(pos);
})
app.get('/v1/sensorsReadings/temperature',(req,res)=>{

    if(temperatureReadings.length === 0){
        return res.status(503).json({error:"nodata available"});
    }
    console.log("Temperature readings: "+ temperatureReadings[temperatureReadings.length-1]);
    //the payload is already in the right format to be processed by the frontend
    res.json(temperatureReadings[temperatureReadings.length-1]);
})

app.get('/v1/sensorsReadings/accelerometer',(req,res)=>{

    if(accelerometerReadings.length === 0){
        return res.status(503).json({error:"nodata available"});
    }
    console.log("Accelerometer readings: "+accelerometerReadings[accelerometerReadings.length-1].pitch + " "+accelerometerReadings[accelerometerReadings.length-1].pitch );
    //the payload is already in the right format to be processed by the frontend
    res.json(accelerometerReadings[accelerometerReadings.length-1]);
})

app.get('/v1/sensorsReadings/voltage',(req,res)=>{
    if(voltageReadings.length === 0){
        return res.status(503).json({error:"nodata available"});
    }
    /////////////   Facem un obiect voltageLog pentru a-l trimite pe front
    //              e mandatory chestia asta pentru ca trebuie sa fie porcesat de
    //              chart.js si it expects value sub forma de [a,b,c,d] .. a,b,c,d float  
    var voltageLog=[]
    for(var i=0;i<voltageReadings.length;i++){
        voltageLog.push(voltageReadings[i].voltage);
    }
    var sentVoltageReadings={
        voltage:voltageLog,
        timestamp:voltageReadings[voltageReadings.length-1].timestamp
    }
    console.log("Voltage readings: "+ voltageReadings[voltageReadings.length-1]);
    //the payload is already in the right format to be processed by the frontend
    res.json(sentVoltageReadings);
})
app.get('/v1/sensorsReadings/all',(req,res)=>{
    let voltageLog=[]
    let voltageTimeStampLog=[]

    let accPitchLog=[]
    let accTimeStampLog=[]

    for(var i=0;i<voltageReadings.length;i++){
        voltageLog.push(voltageReadings[i].voltage);
        voltageTimeStampLog.push(voltageReadings[i].timestamp);
    }
    var sentVoltageReadings={
        voltage:voltageLog,
        timestamp:voltageTimeStampLog
    }

    for(var i=0;i<accelerometerReadings.length;i++){
        accPitchLog.push(accelerometerReadings[i].pitch);
        accTimeStampLog.push(accelerometerReadings[i].timestamp);
    }
    var sentAccelerometerLogReadings={
        pitch:accPitchLog,
        timestamp:accTimeStampLog
    }

    const objectArray={
        temperatureReadings: temperatureReadings[temperatureReadings.length-1],
        accelerometerReadings: accelerometerReadings[accelerometerReadings.length-1],
        accelerometerLogReadings: sentAccelerometerLogReadings,
        voltageReadings:sentVoltageReadings 
    }
    res.json(objectArray);
    
})




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
