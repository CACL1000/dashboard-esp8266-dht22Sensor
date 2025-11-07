#include <ESP8266WiFi.h>
#include "ThingSpeak.h"
#include "DHT.h"

#define DHTPIN D3          // Pin donde está conectado el sensor
#define DHTTYPE DHT22      // Tipo de sensor

const char* ssid = "ifmachado";        // Nombre de tu red WiFi
const char* password = "";             // Contraseña de tu red WiFi

// Canal 1
unsigned long channel1 = 3145537;      
const char* writeAPIKey1 = "NMKR9MC4IXMHP2JV";

// Canal 2
unsigned long channel2 = 3147253;      
const char* writeAPIKey2 = "KETZIA501YV15I7U";

WiFiClient client;
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConectado a WiFi");
  ThingSpeak.begin(client);
  dht.begin();
}

void loop() {
  float humedad = dht.readHumidity();
  float temperatura = dht.readTemperature();

  if (isnan(humedad) || isnan(temperatura)) {
    Serial.println("Error al leer el sensor DHT!");
    return;
  }

  Serial.print("Temperatura: ");
  Serial.print(temperatura);
  Serial.print(" °C  |  Humedad: ");
  Serial.print(humedad);
  Serial.println(" %");

  // Enviar al primer canal
  ThingSpeak.setField(1, humedad);
  ThingSpeak.setField(2, temperatura);
  int x1 = ThingSpeak.writeFields(channel1, writeAPIKey1);

  if (x1 == 200) {
    Serial.println("Datos enviados correctamente al canal 1");
  } else {
    Serial.println("Error al enviar al canal 1. Código HTTP: " + String(x1));
  }

  // Enviar al segundo canal
  ThingSpeak.setField(1, humedad);
  ThingSpeak.setField(2, temperatura);
  int x2 = ThingSpeak.writeFields(channel2, writeAPIKey2);

  if (x2 == 200) {
    Serial.println("Datos enviados correctamente al canal 2");
  } else {
    Serial.println("Error al enviar al canal 2. Código HTTP: " + String(x2));
  }

  delay(20000); // mínimo 15 segundos entre actualizaciones
}
