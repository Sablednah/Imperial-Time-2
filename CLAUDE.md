# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pebble watchface targeting **emery** and **gabbro** platforms (round Pebble watches). The theme is Warhammer 40K — fuzzy time display, Imperial dating system, and rotating quotes fetched from an external API.

Uses the **Moddable** project type (`"projectType": "moddable"` in `package.json`), which embeds the Moddable XS JavaScript engine on the watch via `@moddable/pebbleproxy`.

## Build & Deploy

```bash
pebble build
pebble install --emulator emery     # run in emulator
pebble install                      # install on connected watch
pebble logs                         # stream console.log output from watch
```

## Architecture

There are three distinct execution environments:

| File | Runs on | Purpose |
|------|---------|---------|
| `src/c/mdbl.c` | Watch (native) | Minimal C bootstrap — creates a window, calls `moddable_createMachine(NULL)` to start the JS runtime. Not normally edited. |
| `src/embeddedjs/main.js` | Watch (JS via Moddable XS) | All watchface logic: rendering, time formatting, weather, quotes, clock hands. |
| `src/pkjs/index.js` | Phone (PebbleKit JS) | Bridges `appmessage` events to the Moddable proxy. Thin glue layer. |

`src/embeddedjs/manifest.json` is the Moddable build manifest — it includes `manifest_mod.json` from the Moddable SDK and points to `main.js` as the entry module.

## Key Logic in `main.js`

- **Rendering**: Uses Moddable's `Poco` API (`render.begin()` / `render.end()` wrapping all draw calls). Text is drawn with manual drop-shadow offsets for the white-on-black look.
- **`getFuzzyTime(now)`**: Returns a 4-element array `[fuzzyLine1, fuzzyLine2, exactTime, dateString]`. Fuzzy time uses English phrases ("twenty past", "quarter to", etc.).
- **`imperialTime(now)`**: Converts the current date to the Warhammer 40K Imperial dating format (`0 NNN YYY.MC`).
- **Weather**: Fetched from `api.open-meteo.com` on `hourchange` events via `requestLocation()` → `fetchWeather()`. No API key required.
- **Quotes**: Fetched from `sabletopia.co.uk/ids2/quote.php` every 10 minutes (throttled by comparing `Math.floor(minutes / 10)` against `last5min`). Pipe-delimited (`|`) lines are split for multi-line display.
- **Event loop**: `watch.addEventListener("minutechange", drawScreen)` drives all rendering. Battery and Bluetooth state trigger `drawScreen()` directly on change.

## Documentation

Full SDK and API reference: https://developer.repebble.com  
LLM-friendly index: https://developer.repebble.com/llms.txt

## External Dependencies

- `@moddable/pebbleproxy` — npm package that enables the Moddable JS runtime on Pebble hardware.
- `api.open-meteo.com` — free weather API, no key needed.
- `sabletopia.co.uk/ids2/quote.php` — quote source, returns plain text.
