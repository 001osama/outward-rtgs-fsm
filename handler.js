const session = require("express-session");
const express = require("express");
const dotenv = require('dotenv');
const cors = require("cors");
const { interpret, createActor } = require("xstate");
dotenv.config();

const PORT = process.env.PORT;

const getSession = (memoryStore, secret) => {
    if(!secret) secret = "new secret";
    return session({
		secret: secret,
		resave: false,
		saveUninitialized: true,
		store: memoryStore,
	})
}

const httpServer = () => {
    const app = express();
    const memoryStore = new session.MemoryStore();
    app.use(getSession(memoryStore))
    app.use(cors());
    app.use(express.json());
    return app;
}


function parseJwt(token) {
	return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
}

const handler = (machine, req, res) => {
    let httpReq = req.body;
    //Put special id in the jwt to distinguish different fsm
    let key = parseJwt(req.headers.authorization).sid;
    if(key)
    {
        var reqData = httpReq.data;
        if(key in keys) {
            keys[key].res = res;
            var actor = keys[key].actor;
            console.log(`Data from Front-End = ${JSON.stringify(reqData)}`);
            console.log(`Front-End transition = ${httpReq.transition}`);
            actor.send(
                {
                    ...reqData, 
                    type: httpReq.transition,
                }
            )
        }
        else
        {
            keys[key] = {
                actor: null,
                res: res,
                updatedAt:'',
                sendingFunction: (ctx, myKey) => {
                    var resp = keys[myKey].res;
                    if(resp.headersSent)
                        resp.json(ctx);
                }
            };

            const newMachine = machine.withConfig({
                actions: {
                    sendPartialCtx: assign({
                        partialCtx: (context, event) => {
                            keys[key].sendingFunction(context.partialCtx, key);
                            keys[key].updatedAt = Date.now();
                            return {};
                        },
                    })
                }
            });

            var actor = createActor(newMachine);
            actor.start();
            keys[key].actor = actor;

            actor.subscribe((snapshot) => {
                console.log(snapshot.context);
            })

            console.log(`Data from Front-End = ${JSON.stringify(reqData)} `);

            actor.send({
                ...jsonObj,
                type: httpReq.transition
            });

            actor.onStop(()=> {
                console.log("------------------!!! Machine Stopped !!!-----------------");
                delete keys[key];
            })

            console.log(`Front-End transition = ${httpReq.transition}`);
        }
    }
    else
    {
        console.log("Request Token key is missing!");
        return res.json("Request Token key is missing!");
    }

}


module.exports = { handler, httpServer };
