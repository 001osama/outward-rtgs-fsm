const express = require("express");
const app = express();
app.use(express.json());

app.post("/request", (req,res) => {
    res.json({ status:"success", data:"Request processed successfully"})
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`FSM INSTANCE IS RUNNING ON PORT ${PORT}`);
})

