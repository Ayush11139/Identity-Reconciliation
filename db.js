import mysql from "mysql";
const db = mysql.createConnection({
    host: process.env.DB_HOST,
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

  export default db;