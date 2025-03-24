const dotenv = require('dotenv');
const { httpServer, handler } = require('./handler');

const PORT = process.env.PORT;
const { machine } = require("./machine");
dotenv.config();

const app = httpServer();

app.post("/start", 
    (req, res) => { handler(machine, req, res); }
);

app.listen(PORT, () => {
    console.log(`FSM INSTANCE IS RUNNING ON PORT ${PORT}`);
});

