import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Palaute-data REST-apia varten
import feedback from "./feedback_mock.json" with { type: "json" };
let palautteet = Array.isArray(feedback) ? [...feedback] : [];

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const host = "localhost";
const port = 3000;

const app = express();
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.use("/styles", express.static("includes/styles"));

app.use(express.urlencoded({ extended: true }));

// Polkumäärittelyt ejs-sivupohjia käyttäville web-sivuille
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/palautelomake", (req, res) => {
  res.render("palaute");
});
app.post("/palautelomake", async (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  let feedbackpalaute = req.body.feedbackpalaute;

  fs.readFile("data.json", "utf8", function (err, dataString) {
    if (err) {
      console.log("ERR: Palaute-datan lukeminen epäonnistui");
    } else {
      let data = [];
      try {
        data = JSON.parse(dataString);
        if (!Array.isArray(data)) {
          data = [];
          throw new TypeError("Data not an array");
        }
      } catch (error) {
        console.log("ERR: Palaute-datan lukeminen epäonnistui");
        console.log(error);
      }

      data.push({
        name: name,
        email: email,
        feedbackpalaute: feedbackpalaute,
      });

      fs.writeFile(
        "data.json",
        JSON.stringify(data),
        { encoding: "utf8" },
        (err) => {
          if (err) {
            console.log("ERR: Palaute-datan tallettaminen epäonnistui");
          } else {
            console.log("OK:  Palaute-datan tallettaminen onnistui");
          }
        },
      );

      res.render("vastaus", { name: name, email: email });
    }
  });
});

// REST-palvelimen polut
app.get("/palaute/", (req, res) => {
  // Palauttaa kaikki palautteet
  res.json(palautteet);
});
app.get("/palaute/:id", (req, res) => {
  const haettava = req.params.id;
  const tulos = [];
  for (let palaute of palautteet) {
    if (palaute.id == haettava) {
      tulos.push(palaute);
    }
  }
  res.json(tulos);
  // Palauttaa yhden palautteen
});
app.post("/palaute/uusi", (req, res) => {
  const id = req.body.id;
  const newname = req.body.name;
  const newemail = req.body.email;
  const newfeedback = req.body.feedbackpalaute;
  if (
    id == undefined ||
    newname == undefined ||
    newemail == undefined ||
    newfeedback == undefined
  ) {
    res.status(400).json({ viesti: "virhe: Kaikkia tietoja ei annettu" });
  } else {
    const uusi = {
      id: id,
      name: newname,
      email: newemail,
      feedbackpalaute: newfeedback,
    };
    palautteet.push(uusi);
    res.json({ viesti: "palaute lisätty." });
  }

  // Lisää uuden palautteen. Palaute pyynnön body:ssä
});
app.put("/palaute/:id", (req, res) => {
  const muokattava = req.params.id;
  const changename = req.body.name;
  const changeemail = req.body.email;
  const changefeedback = req.body.feedbackpalaute;
  let onolemassa = false;
  for (let palaute of palautteet) {
    if (palaute.id == muokattava) {
      palaute.name = changename;
      palaute.email = changeemail;
      palaute.feedbackpalaute = changefeedback;
      onolemassa = true;
    }
  }
  if (onolemassa) {
    res.json({ viesti: "Muokkaus tehty." });
  } else {
    res
      .status(400)
      .json({ viesti: "Virhe: Annettua ID-numeroa ei ole olemassa." });
  }
  // Muokkaa tietyn palautteen sisältöä. (Miksi tällainen on?)
});
app.delete("/palaute/:id", (req, res) => {
  const poistettava = req.params.id;

  let onolemassa = false;
  for (let i = 0; i < palautteet.length; i++) {
    if (palautteet[i].id == poistettava) {
      palautteet.splice(i, 1);
      onolemassa = true;
      i--;
    }
  }
  if (onolemassa) {
    res.json({ viesti: "palaute poistettu." });
  } else {
    res
      .status(400)
      .json({ viesti: "Virhe: Annettua ID-numeroa ei ole olemassa." });
  }
  // Poistaa tietyn palautteen. (Miksi tällainen on?)
});

// Aina viimeisenä palvelimen käynnistys
app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));
