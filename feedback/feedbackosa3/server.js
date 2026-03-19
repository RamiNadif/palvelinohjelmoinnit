//import
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";

import path from "node:path";

import config from "./config.json" with { type: "json" };

import mysql from "mysql2/promise";
import dbconfig from "./dbconfig.json" with { type: "json" };
const { host, port } = config;
const pool = mysql.createPool(dbconfig);
const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "salainen_avain",
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//ejs moottori
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));

//vakiot

app.get("/", async (req, res) => {
  try {
    const sql1 = `SELECT customer.name AS asiakas, customer.id,
     system_user.fullname AS koko_nimi, system_user.email, 
     IF(system_user.admin = 1,'Kyllä','Ei') AS admin FROM customer LEFT JOIN system_user ON system_user.customer_id = customer.id`;

    const [rows] = await pool.query(sql1);

    res.render("index", { rows: rows });
  } catch (error) {
    console.error(error);
    res.send("Tietokantavirhe");
  }
});
app.get("/feedback", async (req, res) => {
  try {
    const sql1 = `SELECT system_user.fullname AS asiakas, feedback.id AS id,
       feedback.arrived AS saapunut, feedback.guest_name AS vieraan_nimi,
        feedback.guest_email AS vieraan_email, feedback.feedback AS palaute,
         feedback.handled AS käsitelty FROM feedback LEFT JOIN system_user ON feedback.from_user = system_user.id`;
    const [rows] = await pool.query(sql1);

    res.render("feedback", { rows: rows });
  } catch (error) {
    console.error(error);
    res.send("Tietokantavirhe");
  }
});
app.get("/success", async (req, res) => {
  res.render("success");
});
app.post("/success", async (req, res) => {
  res.redirect("/");
});
app.get("/support", async (req, res) => {
  try {
    const sql1 = `SELECT support_ticket.id as id , 
    ticket_status.description AS status, support_ticket.arrived AS saapunut,
     support_ticket.description AS kuvaus, support_ticket.handled AS kasitelty,
      customer.name AS asiakas FROM support_ticket LEFT JOIN ticket_status 
      ON support_ticket.status = ticket_status.id LEFT JOIN customer ON 
      support_ticket.customer_id = customer.id`;
    const [rows] = await pool.query(sql1);

    res.render("support", { rows: rows });
  } catch (error) {
    console.error(error);
    res.send("Tietokantavirhe");
  }
});

app.get("/ticket/:id", async (req, res) => {
  const id = req.params.id;
  req.session.user = {
    admin: 1,
  };
  const [messages] = await pool.query(
    "SELECT created_at as aika, ticket_id as ID, body FROM support_message WHERE ticket_id = ?",
    [id],
  );

  const [statuses] = await pool.query("SELECT id, description FROM ticket_status");

  const sqlTicket = `
SELECT 
support_ticket.id AS id,
support_ticket.status AS status_id,
system_user.id AS user_id,
system_user.fullname AS kokonimi,
ticket_status.description AS status,
support_ticket.arrived AS saapunut,
support_ticket.description AS kuvaus,
support_ticket.handled AS kasitelty,
customer.name AS asiakas,
feedback.feedback AS palaute

FROM support_ticket

LEFT JOIN ticket_status 
ON support_ticket.status = ticket_status.id

LEFT JOIN customer 
ON support_ticket.customer_id = customer.id

LEFT JOIN system_user 
ON system_user.customer_id = customer.id
LEFT JOIN feedback
ON feedback.from_user = system_user.id

WHERE support_ticket.id = ?
`;

  const [ticketRows] = await pool.query(sqlTicket, [id]);

  res.render("ticket", {
    ticket: ticketRows[0],
    messages: messages,
    statuses: statuses,
  });
});
app.post("/ticket/:id", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.admin != 1) {
      return res.send("Vain admin voi muuttaa statusta");
    }

    const id = req.params.id;
    const message = req.body.message;
    const status = req.body.status;

    // 🟡 jos status tuli
    if (status) {
      const [closedStatus] = await pool.query("SELECT id FROM ticket_status WHERE description = 'Closed'");
      let sql, params;
      if (status == closedStatus[0]?.id) {
        sql = "UPDATE support_ticket SET status=?, handled=NOW() WHERE id=?";
        params = [status, id];
      } else {
        sql = "UPDATE support_ticket SET status=? WHERE id=?";
        params = [status, id];
      }
      await pool.execute(sql, params);
    }

    // 🟢 jos message tuli
    if (message && message.trim() !== "") {
      await pool.execute(
        "INSERT INTO support_message(body, ticket_id) VALUES (?,?)",
        [message, id],
      );
    }

    res.redirect(`/ticket/${id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
app.listen(port, host, console.log(`${host}:${port} kuuntelee...`));
