import mysql from "mysql";
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

  export default db;