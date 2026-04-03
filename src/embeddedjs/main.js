import Poco from "commodetto/Poco";
//import parseBMF from "commodetto/parseBMF";
//import parseRLE from "commodetto/parseRLE";
import Battery from "embedded:sensor/Battery";
import Location from "embedded:sensor/Location";
import HTTPClient from "embedded:network/http/client";

const render = new Poco(screen);

// Fonts
const timeFont = new render.Font("Gothic-Regular", 28);
const smallFont = new render.Font("Gothic-Regular", 18);
const smallFont2 = new render.Font("Gothic-Regular", 14);
const dateFont = smallFont;

// Colors
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const gray = render.makeColor(160, 160, 160);
const grayer = render.makeColor(80, 80, 80);

const green = render.makeColor(0, 170, 0);
const greener = render.makeColor(0, 200, 0);
const darkgreen = render.makeColor(0, 64, 0);

const yellow = render.makeColor(255, 170, 0);
const red = render.makeColor(255, 0, 0);

// Colors
const handHour = render.makeColor(0, 0, 160);
const handMinute = render.makeColor(0, 0, 200);

const handHour2 = render.makeColor(100, 100, 160);
const handMinute2 = render.makeColor(100, 100, 200);

// Precompute layout positions

const middleY = (render.height) / 2;
const timeY = middleY - ((timeFont.height) * 2) -10; // (render.height - blockHeight) / 2;
const timeY2 = middleY - ((timeFont.height) * 1) -10; // timeY + (timeFont.height);
const timeY3 = middleY - ((timeFont.height) * 2) - smallFont.height -5; // timeY + (timeFont.height * 2) + 5;
const dateY = render.height - smallFont.height - dateFont.height - 7 ; // timeY + (timeFont.height * 3);

// Store latest time for redraws triggered by other events
let lastDate = new Date();

var last5min = -1;

//last5min = Math.floor(lastDate.getMinutes() / 10);

// quote data
let quote = "++THOUGHT FOR THE DAY++|--- REDACTED ---";


// Weather data
let weather = null;
let latitude = null;
let longitude = null;

// Battery state
let batteryPercent = 100;

const battery = new Battery({
    onSample() {
        batteryPercent = this.sample().percent;
        drawScreen();
    }
});
batteryPercent = battery.sample().percent;

// Connection state
let isConnected = true;

function checkConnection() {
    isConnected = watch.connected.app;
    drawScreen();
}
watch.addEventListener("connected", checkConnection);
checkConnection();

// Map Open-Meteo weather codes to descriptions
function getWeatherDescription(code) {
    if (code === 0) return "Clear";
    if (code <= 3) return "Cloudy";
    if (code <= 48) return "Fog";
    if (code <= 55) return "Drizzle";
    if (code <= 57) return "Fz. Drizzle";
    if (code <= 65) return "Rain";
    if (code <= 67) return "Fz. Rain";
    if (code <= 75) return "Snow";
    if (code <= 77) return "Snow Grains";
    if (code <= 82) return "Showers";
    if (code <= 86) return "Snow Shwrs";
    if (code === 95) return "T-Storm";
    if (code <= 99) return "T-Storm";
    return "Unknown";
}

// Get location from the Location sensor
let location = null;

function requestLocation() {
    location = new Location({
        onSample() {
            const sample = this.sample();
 //           console.log("Got location: " + sample.latitude + ", " + sample.longitude);
            this.close();
            fetchWeather(sample.latitude, sample.longitude);
        }
    });
}

async function fetchWeather(latitude, longitude) {
    try {
        const url = new URL("http://api.open-meteo.com/v1/forecast");
        url.search = new URLSearchParams({
            latitude,
            longitude,
            current: "temperature_2m,weather_code"
        });

  //      console.log("Fetching weather...");
        const response = await fetch(url);
        const data = await response.json();

        weather = {
            temp: Math.round(data.current.temperature_2m),
            conditions: getWeatherDescription(data.current.weather_code)
        };

//        console.log("Weather: " + weather.temp + "C, " + weather.conditions);
        drawScreen();

    } catch (e) {
        console.log("Weather fetch error: " + e);
    }
}

async function fetchquote() {

	
  try {
	
	let dte = lastDate; // new Date();

	
	//last5min
//	console.log("last5min: " + last5min);
	
	var my5min = Math.floor(dte.getMinutes() / 10);
	
//	console.log("this5min: " + my5min);

	
	if (my5min != last5min) { 
		last5min = my5min; 


		
		
//	const quotes	= new Array(4);
//	quotes[0]		= "In the grim darkness|of the far future|There is only war!";
//	quotes[1]		= "Though my guards may sleep|and ships may lie at anchor,|our foes know full well|that big guns never tire.";
//	quotes[2]		= "Only the insane have|strength enough to prosper.|Only those who prosper may|truly judge what is sane.";
//	quotes[3]		= "Cadia Stands!";

	
	
//	let qnum = getRandomInt(quotes.length);
	
//	quote = "++THOUGHT FOR THE DAY++|"+quotes[qnum];
	

	
	
//	return;
		
		
		
//		console.log("new 10 mins - getting new quote.");
//		if (1==1) {
//			let url2 = new URL("https://sabletopia.co.uk/ids2/quote.php");
//			console.log("got quote url...");

console.log("Fetching quote...");		


const http = new HTTPClient({
	host: "sabletopia.co.uk"
});

http.request({
	method: "GET",
	path: "/ids2/quote.php",
	headers: new Map([
		["User-Agent", "PostmanRuntime/7.51.99"],
		["Content-Type", "text/plain"],
		["Referer","https://sabletopia.co.uk/ids2/quote.php"]
	]),	
//	onHeaders(status, headers, statusText) {
//		console.log(`Status ${status}: ${statusText}`);
//		headers.forEach((value, key) => {
//			console.log(`${key}: ${value}`);
//		});
//	},
	onReadable(count) {
		try {
			for (let offset = 0, step = 200; offset < count; offset += step) {
				const buffer = this.read(step);
				//console.log(String.fromArrayBuffer(buffer));
				quote = "++ THOUGHT FOR THE DAY ++|"+String.fromArrayBuffer(buffer);	
				console.log("quoteset: " + quote);
				drawScreen();
			}
		}
		catch (e) {
			console.log("read error: " + e);
		}
	}
});	
			console.log("fetched quote...");
		


//		}
	}
	  
		} catch (e) {
			console.log("quote fetch error: " + e + " - line: "+e.lineNumber);
		}
        drawScreen();	  
	  
}

function drawBatteryBar() {
    const barWidth = ((render.width / 3)*2) | 0;
    const barX = ((render.width - barWidth) / 2) | 0;
    const barY = 5; //render.height < 180 ? 6 : 20;
    const barHeight = 8;

    // Draw border
    render.fillRectangle(white, barX, barY, barWidth, barHeight);
    render.fillRectangle(black, barX + 1, barY + 1, barWidth - 2, barHeight - 2);

    // Choose color based on battery level
    let barColor;
    if (batteryPercent <= 20) {
        barColor = red;
    } else if (batteryPercent <= 40) {
        barColor = yellow;
    } else {
        barColor = green;
    }

    // Draw filled portion
    const fillWidth = ((batteryPercent * (barWidth - 4)) / 100) | 0;
    render.fillRectangle(barColor, barX + 2, barY + 2, fillWidth, barHeight - 4);
}

function drawScreen(event) {
    const now = event?.date ?? lastDate;
    if (event?.date) lastDate = event.date;


	  const time = getFuzzyTime(now);
	  const fuzzy1 = time[0];
	  const fuzzy2 = time[1];
	  const exact  = time[2];
	  const mydate = time[3];
	  
//	  console.log(fuzzy1);
//	  console.log(fuzzy2);
//	  console.log(exact);    
//	  console.log(mydate);    
    
    render.begin();
    render.fillRectangle(black, 0, 0, render.width, render.height);

	  // Determine the width and height of the display
	  var w = render.width;
	  var h = render.height;

	//  drawEagle(ctx);
	  
	  // Determine the center point of the display
	  // and the max size of watch hands
	  var cx = w / 2;
	  var cy = h / 2;

	  // -20 so we're inset 10px on each side
	  var maxLength = (Math.min(w, h) - 20) / 2;

	  // Calculate the minute hand angle
	  var minuteFraction = (now.getMinutes()) / 60;
	  var minuteAngle = fractionToRadian(minuteFraction);

	  // Calculate the hour hand angle
	  var hourFraction = (now.getHours() % 12 + minuteFraction) / 12;
	  var hourAngle = fractionToRadian(hourFraction);

	  // Draw the hour hand
	  drawHand( cx, cy, hourAngle, maxLength * 0.5, handHour2,8);
	  drawHand( cx, cy, hourAngle, maxLength * 0.5, handHour,4);

		  // Draw the minute hand
	  drawHand( cx, cy, minuteAngle, maxLength, handMinute2,6);
	  drawHand( cx, cy, minuteAngle, maxLength, handMinute,2);

	
    // Draw battery bar at top
    drawBatteryBar();

    // Draw Bluetooth disconnect indicator below battery bar
    if (!isConnected) {
        const btStr = "X";
        const btWidth = render.getTextWidth(btStr, smallFont);
        const btY = 2; //render.height < 180 ? 16 : 30;
        // render.drawText(btStr, smallFont, red, (render.width - btWidth) / 2, btY);
        render.drawText(btStr, smallFont, red, (render.width - (btWidth) -5), btY);
    }

    // Format time as HH:MM
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const timeStr = exact; // `${hours}:${minutes}`;
//    const timeStr = fuzzy1;

    // Draw time centered
    let width = render.getTextWidth(fuzzy1, timeFont);
    let width2 = render.getTextWidth(fuzzy2, timeFont);

	render.drawText(fuzzy1, timeFont, grayer, ((render.width - width) / 2)+1, timeY+1);
	render.drawText(fuzzy1, timeFont, gray, ((render.width - width) / 2)+0, timeY+0);
	render.drawText(fuzzy1, timeFont, white, ((render.width - width) / 2)-1, timeY-1);

    render.drawText(fuzzy2, timeFont, grayer, ((render.width - width2) / 2)+1, timeY2+1);
    render.drawText(fuzzy2, timeFont, gray, ((render.width - width2) / 2)+0, timeY2+0);
    render.drawText(fuzzy2, timeFont, white, ((render.width - width2) / 2)-1, timeY2-1);




    // Format date as "Mon Jan 01"
    const dateStr = mydate;

    // Draw date centered below time
    width = render.getTextWidth(dateStr, dateFont);
    render.drawText(dateStr, dateFont, white,
        (render.width - width) / 2, 17);

	let imp = imperialTime(now);

	console.log(imp);


    width = render.getTextWidth(imp, dateFont);
    render.drawText(imp,dateFont, white,
        (render.width - width) / 2,  dateY  ); //  (dateY +dateFont.height +5 ));


	drawQuote();



    // Draw weather at bottom
    const weatherY = render.height - smallFont.height - 5; //(render.height < 180 ? 6 : 20);
	var msg =  "Loading...";
    if (weather) { msg = weather.temp+"°C "+weather.conditions; }

	width = render.getTextWidth(msg, smallFont);
	//render.drawText(weatherStr, smallFont, white, (render.width - width) / 2, weatherY);
	render.drawText(msg, smallFont, white, 5, weatherY);


    let width3 = render.getTextWidth(timeStr, smallFont);
    render.drawText(timeStr, smallFont, white, (render.width - width3) -5, weatherY); //timeY3);


	
	
    render.end();
}

function drawQuote() {
    try {
//		console.log(quote);
		var quotelines = quote.split("|");
		var lines=quotelines.length;
//	console.log("quotelines:"+quotelines);	

	quotelines.forEach(line => {
			let width = render.getTextWidth(line, smallFont2);
	
			render.drawText(line, smallFont2, darkgreen, ((render.width - width)/2)+1, (dateY - (lines * smallFont2.height) -2)+1    ); // middleY+5+(lines * smallFont2.height));
			render.drawText(line, smallFont2, greener, ((render.width - width)/2)+0, (dateY - (lines * smallFont2.height) -2)+0    ); // middleY+5+(lines * smallFont2.height));
	
			lines--;
		});
	
	} catch (e) {
        console.log("quote error: " + e);
    }	
}

	function getFuzzyTime(now) {
    try {
	  		
				const weekdayNames	= new Array(7);				// create array containing names of days
				weekdayNames[0]		= "Sunday";
				weekdayNames[1]		= "Monday";
				weekdayNames[2]		= "Tuesday";
				weekdayNames[3]		= "Wednesday";
				weekdayNames[4]		= "Thursday";
				weekdayNames[5]		= "Friday";
				weekdayNames[6]		= "Saturday";
				
				const hourNames		=  new Array(13);			// create array containing names of hours
				hourNames[0]		= "twelve";					// we need 'twelve' here to account for 'midnight' (hour 0)
				hourNames[1]		= "one";
				hourNames[2]		= "two";
				hourNames[3]		= "three";
				hourNames[4]		= "four";
				hourNames[5]		= "five";
				hourNames[6]		= "six";
				hourNames[7]		= "seven";
				hourNames[8]		= "eight";
				hourNames[9]		= "nine";
				hourNames[10]		= "ten";
				hourNames[11]		= "eleven";
				hourNames[12]		= "twelve";
				
				const minuteNames		= new Array();				// arrays for key minute values
				minuteNames["5"]	= 'five';
				minuteNames["10"]	= 'ten';
				minuteNames["15"]	= 'quarter';
				minuteNames["20"]	= 'twenty';
				minuteNames["25"]	= 'twentyfive';		
				minuteNames["30"]	= 'half';
				
				const prefixes		= new Array();
				prefixes["to"]		= 'to';
				prefixes["past"]	= 'past';
				
				const suffixes		= new Array();				// appended to the time string when hour is sharp ( :56 -> :04 )
				suffixes["sharp"]	= "o'clock";
				
    	  const weekday = new Array(7);
      	weekday[0] = "Sun";
      	weekday[1] = "Mon";
      	weekday[2] = "Tue";
      	weekday[3] = "Wed";
      	weekday[4] = "Thu";
      	weekday[5] = "Fri";
      	weekday[6] = "Sat";

  	    const months = new Array(12);
      	months[0] = "Jan";
      	months[1] = "Feb";
      	months[2] = "Mar";
      	months[3] = "Apr";
      	months[4] = "May";
      	months[5] = "Jun";
      	months[6] = "Jul";
      	months[7] = "Aug";
      	months[8] = "Sept";
      	months[9] = "Oct";
      	months[10] = "Nov";
      	months[11] = "Dec";

				var d				= now; //new Date();				// setup new Date object
				
				var hours			= d.getHours();
				var minutes			= d.getMinutes();
				var minuteName		= d.minuteNames;
				var exactHours		= hours;
				var exactMinutes	= minutes;
				var meridian		= 'am';
				var prefix			= '';
				var suffix			= '';
				var hourName		= '';
//console.log("=====================================");
				
//      console.log("hours: "+hours);
//      console.log("Mnutes: "+minutes);
      
				if(minutes <= 33) {
					prefix		= prefixes.past;
				} else {
					prefix		= prefixes.to;
					minutes		= 60 - minutes;
					hours++;
				}
//console.log("------");
//      console.log("prefix: "+prefix);
//      console.log("hours: "+hours);
//      console.log("Mnutes: "+minutes);
      
      
	if(exactHours >= 13) {
	exactHours		= exactHours - 12;
	}
				if(hours >= 12) {
					hours			= hours - 12;
					meridian		= 'pm';
				}
//console.log("------");
//      console.log("prefix: "+prefix);
//      console.log("hours: "+hours);
//      console.log("Mnutes: "+minutes);
//      console.log("meridian: "+meridian);

      
      hourName			= hourNames[hours];
      
//console.log("------");
//      console.log("hourName: "+hourName);

      
				if (minutes < 4) {
					minuteName = "";
					suffix = suffixes.sharp;
					prefix = "";
				} else if (minutes < 8) {
					minuteName = minuteNames['5'];
				} else if (minutes < 13 ) {
					minuteName = minuteNames['10'];
				} else if ( minutes < 18 ) {
					minuteName = minuteNames['15'];
				} else if ( minutes < 23 ) {
					minuteName = minuteNames['20'];
				} else if ( minutes < 27 ) {
					minuteName = minuteNames['25'];
				} else {
					minuteName = minuteNames['30'];
				}
//      console.log("minuteName: "+minuteName);

//console.log("------");
//      console.log("suffix: "+suffix);
      
      
				var exactTime	= (exactHours) + ':' + pad(exactMinutes,2) + " "+meridian;
				var fuzzyTime1	= minuteName + " " + prefix;
	      var fuzzyTime2	= hourName + " " + suffix;
				
    	  var ord = "th";
    	  if (d.getDate() == 1) { ord = "st"; }
    	  if (d.getDate() == 21) { ord = "st"; }
    	  if (d.getDate() == 31) { ord = "st"; }
    	  if (d.getDate() == 2) { ord = "nd"; }
    	  if (d.getDate() == 22) { ord = "nd"; }
	  
	      var times		= new Array(4);
				times[0]		= fuzzyTime1;
				times[1]		= fuzzyTime2;
				times[2]		= exactTime;
				times[3]		= weekday[d.getDay()] + " " + d.getDate() + ord + " "+months[d.getMonth()];
	  
				return times;
    } catch (e) {
        console.log("fuzzy error: " + e);
        const times		= new Array(4);
				return times;
				
    }

    
    }


	function imperialTime(now) {
		let d				= now;// new Date();				// setup new Date object
	    let year = d.getFullYear();

// 	  console.log("year: " + year);
	  
	      const yearpart = (year+" ").substr(1,3);
	  
//	    console.log("yearpart: " + yearpart);

	      let c = 0;
	//      if(year<10000) {
	        c = (year+" ")[0];
	 //     } else {
	  //      c = (year+" ").substr(0,2);
	  //    }
	      c = c + 1;

//	      console.log("c: " + c);

	  const start = new Date(d.getFullYear(), 0, 0);
	  const diff = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
	  const oneDay = 1000 * 60 * 60 * 24;
	  const day = Math.floor(diff / oneDay) -1;

//	        console.log("day: " + day);

	    const hour = (day*24)+d.getHours();

//	        console.log("hour: " + hour);

	// 8.744744
	const part = Math.floor(hour / 8.744744,0)+1;
  
	const part2 = pad((part+""), 3, '0');
	return "0 " + part2 + " " +yearpart + ".M" + c;  
	}


	function pad(n, width, z) {
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}

	function fractionToRadian(fraction) {
	  return fraction * 2 * Math.PI;
	}

	function drawHand( cx, cy, angle, length, color, thick) {
	  // Find the end points
	  var x2 = cx + Math.sin(angle) * length;
	  var y2 = cy - Math.cos(angle) * length;

	  render.drawLine(cx, cy, x2, y2, color, thick);
	}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Update every minute (fires immediately when registered)
watch.addEventListener("minutechange", drawScreen);

watch.addEventListener("minutechange", fetchquote);

// Refresh weather every 30 minutes
watch.addEventListener("hourchange", requestLocation);



