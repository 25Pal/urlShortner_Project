const express = require("express");
const mongoose = require("mongoose");
const route = require("./routes/route");
const app = express();

// const port = process.env.PORT;
// app.use(express.json());

mongoose.set("strictQuery", true);

mongoose.connect(
    "mongodb+srv://mohdarshad86:Arshad86@cluster0.r4p7rwf.mongodb.net/group18Database",
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log("BatsyDB is connected");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/", route);

app.listen(3000, () => {
  console.log(`Server is running on port ${3000}`);
});
