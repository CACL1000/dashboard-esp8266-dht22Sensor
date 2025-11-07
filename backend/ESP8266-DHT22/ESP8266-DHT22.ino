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

// NTP Client para obtener hora real (UTC-3 para Brasil)
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", -10800, 60000);

DHT dht(DHTPIN, DHTTYPE);
WiFiClient clientTS;
WiFiClientSecure clientSB;

void setup() {
  Serial.begin(9600);
  delay(2000); // Dar tiempo al sistema
  
  Serial.println("\n\n=== INICIANDO SISTEMA ===");
  
  // Inicializar DHT primero
  dht.begin();
  delay(2000); // Dar tiempo al sensor DHT
  
  // Probar sensor DHT
  Serial.println("Probando sensor DHT22...");
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  
  if (isnan(t) || isnan(h)) {
    Serial.println("✗ ADVERTENCIA: Sensor DHT22 no responde!");
    Serial.println("  Verifica las conexiones:");
    Serial.println("  - VCC -> 3.3V");
    Serial.println("  - GND -> GND");
    Serial.println("  - DATA -> D3");
    delay(5000);
  } else {
    Serial.println("✓ Sensor DHT22 funcionando correctamente");
    Serial.print("  Temp: ");
    Serial.print(t);
    Serial.print("°C, Hum: ");
    Serial.print(h);
    Serial.println("%");
  }
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("\nConectando a WiFi: ");
  Serial.println(ssid);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ Conectado a WiFi");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ No se pudo conectar a WiFi");
  }
  
  // Inicializar servicios
  ThingSpeak.begin(clientTS);
  clientSB.setInsecure();
  
  // Inicializar NTP
  timeClient.begin();
  delay(1000);
  timeClient.update();
  
  Serial.println("\n=== SISTEMA LISTO ===\n");
}

String obtenerFechaHora() {
  timeClient.update();
  unsigned long epochTime = timeClient.getEpochTime();
  
  int hours = (epochTime % 86400L) / 3600;
  int minutes = (epochTime % 3600) / 60;
  int seconds = epochTime % 60;
  
  int year = 1970;
  int dayOfYear = epochTime / 86400L;
  
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
  
  char fechaHora[30];
  sprintf(fechaHora, "%04d-%02d-%02dT%02d:%02d:%02d-03:00", 
          year, month, day, hours, minutes, seconds);
  
  return String(fechaHora);
}

void enviarASupabase(float temperatura, float humedad) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi desconectado, omitiendo Supabase");
    return;
  }
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/" + tableName;
  
  StaticJsonDocument<300> doc;
  doc["temperatura"] = temperatura;
  doc["humedad"] = humedad;
  doc["fecha_hora"] = obtenerFechaHora();
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  http.begin(clientSB, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Prefer", "return=minimal");
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode == 201 || httpCode == 200) {
    Serial.println("✓ Supabase OK");
  } else {
    Serial.print("✗ Supabase Error: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

void enviarAThingSpeak(float temperatura, float humedad) {
  // Canal 1
  ThingSpeak.setField(1, humedad);
  ThingSpeak.setField(2, temperatura);
  int x1 = ThingSpeak.writeFields(channel1, writeAPIKey1);

  if (x1 == 200) {
    Serial.println("✓ ThingSpeak Canal 1 OK");
  } else {
    Serial.print("✗ ThingSpeak Canal 1 Error: ");
    Serial.println(x1);
  }

  delay(1000);

  // Canal 2
  ThingSpeak.setField(1, humedad);
  ThingSpeak.setField(2, temperatura);
  int x2 = ThingSpeak.writeFields(channel2, writeAPIKey2);

  if (x2 == 200) {
    Serial.println("✓ ThingSpeak Canal 2 OK");
  } else {
    Serial.print("✗ ThingSpeak Canal 2 Error: ");
    Serial.println(x2);
  }
}

void loop() {
  // Leer sensor con reintentos
  float humedad = dht.readHumidity();
  float temperatura = dht.readTemperature();
  
  int reintentos = 0;
  while ((isnan(humedad) || isnan(temperatura)) && reintentos < 3) {
    Serial.println("Reintentando lectura del sensor...");
    delay(2000);
    humedad = dht.readHumidity();
    temperatura = dht.readTemperature();
    reintentos++;
  }

  if (isnan(humedad) || isnan(temperatura)) {
    Serial.println("✗ ERROR: Sensor DHT22 no responde después de 3 intentos");
    Serial.println("  Revisa las conexiones del sensor");
    delay(5000);
    return;
  }

  Serial.println("\n========== LECTURA ==========");
  Serial.print("Hora: ");
  Serial.println(obtenerFechaHora());
  Serial.print("Temp: ");
  Serial.print(temperatura);
  Serial.println(" °C");
  Serial.print("Hum: ");
  Serial.print(humedad);
  Serial.println(" %");
  Serial.println("-----------------------------");

  // Enviar a Supabase
  enviarASupabase(temperatura, humedad);
  delay(1000);
  
  // Enviar a ThingSpeak
  enviarAThingSpeak(temperatura, humedad);

  Serial.println("=============================\n");

  delay(20000); // 20 segundos entre lecturas
}
