#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "ThingSpeak.h"
#include "DHT.h"
#include <ArduinoJson.h>

#define DHTPIN D3
#define DHTTYPE DHT22

// WiFi
const char* ssid = "ifmachado";
const char* password = "";

// ThingSpeak - Canal 1
unsigned long channel1 = 3145537;      
const char* writeAPIKey1 = "NMKR9MC4IXMHP2JV";

// ThingSpeak - Canal 2
unsigned long channel2 = 3147253;      
const char* writeAPIKey2 = "KETZIA501YV15I7U";

// Supabase
const char* supabaseUrl = "https://mwuazfgptsqoxcnbzosf.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWF6ZmdwdHNxb3hjbmJ6b3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjg5NjEsImV4cCI6MjA3Nzg0NDk2MX0.mnE762xpz5RJMFNrUpc-M51M8LpoENW8bESOwWZJPo4";
const char* tableName = "lecturas";

// NTP Client para obtener hora real
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", -10800, 60000); // -10800 = UTC-3 (Brasil)

DHT dht(DHTPIN, DHTTYPE);
WiFiClient clientTS;
WiFiClientSecure clientSB;

void setup() {
  Serial.begin(9600);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConectado a WiFi");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Inicializar servicios
  ThingSpeak.begin(clientTS);
  clientSB.setInsecure();
  dht.begin();
  
  // Inicializar cliente NTP
  timeClient.begin();
  timeClient.update();
  
  Serial.println("Sistema iniciado correctamente");
}

String obtenerFechaHora() {
  timeClient.update();
 String obtenerFechaHora1() {
  timeClient.update();
  
  // Obtener timestamp Unix y convertir a formato ISO 8601
  unsigned long epochTime = timeClient.getEpochTime();
  
  // Calcular componentes de fecha y hora
  int hours = (epochTime % 86400L) / 3600;
  int minutes = (epochTime % 3600) / 60;
  int seconds = epochTime % 60;
  
  int year = 1970;
  int dayOfYear = epochTime / 86400L;
  
  // Calcular año
  while (dayOfYear >= 365) {
    if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) {
      if (dayOfYear >= 366) {
        dayOfYear -= 366;
        year++;
      } else {
        break;
      }
    } else {
      dayOfYear -= 365;
      year++;
    }
  }
  
  // Días por mes
  int daysInMonth[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
  if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) {
    daysInMonth[1] = 29;
  }
  
  int month = 0;
  int day = dayOfYear + 1;
  
  for (int i = 0; i < 12; i++) {
    if (day <= daysInMonth[i]) {
      month = i + 1;
      break;
    }
    day -= daysInMonth[i];
  }
  
  // Formato ISO 8601: YYYY-MM-DDTHH:MM:SS-03:00
  char fechaHora[30];
  sprintf(fechaHora, "%04d-%02d-%02dT%02d:%02d:%02d-03:00", 
          year, month, day, hours, minutes, seconds);
  
  return String(fechaHora);
}

void enviarASupabase(float temperatura, float humedad) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    String url = String(supabaseUrl) + "/rest/v1/" + tableName;
    
    // Crear JSON con fecha y hora
    StaticJsonDocument<300> doc;
    doc["temperatura"] = temperatura;
    doc["humedad"] = humedad;
    doc["fecha_hora"] = obtenerFechaHora();
    doc["fecha_hora_local"] = obtenerFechaHora1();
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    http.begin(clientSB, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + String(supabaseKey));
    http.addHeader("Prefer", "return=minimal");
    
    int httpCode = http.POST(jsonData);
    
    if (httpCode > 0) {
      if (httpCode == 201 || httpCode == 200) {
        Serial.println("✓ Datos enviados a Supabase");
      } else {
        Serial.print("✗ Error Supabase (HTTP ");
        Serial.print(httpCode);
        Serial.println("): " + http.getString());
      }
    } else {
      Serial.println("✗ Error conexión Supabase: " + http.errorToString(httpCode));
    }
    
    http.end();
  }
}

void enviarAThingSpeak(float temperatura, float humedad) {
  // Enviar al Canal 1
  ThingSpeak.setField(1, humedad);
  ThingSpeak.setField(2, temperatura);
  int x1 = ThingSpeak.writeFields(channel1, writeAPIKey1);

  if (x1 == 200) {
    Serial.println("✓ Datos enviados a ThingSpeak Canal 1");
  } else {
    Serial.println("✗ Error ThingSpeak Canal 1 (HTTP " + String(x1) + ")");
  }

  delay(1000); // Pequeña pausa entre canales

  // Enviar al Canal 2
  ThingSpeak.setField(1, humedad);
  ThingSpeak.setField(2, temperatura);
  int x2 = ThingSpeak.writeFields(channel2, writeAPIKey2);

  if (x2 == 200) {
    Serial.println("✓ Datos enviados a ThingSpeak Canal 2");
  } else {
    Serial.println("✗ Error ThingSpeak Canal 2 (HTTP " + String(x2) + ")");
  }
}

void loop() {
  float humedad = dht.readHumidity();
  float temperatura = dht.readTemperature();

  if (isnan(humedad) || isnan(temperatura)) {
    Serial.println("✗ Error al leer el sensor DHT!");
    delay(2000);
    return;
  }

  Serial.println("\n========== NUEVA LECTURA ==========");
  Serial.print("Fecha/Hora: ");
  Serial.println(obtenerFechaHora());
  Serial.print("Temperatura: ");
  Serial.print(temperatura);
  Serial.println(" °C");
  Serial.print("Humedad: ");
  Serial.print(humedad);
  Serial.println(" %");
  Serial.println("-----------------------------------");

  // Enviar a Supabase
  enviarASupabase(temperatura, humedad);
  
  delay(1000); // Pausa entre envíos
  
  // Enviar a ThingSpeak
  enviarAThingSpeak(temperatura, humedad);

  Serial.println("===================================\n");

  // Esperar 20 segundos (límite de ThingSpeak)
  delay(20000);
}
