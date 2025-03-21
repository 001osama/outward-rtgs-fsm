const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require('dotenv');
const { getOrCreateMachine } = require("./fsm");
dotenv.config();


const handler = (req, res) => {
    const {userId, event} = req.body;

    if(!userId || !event)
        return res.status(400).json({error:"UserId and Event are required."});

    const actor = getOrCreateMachine(userId);
    
    //issue is here
    actor.send(event);
    console.log("reaching handler successfully");
    return res.json({context: actor.getSnapshot().context});
}

// const PORT = 3000;
const PORT = process.env.PORT;


app.use(express.json());
app.use(cors({
    origin:"http://localhost:5173"
}))


app.post("/start", 
    (req, res) => { handler(req, res); }
);


app.listen(PORT, () => {
    console.log(`FSM INSTANCE IS RUNNING ON PORT ${PORT}`);
})

