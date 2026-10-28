import {useEffect,useState } from 'react';
import angleIcon from "./assets/angle.png"
import solarIcon from "./assets/solar-panel.png"
import sunIcon from "./assets/sunny.png"
import temperatureIcon from "./assets/temperature.png"
import thunderboltIcon from "./assets/thunderbolt.png"

import 'chart.js/auto';
import {Line} from "react-chartjs-2";
import type { ChartData, ChartOptions } from 'chart.js';

type SensorBoxType={
    sensorData: SensorData
}
type GraphBoxType={
    voltageData: VoltageData
}
type GraphBox2Type={
    accLogData: AccLogData
}

type SensorData={
    tempData: TempData,
    voltageData: VoltageData,
    accData: AccData,
    accLogData:AccLogData,
    posData: PosData
}

type TempData={
    temperature: number,
    timestamp: string 
}
type VoltageData={
    voltage:number[],  
    timestamp:string[]
}
type AccData={
    pitch:number,
    roll:number,
    timestamp:string 
}

type AccLogData={
    pitch:number[],  
    timestamp:string[]
}
type PosData={
    azimuth:number,
    elevation:number,
    timestamp:string 
}
function Sidebar(){
    return(
        <div className="bg-[#9bc4bc] flex flex-col h-full w-1/7 lg:w-2/12">
            <div className="flex justify-center items-center w-full h-1/20 mt-5 ">
                <img className="h-full w-auto" src={solarIcon}></img>
                <span className='ml-2 text-white text-lg font-bold hidden lg:inline'>SolarTracker</span>
            </div>
            <div className="flex justify-center mt-30 w-full">
                <button className="place-self-center"></button>
            </div>

        </div>
    )
}

//inainte era h-4/18 cand era navbaru activat 
//
//
//TODO: ar fi misto sa fac niste moduri prin care sa ma uit la puterea produsa pe o anumita zi: Asa reducem si lungimea labelurilor
//      dar sa pastrez si o modalitate prin care sa vad all time si atunci nu mai folosesc labeluri cu tot cu ore, numai zile
//
function Graphbox(props: GraphBoxType){
    //am folosit slice pentru a limita ce este afisat pe graf
    //const voltage = props.voltageData.voltage.slice(props.voltageData.voltage.length-200,props.voltageData.voltage.length);
    //const labels:String[]=props.voltageData.timestamp.slice(props.voltageData.timestamp.length-200,props.voltageData.timestamp.length);

    const voltage = props.voltageData.voltage;
    const labels:String[]=props.voltageData.timestamp;

    const options : ChartOptions<'line'> ={
        responsive: true,
        scales: {
            x: {
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    //maxRotation: 90, 
                    //minRotation: 90,
                },
            },
            y: {
                min: 0,
                max: 6,
                ticks: {
                    stepSize: 1  // or 2 or 5 — whatever spacing you want
                }
            },
        },
    };
    const data: ChartData<'line'> = {
        labels,
        datasets: [
            {
                label: 'Power',
                data: voltage,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,

            },
        ],
    };
    return(
    <Line options={options} data={data} />

    )

}
function Graphbox2(props: GraphBox2Type){
    //am folosit slice pentru a limita ce este afisat pe graf
    //const voltage = props.voltageData.voltage.slice(props.voltageData.voltage.length-200,props.voltageData.voltage.length);
    //const labels:String[]=props.voltageData.timestamp.slice(props.voltageData.timestamp.length-200,props.voltageData.timestamp.length);

    const acc = props.accLogData.pitch;
    const labels:String[]=props.accLogData.timestamp;

    const options : ChartOptions<'line'> ={
        responsive: true,
        scales: {
            x: {
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    //maxRotation: 90, 
                    //minRotation: 90,
                },
            },
            y: {
                ticks: {
                    stepSize: 1  // or 2 or 5 — whatever spacing you want
                }
            },
        },
    };
    const data: ChartData<'line'> = {
        labels,
        datasets: [
            {
                label: 'Pitch',
                data: acc,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,

            },
        ],
    };
    return(
    <Line options={options} data={data} />

    )

}



function Sensor1r({name, value, icon}: {name: String, value: string, icon: string}){
    return(
        <div className='flex justify-center border border-gray-300 rounded-md'>
        <div className=" place-self-center h-1/2  w-8/10 flex justify-center text-xs">
            <div className="items-center flex justify-around">
                <img className="h-3/5 w-auto" src={icon}></img>
                <span className='inline-block'>{name}</span>
                <span className='allign-middle'>{value}</span>
            </div>
        </div>
        </div>
    )
}
function Sensor2r({name1,name2,value1,value2, icon}: {name1: String,name2:String,value1:string,value2:string, icon: string}){
    return(
        <div className='flex justify-center border border-gray-300 rounded-md'>
        <div className="place-self-center h-full  w-8/10 flex justify-center text-xs">
            <div className="items-center flex justify-around">
                <img className="h-3/10 w-auto place-self-center" src={icon}></img>
                <div className='h-full flex flex-col justify-around'>

                    <div className='flex justify-around'>
                        <span className='allign-middle'>{name1}</span>
                        <span className='allign-middle'>{value1}</span>
                    </div>
                    <div className='flex justify-around'>
                        <span className='allign-middle'>{name2}</span>
                        <span className='allign-middle'>{value2}</span>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}

export function ControlButtons() {

 const [status, setStatus] = useState<string>("");

  const sendCmd = async (message: "reset" | "servohome") => {
    setStatus(`Sending "${message}"...`);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL3}/v1/actions/cmd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "action" :  message }),
      });

      if (!res.ok) {
        const text = await res.text();
        setStatus(`HTTP ${res.status}: ${text || "error"}`);
        return;
      }

      setStatus(`Sent "${message}"`);
    } catch (e) {
      setStatus("Network error");
    }
  };
  return (
    <div className="w-6/7 mx-auto border border-gray-300 rounded-md p-4">
      <h2 className="text-sm font-semibold mb-3">Controls</h2>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={()=>sendCmd("reset")} className="h-12 rounded-md border border-gray-300 bg-[#9bc4bc] text-white text-sm">
          Reset sensors
        </button>

        <button className="h-12 rounded-md border border-gray-300 bg-[#9bc4bc] text-white text-sm">
                    -
        </button>

        <button  onClick={()=>sendCmd("servohome")} className="h-12 rounded-md border border-gray-300 bg-[#9bc4bc] text-white text-sm">
          Servo home
        </button>

        <button className="h-12 rounded-md border border-gray-300 bg-[#9bc4bc] text-white text-sm">
                    -
        </button> 
        {status && <div className="mt-3 text-xs text-gray-600 break-words">{status}</div>}
      </div>
    </div>
  );
}
function Sensorbox(props:SensorBoxType){

    var temperature=props.sensorData.tempData.temperature.toString();
    var elevation=props.sensorData.posData.elevation.toString()
    var azimuth=props.sensorData.posData.azimuth.toString() ;
    var pos=props.sensorData.accData.pitch.toString();
    var voltage=props.sensorData.voltageData.voltage;
    var lastVoltageLog=voltage[voltage.length-1].toString();


    return(
    <div className="mr-auto ml-auto w-6/7 h-2/15 grid grid-cols-2 grid-rows-2 gap-2 gap-x-4 ">

                    <Sensor1r name="Temperature:" icon={temperatureIcon} value={temperature}/>
                    <Sensor2r name1="Azimuth:" name2="Elevation:" icon={sunIcon} value1={elevation} value2={azimuth} />
                    <Sensor1r name="Position:" icon={angleIcon} value={pos}/>
                    <Sensor1r name="Power:" icon={thunderboltIcon} value={lastVoltageLog}/>
    </div>

    )
}

//!!!!!!!!!trebuie facut componenta asta incat sa randez inputuri cu ceva for in functie de un prop si sa desfintez SetSimulation!!!!!!!!!
//
//
//vezi ce a zis claude pentru a face tot sa arate la fel, trebuie sa las ca "contentul" sa decida cat spatiu ia 
/*function SetLocation() {
  return (
    <div className="flex flex-col items-center gap-4 w-6/7 p-4 mx-auto border border-gray-300 rounded-md">
      <h1 className="pb-2">Set your location</h1>

      <div className="flex flex-col gap-3 w-full">

        <div className="flex flex-col">
          <label className="text-xs">Latitude:</label>
          <input className="h-8 border border-gray-300 rounded px-2" name="latitude" type="text"/>
        </div>

        <div className="flex flex-col">
          <label className="text-xs">Longitude:</label>
          <input className="h-8 border border-gray-300 rounded px-2" name="longitude" type="text"/>
        </div>

      </div>

      <button className="w-1/3 h-8 text-sm border border-gray-300 rounded-md text-white bg-[#9bc4bc]">
        Submit
      </button>
    </div>
  );
}*/
//chatGPT mai jos gen
function SetLocation() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // optional: convert to numbers (recommended if your API expects numeric)
    const payload = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL3}/v1/actions/setLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setStatus("success");
    } catch (err) {
      console.error("Failed to set location:", err);
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col items-center gap-4 w-6/7 p-4 mx-auto border border-gray-300 rounded-md"
    >
      <h1 className="pb-2">Set your location</h1>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col">
          <label className="text-xs">Latitude:</label>
          <input
            className="h-8 border border-gray-300 rounded px-2"
            name="latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            type="text"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs">Longitude:</label>
          <input
            className="h-8 border border-gray-300 rounded px-2"
            name="longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            type="text"
          />
        </div>
      </div>

      <button
        disabled={status === "sending"}
        className="w-1/3 h-8 text-sm border border-gray-300 rounded-md text-white bg-[#9bc4bc] disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Submit"}
      </button>

      {status === "success" && <div className="text-xs">Saved</div>}
      {status === "error" && <div className="text-xs">Failed</div>}
    </form>
  );
}
/*function SetSimulation() {
  return (
    <div className="flex flex-col items-center gap-4 w-6/7 p-4 mx-auto border border-gray-300 rounded-md">
      <h1 className="pb-2">Set sun simulation</h1>

      <div className="flex flex-col gap-3 w-full">

        <div className="flex flex-col">
          <label className="text-xs">Latitude:</label>
          <input className="h-8 border border-gray-300 rounded px-2" name="latitude" type="text"/>
        </div>

        <div className="flex flex-col">
          <label className="text-xs">Longitude:</label>
          <input className="h-8 border border-gray-300 rounded px-2" name="longitude" type="text"/>
        </div>

        <div className="flex flex-col">
          <label className="text-xs">Date:</label>
          <input className="h-8 border border-gray-300 rounded px-2" name="date" type="text"/>
        </div>

      </div>

      <button className="w-1/3 h-8 text-sm text-white border border-gray-300 rounded-md hover:bg-gray-100 bg-[#9bc4bc]">
        Submit
      </button>
    </div>
  );
}*/
function SetSimulation() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [date, setDate] = useState(""); // recommended format: YYYY-MM-DD
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    const payload = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      date, // keep as string; backend can parse (ISO date)
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL3}/v1/actions/simulatedSun`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setStatus("success");
    } catch (err) {
      console.error("Failed to set simulation:", err);
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col items-center gap-4 w-6/7 p-4 mx-auto border border-gray-300 rounded-md"
    >
      <h1 className="pb-2">Set sun simulation</h1>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col">
          <label className="text-xs">Latitude:</label>
          <input
            className="h-8 border border-gray-300 rounded px-2"
            name="latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            type="text"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs">Longitude:</label>
          <input
            className="h-8 border border-gray-300 rounded px-2"
            name="longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            type="text"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs">Date:</label>
          <input
            className="h-8 border border-gray-300 rounded px-2"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"  // nicer than plain text
          />
        </div>
      </div>

      <button
        disabled={status === "sending"}
        className="w-1/3 h-8 text-sm text-white border border-gray-300 rounded-md bg-[#9bc4bc] disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Submit"}
      </button>

      {status === "success" && <div className="text-xs">Saved</div>}
      {status === "error" && <div className="text-xs">Failed</div>}
    </form>
  );
}


type SliderRowProps = {
    label: string;
    value: number;
    onChange: (v: number) => void;
};

function SliderRow({ label, value, onChange }: SliderRowProps) {
    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between text-xs">
                <span>{label}</span>
                <span>{value}°</span>
            </div>

            <input
                type="range"
                min={0}
                max={180}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-[#9bc4bc]"
            />
        </div>
    );
}


function SetAngles() {
    const [baseServo, setBaseServo] = useState(90);
    const [panelServo, setPanelServo] = useState(45);
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

    const onSubmit = async () => {
        setStatus("sending");

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL3}/v1/actions/setAngles`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ baseServo, panelServo }),
                }
            );

            if (!res.ok) throw new Error();
            setStatus("success");
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-6/7 p-4 mx-auto border border-gray-300 rounded-md">
            <h1 className="pb-2">Set angles</h1>

            <div className="flex flex-col gap-4 w-full">
                <SliderRow
                    label="Base Servo"
                    value={baseServo}
                    onChange={setBaseServo}
                />

                <SliderRow
                    label="Panel Servo"
                    value={panelServo}
                    onChange={setPanelServo}
                />
            </div>

            <button
                onClick={onSubmit}
                disabled={status === "sending"}
                className="w-1/3 h-8 text-sm text-white border border-gray-300 rounded-md bg-[#9bc4bc] disabled:opacity-60"
            >
                {status === "sending" ? "Sending..." : "Send"}
            </button>

            {status === "success" && <div className="text-xs">Sent</div>}
            {status === "error" && <div className="text-xs">Failed</div>}
        </div>
    );
}

type SliderRowProps2 = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  orientation?: "horizontal" | "vertical";
};

function SliderRow2({ label, value, onChange, orientation = "horizontal" }: SliderRowProps2) {
  const isVertical = orientation === "vertical";

  return (
        <div className="flex justify-center flex-col gap-1 w-1/2 h-full">
      <div className=" text-center text-xs w-full">
        <span>{label}</span>
        <span>{value}°</span>
      </div>

      <div className={isVertical ? "h-44 w-full flex items-center justify-center" : "w-full"}>
        <input
          type="range"
          min={0}
          max={180}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={[
            "accent-[#9bc4bc]",
            isVertical
              ? "w-44 -rotate-90" // rotate the slider
              : "w-full",
          ].join(" ")}
        />
      </div>
    </div>
  );
}

function SetSimulationAnglesLinear() {
  const [azimuth, setAzimuth] = useState(90);
  const [elevation, setElevation] = useState(45);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const onSubmit = async () => {
    setStatus("sending");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL3}/v1/actions/setSimulationAngles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ azimuth, elevation }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-6/7 p-4 mx-auto border border-gray-300 rounded-md">
      <h1 className="pb-2">Set angles</h1>

      <div className="flex items-end justify-between gap-8 w-full">
        <SliderRow2
          label="Azimuth: "
          value={azimuth}
          onChange={setAzimuth}
          orientation="horizontal"
        />

        <SliderRow2
          label="Elevation :"
          value={elevation}
          onChange={setElevation}
          orientation="vertical"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={status === "sending"}
        className="w-1/3 h-8 text-sm text-white border border-gray-300 rounded-md bg-[#9bc4bc] disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send"}
      </button>

      {status === "success" && <div className="text-xs">Sent</div>}
      {status === "error" && <div className="text-xs">Failed</div>}
    </div>
  );
}

function Dashboard(){

    const [tempData, setTempData]=useState({
        temperature: 0,
        timestamp:""
    })
    const [voltageData, setVoltageData]=useState({
        voltage: [0],
        timestamp:[""]
    })
    const [accData, setAccData]=useState({
        pitch:0,
        roll:0,
        timestamp:""
    })
    const [accLogData, setAccLogData]=useState({
        pitch: [0],
        timestamp:[""]
    })
    const [posData,setPosData]=useState({
        elevation:0,
        azimuth:0,
        timestamp:""
    })
    const [loading, setLoading]=useState(true);
    useEffect(()=>{
        const fetchSensorData= async ()=>{
                /////////grija la url u asta ca nu merge numai cand sunt pe netul de acasa
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL3}/v1/sensorsReadings/all`);
                const data= await response.json();
                setTempData(data.temperatureReadings);
                setVoltageData(data.voltageReadings);
                setAccData(data.accelerometerReadings);
                setAccLogData(data.accelerometerLogReadings);
        };
        const fetchPositionData=async()=>{
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL3}/v1/position`);
                const data= await response.json();
                setPosData(data.posData);
        }

        const initialLoad = async () => {
            try {
                await Promise.all([fetchSensorData(), fetchPositionData()]);
            } catch (error) {
                console.error("Error on initial load", error);
            } finally {
                setLoading(false);
            }
        };
        initialLoad()
        //aici a dat claude mai mlute idei, vezi ideeile!!!!
 const interval = setInterval(fetchSensorData, 2000);
 const interval2 = setInterval(fetchPositionData, 2000);
//mult mai bine ar fi sa implementez websockets
        //
        //
        //chestia asta cu return da clear la interval in momentul in care
        //isi da componenta unmount(de ex cand iesi de pe pagina ) ca sa nu ruleze in fundal
    return () => {clearInterval(interval); clearInterval(interval2)};
    }, []);

    if(loading){

        return(

            <div className="h-dvh w-dvw flex">
                <Sidebar/>
                <div className="h-dvh w-6/7 lg:w-10/12 overflow-y-scroll flex justify-center">
                    <div className='w-2/3 h-full flex flex-col gap-4 lg:gap-8 '>
                        <div>Loading sensors...</div>
                    </div>
                </div>
            </div>
        );
    }
    const sensorData:SensorData={//e ok constanta aici?
        tempData: tempData,
        voltageData: voltageData,
        accData: accData,
        accLogData:accLogData,
        posData: posData
    }
    return (
        <div className="h-dvh w-dvw flex">
            <Sidebar/>
            <div className="h-vdh  w-6/7 lg:w-10/12 overflow-y-scroll flex justify-center">
                <div className='w-full md:w-3/4 2xl:w-2/4  flex flex-col gap-4 lg:gap-8 '>
                    <Graphbox voltageData={voltageData}/>
                    <Graphbox2 accLogData={accLogData}/>
                    <Sensorbox sensorData={sensorData}/>
                    <SetLocation/>
                    <SetSimulation/>
                    <SetAngles/>
                    <SetSimulationAnglesLinear/>
                    <ControlButtons/>
                </div>
            </div>
        </div>
    );
}
//nu uita sa pui sidebar inapoi daca i nevoie de el si sa modifici din w-7/7 in w6/7
export default function myApp(){
    return (
        <Dashboard/>
    )
}
