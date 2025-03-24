const dotenv = require('dotenv');
const { getOrCreateMachine } = require("./machine");
const { httpServer } = require('./handler');
const memoryStore = new session.MemoryStore();
const machine = require("./machine");
dotenv.config();

const app = httpServer(memoryStore);

app.post("/fsm/start", 
    (req, res) => { handler(machine, req, res); }
);

app.listen(PORT, () => {
    console.log(`FSM INSTANCE IS RUNNING ON PORT ${process.env.PORT}`);
})

