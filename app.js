import express from "express";
import mysql from "mysql";

const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "Contacts",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("MSQL Connected");
});

app.use(express.json());

function getData(finalResult) {
    return new Promise((resolve, reject) => {
      let sql =
        "SELECT * FROM USERS WHERE linkPrecedence = ? AND (email = ? OR phoneNumber = ?)";
      let primaryEntries = [];
      db.query(sql, ["primary", "dixit@gmail.com", "979798"], (err, result) => {
        if (err) throw err;
        primaryEntries = result;
  
        let secondaryEntries = [];
        db.query(sql, ["secondary", "dixit@gmail.com", "979798"], (err, res) => {
          if (err) throw err;
          secondaryEntries = res;
  
          finalResult = [...finalResult, ...primaryEntries, ...secondaryEntries];
          resolve(finalResult);
        });
      });
    });
  }

app.post("/identify", (req, res) => {
  let finalResult = [];
  getData(finalResult).then((result) => {
    res.json(result);
  });
});

app.listen(3308, () => {
  console.log("app-started");
});
