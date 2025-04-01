const { createMachine, assign } = require("xstate");

const fetchActor = createMachine(
    {
        id: "FetchActor",
        initial : "IDLE",
        context: {
            request:{},
            isSuccess:true,
            errorMessage:""
        },
        states:{
            IDLE:{
                on:{
                    FETCH:{
                        actions:['recieveEvent'],
                        target:'GETDATA'
                    }
                }
            },
            GETDATA:{
                entry:{
                    invoke:{
                        src:'getData',
                        onDone:{

                        }
                    }
                }
            }   

        }
    },
    {
      actions: {
        recieveEvent : assign(({context, event})=>{
            console.log("recieve event function recieve the body",event);
            return {
                request: event.value
            }
        })
      },
      services:{

      }
    }
)