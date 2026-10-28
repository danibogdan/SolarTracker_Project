#include <WiFi.h>
#include <PubSubClient.h>
#include <string.h>
#include <ESP32Servo.h>
#include <cstring>
#include "./config.h"  //passwords, ips, wifi ssids and other things

#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

//senzor temperatura
#include "DHT.h"

//LCD
// ESP32 pins we wired above
#define TFT_CS 5
#define TFT_DC 2
#define TFT_RST 19
#define TFT_SCLK 18
#define TFT_MOSI 23

Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);



//const char* user = "LIFT1";
//const char* confirmation_topic = "LIFT1/CONFIRMATION";

const char* user = "TrackerSolar";



//macros from config.h
const char* ssid = WIFI1_SSID;
const char* password = WIFI1_PASS;

const char* server = MQTT_SERVER;




WiFiClient espClient;
PubSubClient client(espClient);





///////////////////////////////////temperature sensor setup//////////////////////////////////////
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

float h, t, f, hif, hic;
float oldh, oldt, oldhic;
String tempSensorReadings = String("");
char screenBuf[512];

////////////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////Senzor accelerometru setup //////////////////////////////
Adafruit_MPU6050 mpu;
float roll;
float pitch;
float oldaccx, oldaccy, oldaccz, oldgyrox, oldgyroy, oldgyroz, oldroll, oldpitch;
float aX, aY, aZ, gX, gY, gZ;
sensors_event_t a, g, temp;


///////////////////////////////Voltage sensor ///////////////////////////////////////////
#define REF_VOLTAGE 5
#define VOLTMETER_PIN 32
float voltage, oldvoltage;
//////////////////////////////////////////// SERVOS/////////////////////////////////////////////
// create four servo objects
Servo servo1;
Servo servo2;

// Published values for SG90 servos; adjust if needed
int minUs = 600;
int maxUs = 2400;


int servo1Pin = 12;  //15
int servo2Pin = 14;  //16 ca sa nu intefereze cu WIFI

int pos = 0;  // position in degrees
ESP32PWM pwm;


///COORDONATE DIN MQTT
int azimuth;
int elevation;
////////////////////////////////////////////////////////////////////////////////////////////////

//
int position = 0;
int power = 0;



bool manualMode = false;
int servo1HomePos=180, servo2HomePos=180;

int servo1Pos = servo1HomePos, servo2Pos = servo2HomePos;        // current commanded position
int servo1Target = servo1HomePos, servo2Target = servo2HomePos;  // where we want to go
uint32_t lastServoStepMs = 0;
const uint16_t SERVO_STEP_MS = 15;  // 10–30ms

void updateServosSmooth() {
  uint32_t now = millis();
  if (now - lastServoStepMs < SERVO_STEP_MS) return;
  lastServoStepMs = now;

  if (servo1Pos != servo1Target) {
    servo1Pos += (servo1Pos < servo1Target) ? 1 : -1;
    servo1.write(servo1Pos);
  }
  if (servo2Pos != servo2Target) {
    servo2Pos += (servo2Pos < servo2Target) ? 1 : -1;
    servo2.write(servo2Pos);
  }
}

void setServo1Target(int deg) {
  servo1Target = constrain(deg, 0, 180);
}
void setServo2Target(int deg) {
  servo2Target = constrain(deg, 0, 180);
}




void callback(char* topic, byte* payload, unsigned int length) {

  char msg[256];
  unsigned int n = (length < sizeof(msg) - 1) ? length : (sizeof(msg) - 1);
  memcpy(msg, payload, n);
  msg[n] = '\0';


  // handle message arrived
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
    Serial.print(msg);
  Serial.println();
  //Serial.print(!strncmp((char* ) payload, "ToggleOn", length ));

  //TEMPERATURA

  if (strcmp(topic, "CMD") == 0) {
    Serial.println("================CMD================");

    Serial.print(msg);
    if (strcmp(msg, "reset") == 0) resetAllSensors();
    if (strcmp(msg, "servohome") == 0) {
      servoHome();
      manualMode = true;
      azimuth=0;
      elevation=0;
    }


    Serial.println("===========================================");
  }
  if (strcmp(topic, "MANUAL") == 0) {
    Serial.println("================MANUAL================");
     float s1pos = 0, s2pos = 0;
    if (sscanf(msg, "%f %f", &s1pos, &s2pos) == 2) {
      manualMode = true;      
      Serial.println((int)s1pos);
      Serial.println((int)s2pos);
      setServo1Target(servo1HomePos- (int)s1pos);
      setServo2Target(servo2HomePos- (int)s2pos);
      //setServo1Target(servo1HomePos-newElevation);
    //setServo2Target(servo2HomePos - (azimuth - 90));
      //azimuth=servo2HomePos-s2pos+90;
      //elevation=servo1HomePo-s1pos;
      }
    Serial.println("===========================================");
  }
  
  if (strcmp(topic, "TEMPERATURE") == 0) {
    Serial.println("================Temperatura================");

    Serial.print(msg);

    Serial.println("===========================================");
  }
  //COORDONATE
  if (strcmp(topic, "COORD") == 0) {
    manualMode=false;
    Serial.println("================Coordonate================");

    Serial.println(msg);

    float azf = 0, elf = 0;
    if (sscanf(msg, "%f %f", &elf, &azf) == 2) {
      azimuth = (int)azf;
      elevation = (int)elf;
      Serial.println(azimuth);
      Serial.println(elevation);
    } else {
      Serial.println("Parse error for coordinates");
    }
    Serial.println("===========================================");
  }
  char temperature[256];
  //sprintf(temperature, "Humidity: %f -- Temeprature: %f -- Heat index: %f -- %f°C %f°F", h, t, f, hic, hif);
  //client.publish("TEMPERATURE", temperature);

  //temperature
  //position
  //azimuth
  //elvation
  //power
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("TRACKERSOLAR", MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("connected");
      client.subscribe("TEMPERATURE");
      client.subscribe("COORD");
      client.subscribe("CMD");
      client.subscribe("MANUAL");
      client.publish("TEMPERATURE", "Temperature start printing");

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}


/*
void displaydrawtext(String text, uint16_t color) {
  tft.fillScreen(ST77XX_BLACK);
  tft.setCursor(0, 0);
  tft.setTextColor(color);
  tft.setTextWrap(true);
  char buff[255];
  text.toCharArray(buff, 255);
  tft.print(text);
}
*/
void displaydrawtext2(char* text, uint16_t color) {
  tft.fillScreen(ST77XX_BLACK);
  tft.setCursor(0, 0);
  tft.setTextColor(color);
  tft.setTextWrap(true);
  tft.print(text);
}



float pitchF = 0;  // global

void updatePitchFilter(float pitch) {
  const float alpha = 0.1f;  // smaller = smoother (0.05–0.15)
  pitchF += alpha * (pitch - pitchF);
}


void processAccelerometerReadings() {
  //////////////////// Accelerometer///////////////////////////

  /* Get new sensor events with the readings */
  mpu.getEvent(&a, &g, &temp);

  aX = a.acceleration.x;
  aY = a.acceleration.y;
  aZ = a.acceleration.z;

  gX = g.gyro.x;
  gY = g.gyro.y;
  gZ = g.gyro.z;


  roll = atan2(aY, aZ) * 180.0 / PI;
  pitch = atan2(-aX, sqrt(aY * aY + aZ * aZ)) * 180.0 / PI;



  /* Print out the values */
  /*
  Serial.print("Acceleration X: ");
  Serial.print(aX);
  Serial.print(", Y: ");
  Serial.print(aY);
  Serial.print(", Z: ");
  Serial.print(aZ);
  Serial.println(" m/s^2");

  Serial.print("Rotation X: ");
  Serial.print(gX);
  Serial.print(", Y: ");
  Serial.print(gY);
  Serial.print(", Z: ");
  Serial.print(gZ);
  Serial.println(" rad/s");
  */
}
void processVoltageReadings() {
  /////////////////// Voltage ////////////////////////////////
  int raw = analogRead(VOLTMETER_PIN);
  float Vref = 5.0;
  int ADC_max = 4095;
  float Vout = (raw * Vref) / ADC_max;
  float dividerRatio = 5.0;
  float voltage_calibration = 0.788;
  voltage = Vout * dividerRatio * voltage_calibration;
}
void processTemperatureReadings() {
  // Reading temperature or humidity takes about 250 milliseconds!
  // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
  h = dht.readHumidity();
  // Read temperature as Celsius (the default)
  t = dht.readTemperature();
  // Read temperature as Fahrenheit (isFahrenheit = true)
  f = dht.readTemperature(true);

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t) || isnan(f)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }

  // Compute heat index in Fahrenheit (the default)
  hif = dht.computeHeatIndex(f, h);
  // Compute heat index in Celsius (isFahreheit = false)
  hic = dht.computeHeatIndex(t, h, false);


  // Serial.print(F("Humidity: "));
  // Serial.print(h);
  // Serial.print(F("%  Temperature: "));
  // Serial.print(t);
  // Serial.print(F("°C "));
  // Serial.print(f);
  // Serial.print(F("°F  Heat index: "));
  // Serial.print(hic);
  // Serial.print(F("°C "));
  // Serial.print(hif);
  // Serial.println(F("°F"));
}

void sendSensorReadings(float t, float pitch, float roll, float voltage) {

  char json1[256];
  //sprintf(json1, "{\"temperature\":\"%.2f\", \"position\":\"%d\", \"azimuth\":\"%d\", \"elevation\":\"%d\", \"power\":\"%d\" }", t, position, azimuth, elevation, power);
  sprintf(json1, "{\"temperature\": %.2f }", t);
  client.publish("sensorReadings/temperature", json1);


  char json2[256];
  sprintf(json2, "{\"pitch\": %.1f, \"roll\":%.1f }", pitch, roll);
  client.publish("sensorReadings/accelerometer", json2);

  char json3[256];
  sprintf(json3, "{\"voltage\":%.2f }", voltage);
  client.publish("sensorReadings/voltage", json3);
}

void display_sensor_readings_tft() {
  //////////////display
/*
  String stringH = String(h);
  String stringT = String(t);
  String stringHic = String(hic);

  String accX = String(aX);
  String accY = String(aY);
  String accZ = String(aZ);

  String gyroX = String(gX);
  String gyroY = String(gY);
  String gyroZ = String(gZ);

  String stringRoll = String(roll);
  String stringPitch = String(pitch);

  String stringVoltage = String(voltage);
*/

  if (abs(oldh - h) > 0.05 || abs(oldt - t) > 0.05 || abs(oldhic - hic) > 0.05 || abs(roll - oldroll) > 0.1 || abs(pitch - oldpitch) > 0.1 || abs(oldaccx - a.acceleration.x) > 0.01 || abs(oldaccy - a.acceleration.y) > 0.01 || abs(oldaccz - a.acceleration.z) > 0.01 || abs(oldgyrox - a.gyro.x) > 0.01 || abs(oldgyroy - a.gyro.y) > 0.01 || abs(oldgyroz - a.gyro.z) > 0.01 || abs(oldvoltage - voltage) > 0.5) {
    //displaydrawtext(tempSensorReadings, ST77XX_BLACK);
    //tempSensorReadings = String("Humidity: " + stringH + "\nTemperature: " + stringT + " C \n" + "Heat: " + stringHic + " C \n\n\n" + "Roll: " + stringRoll + " Pitch : " + stringPitch + "\n" + "Acceleration:\nX: " + accX + " Y: " + accY + " Z: " + accZ + "\nGyro:\nX: " + gyroX + " Y: " + gyroY + "Z: " + gyroZ + "\n" + "\n Voltage: " + stringVoltage);
    //fiind variabile globale astea se initalizeaza cu 0, automat se vor printa, iar continuu vor salva old value in
    //momentul printarii
    snprintf(screenBuf, sizeof(screenBuf),
         "Humidity: %.1f\nTemp: %.1f C\nHeat: %.1f C\n\n"
         "Roll: %.1f  Pitch: %.1f\n"
         "Acc:\nX: %.2f Y: %.2f Z: %.2f\n"
         "Gyro:\nX: %.2f Y: %.2f Z: %.2f\n"
         "Voltage: %.2f",
         h, t, hic, roll, pitch, aX, aY, aZ, gX, gY, gZ, voltage);
    oldh = h;
    oldt = t;
    oldhic = hic;

    oldaccx = aX;
    oldaccy = aY;
    oldaccz = aZ;

    oldgyrox = gX;
    oldgyroy = gY;
    oldgyroz = gZ;

    oldroll = roll;
    oldpitch = pitch;
    oldvoltage = voltage;
    //displaydrawtext(tempSensorReadings, ST77XX_WHITE);
    displaydrawtext2(screenBuf, ST77XX_WHITE);

  }
}


void setServoPosition(int azimuth, int elevation) {
  updatePitchFilter(pitch);
  int newAzimuth, newElevation;
  //newAzimtuh=azimuth-(int)rotation;//numai cu MPU9600

  if (azimuth > 90 && azimuth < 270) {
    //servo1.write(180 - (azimuth / 2));  //in loc de 90 va trebui sa fie coordonatele date de accelerometru
    //acum punem 90 pentru ca vom porni ca start de la 90 cu servoul ce da directia pe xoy
    // adica spre est

    //servo2.write(180-(azimuth - 90));  //trebuie sa orientam incat la azimuth 90(servo.write(0)) sa fie orientat direct spre E
    setServo2Target(servo2HomePos - (azimuth - 90));
  } else {
    //servo2.write(180);
    setServo2Target(servo2HomePos);
  }


  newElevation = elevation - (int)pitchF;
  if (newElevation > 0 && newElevation < 100) {//nu permit firele mai mult de atat
    //servo2.write(90 - elevation);
    //servo1.write(newElevation);  //trebuie sa orientam incat sa fie perpendicular pe orizontala la elevation = 0 grade
    setServo1Target(servo1HomePos-newElevation);

  } else {
    //servo1.write(0);
    setServo1Target(servo1HomePos);
  }
  /*
  Serial.println("servo1pos:");
  Serial.print(servo1Pos);
  Serial.print("servo2pos: ");
  Serial.print(servo2Pos);
  */
}
void setServoHomePosition() {
  if (Serial.available() > 0) {
    String s = Serial.readStringUntil('\n');  // reads until Enter
    s.trim();                                 // removes \r and spaces

    if (s == "0") {
      servo1.write(0);
      servo2.write(0);
      Serial.println("Servo -> 0 degrees");
    } else if (s == "1") {
      servo1.write(servo1HomePos);
      servo2.write(servo2HomePos);
      Serial.print("Servo -> 180 degrees");
    }
  }
}
void servoHome() {  //asta e actionat de aplicatie
  setServo1Target(servo1HomePos);
  setServo2Target(servo2HomePos);
}

void resetDisplay() {
  pinMode(TFT_RST, OUTPUT);
  digitalWrite(TFT_RST, LOW);
  delay(50);
  digitalWrite(TFT_RST, HIGH);
  delay(150);
}
void initDisplaySafe() {
  resetDisplay();

  SPI.end();
  delay(50);
  SPI.begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);

  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextSize(1);
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextWrap(false);
}

void resetAllSensors() {
  Serial.println("=== Resetting sensors ===");


  oldh = oldt = oldhic = 0;
  oldaccx = oldaccy = oldaccz = 0;
  oldgyrox = oldgyroy = oldgyroz = 0;
  oldroll = oldpitch = 0;
  oldvoltage = 0;


  pitchF = 0;


  dht.begin();


  if (!mpu.begin()) {
    Serial.println("MPU6050 re-init failed!");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("MPU6050 re-initialized");
  }



  Serial.println("=== Done ===");
}
void setup() {
  Serial.begin(115200);

  //============================================== LED ==============================================
  // Start SPI on the pins we chose (ESP32 lets you pick)
  SPI.begin(TFT_SCLK, -1, TFT_MOSI, TFT_CS);

 initDisplaySafe();


  


  // =================================================================================================



  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi");

  // client.setServer(server, 1883);
  client.setServer(server, 1883);

  client.setCallback(callback);

  //temperature sensor
  Serial.println(F("DHTxx test!"));
  dht.begin();

  //accelerometer sensor

  Serial.println("Adafruit MPU6050 test!");

  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) {
      delay(10);
    }
  }
  Serial.println("MPU6050 Found!");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  ///servos
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  servo1.setPeriodHertz(50);
  servo2.setPeriodHertz(50);
  servo1.attach(servo1Pin, minUs, maxUs);
  servo2.attach(servo2Pin, minUs, maxUs);
  servo1.write(servo1HomePos);
  servo2.write(servo2HomePos);
  //servo1Target=servo1HomePos;
  //servo2Target=servo2HomePos;

  
}

void loop() {
  if (!client.connected()) {
    reconnect();
  } else
    client.loop();



  static uint32_t tDht = 0, tMpu = 0, tVolt = 0, tDisp = 0, tPub = 0;

  uint32_t now = millis();

  if (now - tDht >= 1000) {
    tDht = now;
    processTemperatureReadings();
  }
  if (now - tMpu >= 100) {//50
    tMpu = now;
    processAccelerometerReadings();
  }
  if (now - tVolt >= 500) {//100
    tVolt = now;
    processVoltageReadings();
       Serial.println("Servo1Pos:");
    Serial.print(servo1Pos);
    Serial.println("Servo2Pos:");
    Serial.print(servo2Pos);
    Serial.println("");
  }
  if (now - tPub >= 1000) {
    tPub = now;
    sendSensorReadings(t, pitch, roll, voltage);
  }

  if (now - tDisp >= 1000) {//600
    tDisp = now;
    display_sensor_readings_tft();
 
  }




  if (!manualMode) {
    setServoPosition(azimuth, elevation);
  }
  updateServosSmooth();
  

  if (manualMode && servo1Pos == servo1Target && servo2Pos == servo2Target) {
    azimuth=0;
    elevation=0;
    //manualMode = false;

  }
}
