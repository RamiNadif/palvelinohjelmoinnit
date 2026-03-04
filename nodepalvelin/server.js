import express from "express";
import mysql from "mysql2/promise";
import session from "express-session";
import dbconfig from "./dbconfig.json" with { type: "json" };
import bcrypt from "bcrypt";
import requireLogin from "./db.js";

const host = "localhost";
const port = 3000;

const app = express();
const pool = mysql.createPool(dbconfig);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "this is a super secret", // salaus session suojaamiseen
    resave: false, // ei tallenna sessioo jos ei tuu muutoksii
    saveUninitialized: false, // ei luo turhii sessiot eli jos laittaa tyhjii tunnuksii
    cookie: { secure: false },
  }),
);

app.get("/", requireLogin, (req, res) => {
  res.render("index", { user: req.session.user });
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || username.trim() === "") {
      console.log("Luo ne tunnukset äijjäääää");
      return res.render("signup", { message: "Username cannot be empty" });
    }
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );

    if (existing.length > 0) {
      return console.log("ei toimi bro")(
        res.render("signup", { message: "Username already exists" }),
      );
    }

    // Hashätään salasana
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tallennetaan käyttäjä
    await pool.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);

    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (username.trim() === "" || password.trim() === "") {
      console.log("laita sun tunnkset bro");
      return res.render("login", { message: "Username cannot be empty" });
    }
    const [row] = await pool.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (row.length === 0) {
      return res.render("login", { message: "Wrong username or password" });
    }

    const user = row[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return (
        res.render("login", { message: "Wrong username or password" }) +
        console.log("väärä tunnus bro")
      );
    }

    // Luo session
    req.session.user = { id: user.id, username: user.username };

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));
