import express from "express";

import path from "path";

import { fileURLToPath } from "url";
let machineon = false;

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const host = "localhost";
const port = 3000;

const app = express();
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.use(express.urlencoded({ extended: true }));

// Polkumäärittelyt ejs-sivupohjia käyttäville web-sivuille
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/kahvinkeitin/set/on", (req, res) => {
  machineon = true;
  console.log("kahvinkeitin on päällä");
  res.send("kahvinkeitin on päällä");
});
app.get("/kahvinkeitin/set/off", (req, res) => {
  machineon = false;
  console.log("kahvinkeitin on pois päältä");
  res.send("kahvinkeitin on pois päältä");
});
app.get("/kahvinkeitin/coffee", (req, res) => {
  makeCoffee(machineon)
    .then((result) => {
      console.log(result); // Logs "☕ Coffee is ready!" after 2 seconds
      res.send(result);
    })

    .catch((error) => {
      console.error(error); // If the machine is off, logs the rejection message
      res.send(error);
    });
});

function makeCoffee(isMachineOn) {
  return new Promise((resolve, reject) => {
    console.log("Starting the coffee machine...");

    setTimeout(() => {
      if (isMachineOn) {
        resolve("☕ Coffee is ready!");
      } else {
        reject("🚫 Coffee machine is off. Please turn it on.");
      }
    }, 2000); // Simulate 2 seconds to make coffee
  });
}

// Using the promise

app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));
