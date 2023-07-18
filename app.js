import express from "express";
import db from './db.js';
import router from './router.js';

const app = express();

app.use(express.json());

app.use("/", router);

app.listen(3308, () => {
  console.log("app-started");
});
