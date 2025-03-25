const session = require("express-session");
const { assign } = require("xstate");
const express = require("express");
const dotenv = require('dotenv');
const cors = require("cors");
const crypto = require("crypto");
const { createActor } = require("xstate");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
dotenv.config();
const jwt = require("jsonwebtoken");
const keys = [];

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
    app.use(express.urlencoded());
    return app;
}


function parseJwt(token) {
    try
    {
        return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    } catch(ex)
    {
        return null;
    }
}

const handler = async (machine, req, res) => {
    let httpReq = req.body;
    var reqData = httpReq.data;

    //Put special id in the jwt to distinguish different fsm
    let key = parseJwt(req.headers.authorization)?.sid;
    if(key && key in keys)
    {
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
        let jwtToken;
        let key;
        try
        {
            // const response = await fetch(`http://localhost:8088/auth/login`, 
            //     {
            //         method: 'POST',
            //         body: JSON.stringify(reqData),
            //         headers: {'Content-Type':'application/json'}
            //     },
            // );
            // const data = await response.json();

            // if(!data.success)
            // {
            //     console.log("Login failed From Quarkus Api")
            //     console.log(ex);
            //     return res.json({ status:"error", data:data.body, message:data.message})
            // }


            // const user = data.data; 
            const user = {
                userName:"Osama",
                branchCode:"1234"
            } 
            const timestamp = Date.now().toString();

            key = crypto
                    .createHash("sha1")
                    .update(user.username + user.branchCode + timestamp)
                    .digest("hex")
                    .substring(0, 8);

            jwtToken = jwt.sign(
                { username: user.userName, branchCode: user.branchCode, sid:key },
                process.env.JWTSECRET,
                { expiresIn: "24h" }
            );

            console.log("Generated JWT:", jwtToken);
        }
        catch(ex)
        {
            console.log("Error occured when logging in")
            console.log(ex);
            return res.json({ status:"error", data:req.body, message:"Error when logging in"})
        }

        keys[key] = {
            actor: null,
            res: res,
            updatedAt:'',
            sendingFunction: (ctx, myKey) => {
                var resp = keys[myKey].res;
                if(!resp.headersSent)
                    resp.json(ctx);
            }
        };

        const newMachine = machine.provide({
            actions: {
                sendPartialCtx: assign({
                    partialCtx: ({context, event}) => {
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


        const subscription = actor.subscribe(
            {
                next: (snapshot) => {
                    console.log(`Current Context: ${snapshot.context}`);
                    console.log(`Current State: ${snapshot.value}`);
                },
                error: (error) => {
                    console.error(`Error occured`,error);
                },
                complete: () => {
                    console.log("------------------!!! Machine Stopped !!!-----------------");
                    subscription.unsubscribe();
                    delete keys[key];
                }
            }
        );

        console.log(`Data from Front-End = ${JSON.stringify(reqData)} `);
        
        actor.send({
            ...reqData,
            jwtToken,
            type: httpReq.transition
        });

        console.log(`Front-End transition = ${httpReq.transition}`);
    }
}


module.exports = { handler, httpServer };
