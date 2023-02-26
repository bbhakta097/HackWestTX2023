import express from "express";
import fetch from "node-fetch";
import twilio from "twilio";
import bodyParser from "body-parser";


//Uses Enter to Submit the phone#
var input = document.getElementById("phoneinput");
input.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("subbutt").click();
  }
});

//function for showing and testing phone number
function phonestore() {
  let phoneinput = document.querySelector("#phoneinput");
  let message = document.querySelector("#message");
  value = phoneinput.value;
  value = String(value);
  check = 0;

  if (value.length == 10) {
    for (i = 0; i < value.length; i++) {
      if (
        value[i] != "0" &&
        value[i] != "1" &&
        value[i] != "2" &&
        value[i] != "3" &&
        value[i] != "4" &&
        value[i] != "5" &&
        value[i] != "6" &&
        value[i] != "7" &&
        value[i] != "8" &&
        value[i] != "9"
      ) {
        check = 1;
      } else {
      }
    }
    if (check == 1) {
      alert("Invalid characters. Please try again.");
    } else {
      /*message.innerHTML = "Phone number is: +1" + value;*/
      window.location.href = "thanks.html";
    }
  } else {
    alert("Please enter a 10-digit number.");
  }
}


const app = express();
const apiKey = "AIzaSyBMylzHFojddOJfJo8Z2CSr9TIOIbT4kf8";

// Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_ACCOUNT_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: "Hello, welcome to EmTour! Send us a city you plan to visit, and we will provide you with cool tourist locations!",
    from: "+18339043402",
    to: "+19364467645",
  })
  .then((message) => console.log(message.sid));

// New endpoint for testing
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// Handle incoming SMS messages
app.post("/sms", (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const messageBody = req.body.Body;

  // Extract the city name from the incoming SMS message
  const cityName = extractCityName(messageBody);

  // Construct the API request URL
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+in+${cityName}&key=${apiKey}`;

  // Make a request to the API using the Fetch API
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Extract up to five tourist locations from the API response
      const touristLocations = data.results.slice(0, 5).map((location) => {
        return {
          name: location.name,
          address: location.formatted_address,
          rating: location.rating,
          //photoUrl: location.photos ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${location.photos[0].photo_reference}&key=${apiKey}` : null
        };
      });

      let messageBody =
        "Here are some tourist locations in " + cityName + ":\n";
      touristLocations.forEach((location) => {
        messageBody += `\n${location.name}\n${location.address}\nRating: ${location.rating}`;
        /*if (location.photoUrl) {
          messageBody += `\n${location.photoUrl}`;
        }*/
        messageBody += "\n";
      });

      // Send a response SMS message with the tourist locations
      twiml.message(messageBody);
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(twiml.toString());
    })
    .catch((error) => console.log(error));
});

// Extracts the name of the city from an SMS message
function extractCityName(message) {
  // This is just a sample implementation - you'll need to customize this to handle different message formats
  const parts = message.split(" ");
  return parts[0];
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
