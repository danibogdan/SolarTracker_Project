# Local setup

This publication copy excludes Git history, personal configuration, Wi-Fi/MQTT
credentials, installed dependencies, and machine-specific metadata.

## Server

In `serverApplication/`:

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and enter your own MQTT broker settings.
3. Set `TRACKER_LATITUDE` and `TRACKER_LONGITUDE`, or choose a location in the UI.
   The default coordinates `(0, 0)` are neutral placeholders.
4. Run `npm start`. The API listens on port 3000.

## Web interface

In `SolarTrackerInterface/`:

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_API_BASE_URL3` to your API's address (default: localhost:3000).
4. Run `npm run dev`.

Vite exposes `VITE_*` values to the browser. Use them for the public API address,
not for passwords or secret keys.

## ESP32

Copy `ArduinoCode/config.example.h` to `ArduinoCode/config.h`. Enter your own
Wi-Fi credentials, reachable MQTT broker hostname, and device MQTT credentials.
Install the Arduino libraries referenced by `TrackerSolar.ino` and upload the
sketch to your ESP32.

Keep `.env*` files other than `.env.example`, and `ArduinoCode/config.h`, private.
For manual GitHub uploads, inspect the files being selected: `.gitignore` rules
should not be relied on to filter browser uploads.
