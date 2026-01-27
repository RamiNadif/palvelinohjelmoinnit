import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "template");

const port = 3000;
const host = "localhost";
const palauteet = [];

app.get("/palaute", (req, res) => {
  let nimi = req.query.nimi;
  let sahkoposti = req.query.sahkoposti;
  let palaute = req.query.palaute;
  if (!nimi || !sahkoposti || !palaute) {
    nimi = "";
    sahkoposti = "";
    palaute = "";
  }

  res.render("palaute", {
    nimi: nimi,
    sposti: sahkoposti,
    palaute: palaute,
  });
});

app.post("/palaute", (req, res) => {
  let nimi = req.body.nimi;
  let sahkoposti = req.body.sahkoposti;
  let palaute = req.body.palaute;
  palauteet.push({ nimi, sahkoposti, palaute });
  res.render("vastaus", { nimi, sposti: sahkoposti });
});

app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));
