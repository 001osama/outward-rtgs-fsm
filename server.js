const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require('dotenv');
dotenv.config();

// const PORT = 3000;
const PORT = process.env.PORT;


app.use(express.json());
app.use(cors({
    origin:"http://localhost:5173"
}))


app.post("/start", 
    (req,res) => {
        console.log(req);
        res.json({ status:"success", data:req.body, message:"data is received successfully"})
    }
);


app.listen(PORT, () => {
    console.log(`FSM INSTANCE IS RUNNING ON PORT ${PORT}`);
})

