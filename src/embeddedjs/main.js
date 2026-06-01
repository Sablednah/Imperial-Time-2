import Poco from "commodetto/Poco";
import Battery from "embedded:sensor/Battery";
import Location from "embedded:sensor/Location";
import HTTPClient from "embedded:network/http/client";

const render = new Poco(screen);

// Fonts
const timeFont   = new render.Font("Gothic-Regular", 28);
const smallFont  = new render.Font("Gothic-Regular", 18);
const smallFont2 = new render.Font("Gothic-Regular", 14);
const dateFont   = smallFont;

// Colors
const black    = render.makeColor(0, 0, 0);
const white    = render.makeColor(255, 255, 255);
const gray     = render.makeColor(160, 160, 160);
const grayer   = render.makeColor(80, 80, 80);
const green    = render.makeColor(0, 170, 0);
const greener  = render.makeColor(0, 200, 0);
const darkgreen = render.makeColor(0, 64, 0);
const yellow   = render.makeColor(255, 170, 0);
const red      = render.makeColor(255, 0, 0);
const handHour    = render.makeColor(0, 0, 160);
const handMinute  = render.makeColor(0, 0, 200);
const handHour2   = render.makeColor(100, 100, 160);
const handMinute2 = render.makeColor(100, 100, 200);

// Layout positions
const middleY = render.height / 2;
const timeY  = middleY - timeFont.height * 2 - 10;
const timeY2 = middleY - timeFont.height - 10;
const dateY  = render.height - smallFont.height - dateFont.height - 7;

// Hoisted lookup tables — allocated once instead of every minute inside getFuzzyTime
const HOUR_NAMES   = ["twelve","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
const WEEKDAY      = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS       = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
const MINUTE_NAMES = { 5:"five", 10:"ten", 15:"quarter", 20:"twenty", 25:"twentyfive", 30:"half" };

// State
let lastDate       = new Date();
let last10min      = -1;
let quote          = "++THOUGHT FOR THE DAY++|--- REDACTED ---";
let weather        = null;
let batteryPercent = 100;
let isConnected    = true;
let activeLocation = null;

// Battery
const battery = new Battery({
    onSample() {
        batteryPercent = this.sample().percent;
        drawScreen();
    }
});
batteryPercent = battery.sample().percent;

// Connection
function checkConnection() {
    isConnected = watch.connected.app;
    drawScreen();
}
watch.addEventListener("connected", checkConnection);
checkConnection();

function getWeatherDescription(code) {
    if (code === 0) return "Clear";
    if (code <= 3)  return "Cloudy";
    if (code <= 48) return "Fog";
    if (code <= 55) return "Drizzle";
    if (code <= 57) return "Fz. Drizzle";
    if (code <= 65) return "Rain";
    if (code <= 67) return "Fz. Rain";
    if (code <= 75) return "Snow";
    if (code <= 77) return "Snow Grains";
    if (code <= 82) return "Showers";
    if (code <= 86) return "Snow Shwrs";
    if (code <= 99) return "T-Storm";
    return "Unknown";
}

function requestLocation() {
    activeLocation = new Location({
        onSample() {
            const s = this.sample();
            this.close();
            activeLocation = null;
            fetchWeather(s.latitude, s.longitude);
        }
    });
}

async function fetchWeather(lat, lon) {
    try {
        const url = new URL("http://api.open-meteo.com/v1/forecast");
        url.search = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: "temperature_2m,weather_code"
        });
        const response = await fetch(url);
        const data = await response.json();
        weather = {
            temp: Math.round(data.current.temperature_2m),
            conditions: getWeatherDescription(data.current.weather_code)
        };
        drawScreen();
    } catch (e) {
        console.log("Weather fetch error: " + e);
    }
}

async function fetchquote() {
    const my10min = Math.floor(lastDate.getMinutes() / 10);
    if (my10min === last10min) return;
    last10min = my10min;

    try {
        const http = new HTTPClient({ host: "sabletopia.co.uk" });
        http.request({
            method: "GET",
            path: "/ids2/quote.php",
            headers: new Map([
                ["User-Agent", "PostmanRuntime/7.51.99"],
                ["Content-Type", "text/plain"],
                ["Referer", "https://sabletopia.co.uk/ids2/quote.php"]
            ]),
            onReadable(count) {
                try {
                    for (let offset = 0; offset < count; offset += 200) {
                        quote = "++ THOUGHT FOR THE DAY ++|" + String.fromArrayBuffer(this.read(200));
                        drawScreen();
                    }
                } catch (e) {
                    console.log("read error: " + e);
                }
            }
        });
    } catch (e) {
        console.log("quote fetch error: " + e);
    }
    drawScreen();
}

function drawBatteryBar() {
    const barWidth  = ((render.width / 3) * 2) | 0;
    const barX      = ((render.width - barWidth) / 2) | 0;
    const barHeight = 8;
    const barColor  = batteryPercent <= 20 ? red : batteryPercent <= 40 ? yellow : green;
    const fillWidth = ((batteryPercent * (barWidth - 4)) / 100) | 0;

    render.fillRectangle(white,    barX,     5, barWidth,     barHeight);
    render.fillRectangle(black,    barX + 1, 6, barWidth - 2, barHeight - 2);
    render.fillRectangle(barColor, barX + 2, 7, fillWidth,    barHeight - 4);
}

function drawScreen(event) {
    const now = event?.date ?? lastDate;
    if (event?.date) lastDate = event.date;

    const [fuzzy1, fuzzy2, exactTime, dateStr] = getFuzzyTime(now);

    render.begin();
    render.fillRectangle(black, 0, 0, render.width, render.height);

    const cx        = render.width / 2;
    const cy        = render.height / 2;
    const maxLength = (Math.min(render.width, render.height) - 20) / 2;

    const minuteFraction = now.getMinutes() / 60;
    const minuteAngle    = minuteFraction * 2 * Math.PI;
    const hourAngle      = (now.getHours() % 12 + minuteFraction) / 12 * 2 * Math.PI;

    drawHand(cx, cy, hourAngle,   maxLength * 0.5, handHour2,   8);
    drawHand(cx, cy, hourAngle,   maxLength * 0.5, handHour,    4);
    drawHand(cx, cy, minuteAngle, maxLength,       handMinute2, 6);
    drawHand(cx, cy, minuteAngle, maxLength,       handMinute,  2);

    drawBatteryBar();

    if (!isConnected) {
        const btStr = "X";
        render.drawText(btStr, smallFont, red, render.width - render.getTextWidth(btStr, smallFont) - 5, 2);
    }

    let w = render.getTextWidth(fuzzy1, timeFont);
    render.drawText(fuzzy1, timeFont, grayer, (render.width - w) / 2 + 1, timeY + 1);
    render.drawText(fuzzy1, timeFont, gray,   (render.width - w) / 2,     timeY);
    render.drawText(fuzzy1, timeFont, white,  (render.width - w) / 2 - 1, timeY - 1);

    w = render.getTextWidth(fuzzy2, timeFont);
    render.drawText(fuzzy2, timeFont, grayer, (render.width - w) / 2 + 1, timeY2 + 1);
    render.drawText(fuzzy2, timeFont, gray,   (render.width - w) / 2,     timeY2);
    render.drawText(fuzzy2, timeFont, white,  (render.width - w) / 2 - 1, timeY2 - 1);

    w = render.getTextWidth(dateStr, dateFont);
    render.drawText(dateStr, dateFont, white, (render.width - w) / 2, 17);

    const imp = imperialTime(now);
    w = render.getTextWidth(imp, dateFont);
    render.drawText(imp, dateFont, white, (render.width - w) / 2, dateY);

    drawQuote();

    const weatherY = render.height - smallFont.height - 5;
    const msg = weather ? `${weather.temp}°C ${weather.conditions}` : "Loading...";
    render.drawText(msg, smallFont, white, 5, weatherY);
    w = render.getTextWidth(exactTime, smallFont);
    render.drawText(exactTime, smallFont, white, render.width - w - 5, weatherY);

    render.end();
}

function drawQuote() {
    try {
        const lines = quote.split("|");
        let remaining = lines.length;
        lines.forEach(line => {
            const w = render.getTextWidth(line, smallFont2);
            const x = (render.width - w) / 2;
            const y = dateY - remaining * smallFont2.height - 2;
            render.drawText(line, smallFont2, darkgreen, x + 1, y + 1);
            render.drawText(line, smallFont2, greener,   x,     y);
            remaining--;
        });
    } catch (e) {
        console.log("quote error: " + e);
    }
}

function getFuzzyTime(now) {
    try {
        let hours   = now.getHours();
        let minutes = now.getMinutes();

        const exactHours   = hours >= 13 ? hours - 12 : hours;
        const exactMinutes = minutes;
        const meridian     = hours >= 12 ? "pm" : "am";

        let prefix, suffix = "", minuteName;

        if (minutes <= 33) {
            prefix = "past";
        } else {
            prefix = "to";
            minutes = 60 - minutes;
            hours++;
        }
        if (hours >= 12) hours -= 12;

        if (minutes < 4)       { minuteName = ""; suffix = "o'clock"; prefix = ""; }
        else if (minutes < 8)  { minuteName = MINUTE_NAMES[5]; }
        else if (minutes < 13) { minuteName = MINUTE_NAMES[10]; }
        else if (minutes < 18) { minuteName = MINUTE_NAMES[15]; }
        else if (minutes < 23) { minuteName = MINUTE_NAMES[20]; }
        else if (minutes < 27) { minuteName = MINUTE_NAMES[25]; }
        else                   { minuteName = MINUTE_NAMES[30]; }

        const d   = now.getDate();
        const ord = (d === 1 || d === 21 || d === 31) ? "st"
                  : (d === 2 || d === 22) ? "nd" : "th";

        return [
            `${minuteName} ${prefix}`,
            `${HOUR_NAMES[hours]} ${suffix}`,
            `${exactHours}:${String(exactMinutes).padStart(2, "0")} ${meridian}`,
            `${WEEKDAY[now.getDay()]} ${d}${ord} ${MONTHS[now.getMonth()]}`
        ];
    } catch (e) {
        console.log("fuzzy error: " + e);
        return ["", "", "", ""];
    }
}

function imperialTime(now) {
    const year    = now.getFullYear();
    const yearStr = String(year);
    const yearpart   = yearStr.slice(1, 4);
    const millennium = yearStr[0] + "1";

    const start = new Date(year, 0, 0);
    const diff  = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const day   = Math.floor(diff / 86400000) - 1;
    const hour  = day * 24 + now.getHours();
    const part  = String(Math.floor(hour / 8.744744) + 1).padStart(3, "0");

    return `0 ${part} ${yearpart}.M${millennium}`;
}

function drawHand(cx, cy, angle, length, color, thick) {
    render.drawLine(cx, cy, cx + Math.sin(angle) * length, cy - Math.cos(angle) * length, color, thick);
}

watch.addEventListener("minutechange", drawScreen);
watch.addEventListener("minutechange", fetchquote);
watch.addEventListener("hourchange", requestLocation);
