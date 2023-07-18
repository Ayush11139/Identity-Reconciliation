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

async function getData(email, phoneNumber) {
  let finalResult = {};
  let linkedPrimaryIds = [];
  return new Promise((resolve, reject) => {
    let sql = "";
    let queryArray = [];
    if (email && phoneNumber) {
      sql =
        "SELECT * FROM USERS WHERE linkPrecedence = ? AND (email = ? OR phoneNumber = ?) ORDER BY createdAt";
      queryArray = [...queryArray, email, phoneNumber];
    } else if (email) {
      sql = "SELECT * FROM USERS WHERE linkPrecedence = ? AND email = ? ORDER BY createdAt";
      queryArray = [...queryArray, email];
    } else if (phoneNumber) {
      sql = "SELECT * FROM USERS WHERE linkPrecedence = ? AND phoneNumber = ? ORDER BY createdAt";
      queryArray = [...queryArray, phoneNumber];
    }

    let primaryEntries = [];
    db.query(sql, ["primary", ...queryArray], (err, result) => {
      if (err) throw err;
      primaryEntries = result;

      let secondaryEntries = [];
      db.query(sql, ["secondary", ...queryArray], (err, res) => {
        if (err) throw err;
        secondaryEntries = res;
        secondaryEntries.forEach((entry) => {
          if (entry.linkedId) {
            linkedPrimaryIds.push(entry.linkedId);
          }
        });

        let response = {
          primaryEntries: primaryEntries,
          secondaryEntries: secondaryEntries,
        };
        resolve(response);
      });
    });
  }).then((response) => {
    if (linkedPrimaryIds.length === 0) {
      return (finalResult = {
        ...response,
        linkedPrimaryEntries: [],
      });
    }
    return new Promise((resolve, reject) => {
      let linkedPrimaryEntries = [];
      let newSql = `SELECT * FROM USERS WHERE ID IN (${linkedPrimaryIds}) ORDER BY createdAt`;
      db.query(newSql, (err, resp) => {
        if (err) throw err;
        linkedPrimaryEntries = resp;

        finalResult = {
          ...response,
          linkedPrimaryEntries: linkedPrimaryEntries,
        };
        resolve(finalResult);
      });
    });
  });
}

async function queryFromDB (insertSql, queryArray) {
    let result;
    return new Promise((resolve, reject) => {
        db.query(insertSql, queryArray, (err, resp) => {
            if (err) throw err;
            result = resp 
            resolve(result);
          });
    }).then((response) => {
        return response;
    });
}

app.post("/identify", (req, res) => {
  const { email, phoneNumber } = req.body;
  if (!email && !phoneNumber) {
    res.status(404).send("Atleast one of email or phoneNumber is required");
  }
  getData(email, phoneNumber).then(async(result) => {
    const { primaryEntries, secondaryEntries, linkedPrimaryEntries } = result;

    const emailList = [];
    const phoneList = [];
    const secondaryIdList = [];

    if(primaryEntries.length === 0 && linkedPrimaryEntries.length === 0) {
        let insertSql = `INSERT INTO USERS(email,phoneNumber,linkPrecedence) VALUES(?,?,?)`;
        let queryArray = [email, phoneNumber, "primary"];
        const result = await queryFromDB(insertSql, queryArray);
        const response = {
            contact: {
              primaryContactId: result.insertId,
              emails: email ? [email] : [],
              phoneNumbers: phoneNumber ? [phoneNumber] : [],
              secondaryContactIds: []
            },
          };
        res.json(response);
        return;
    }
    else if(primaryEntries.length > 0 && email && phoneNumber) {
        const checkQuery = "SELECT * FROM USERS WHERE phoneNumber = ? AND email = ? ORDER BY createdAt";
        const queryArray = [phoneNumber, email];
        const result = await queryFromDB(checkQuery, queryArray);
        if(result.length === 0) {
            let insertSql = `INSERT INTO USERS(email,phoneNumber,linkPrecedence,linkedId) VALUES(?,?,?,?)`;
            let queryArray = [email, phoneNumber, "secondary", primaryEntries[0].id];
            const InsertResult =  await queryFromDB(insertSql, queryArray);

            let emailList = [];
            if(primaryEntries[0].email) {
                emailList.push(primaryEntries[0].email);
            }
            if (emailList.indexOf(email) == -1) emailList.push(email);

            let phoneList = [];
            if(primaryEntries[0].phoneNumber) {
                phoneList.push(primaryEntries[0].phoneNumber);
            }
            if (phoneList.indexOf(phoneNumber) == -1) phoneList.push(phoneNumber);
            
            const response = {
                contact: {
                  primaryContactId: primaryEntries[0].id,
                  emails: [primaryEntries[0].email, email],
                  phoneNumbers: [primaryEntries[0].phoneNumber, phoneNumber],
                  secondaryContactIds: [InsertResult.insertId]
                },
              };
            res.json(response);
            return;
        }
    }

    primaryEntries.forEach((entry) => {
      if (emailList.indexOf(entry.email) == -1) emailList.push(entry.email);
      if (phoneList.indexOf(entry.phoneNumber) == -1)
        phoneList.push(entry.phoneNumber);
    });
    secondaryEntries.forEach((entry) => {
      if (emailList.indexOf(entry.email) == -1) emailList.push(entry.email);
      if (phoneList.indexOf(entry.phoneNumber) == -1)
        phoneList.push(entry.phoneNumber);
      if (secondaryIdList.indexOf(entry.id) == -1)
        secondaryIdList.push(entry.id);
    });

    linkedPrimaryEntries.forEach((entry) => {
      if (emailList.indexOf(entry.email) == -1) emailList.push(entry.email);
      if (phoneList.indexOf(entry.phoneNumber) == -1)
        phoneList.push(entry.phoneNumber);
      if (secondaryIdList.indexOf(entry.id) == -1)
        secondaryIdList.push(entry.id);
    });

    const response = {
      contact: {
        primaryContactId: primaryEntries[0]?.id || null,
        emails: emailList,
        phoneNumbers: phoneList,
        secondaryContactIds: secondaryIdList,
      },
    };
    console.log(result);
    res.json(response);
  });
});

app.listen(3308, () => {
  console.log("app-started");
});
