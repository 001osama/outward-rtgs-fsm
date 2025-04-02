const { createMachine, assign, sendParent } = require("xstate");

const fetchActor = createMachine(
    {
        id: "FetchActor",
        initial: "Idle",
        context: {
            request:{},
            success:'',
            failure:'',
            isSuccess:true,
            errorMessage:"",                               
            url:"",
        },
        states:{
            Idle:{
                on:{
                    FETCH:{
                        actions:['receiveEvent'],
                        target:'GetData'
                    }
                }
            },
            GetData:{
                invoke:{
                    src:'getData',
                    onDone:{
                        target:'Final',
                        actions: [
                            assign({
                                result: ({context, event}) => {
                                    console.log("Event Received on Done", event);
                                    return event.data.data;
                                }
                            }),
                            sendParent(({context})=>({
                                ...context,
                                type: context.success
                            }))
                        ]
                    },
                    onError:{
                        target:'Final',
                        actions:[
                            assign({
                                result: ({context, event}) => {
                                    console.log("error occurred");
                                    return event.data.data;
                                }
                            }),
                            sendParent(({context})=>({
                                ...context,
                                type: context.success
                            }))
                        ]
                    }
                }
            },
            Final:{
                actions:['testingWorking'],
            }   

        }
    },
    {
      actions: {
        receiveEvent : assign(({context, event, value})=>{
            console.log("recieve event function working, recieved the body",event);
            return {
                request: event.value,
                success: event.value.success,
                failure: event.value.failure,
            }
        }),
        testingWorking: assign(({context, event}) => {
            console.log("Function is working")
        })
      },
      services:{
        getData: async ({context, event}) => {
            console.log("Get Data service is being hit")
            const options = { body: context.params }
            return await fetch(context.url, options)
                .then((response)=>{
                    console.log('Getting response from API. Reponse: ', response);
                    return {data:"dummy data"}
                })
                .catch((error) => {
                    console.error('Error Occurred while hitting API', error);
                    return Promise.reject(error);
                });
        }
      }
    }
)

const trigger = (context, url, requestType, parameters, success, failure)=>{
    console.log(context);
    context.fetchActorRef.send({
        value: {url, requestType, parameters,success,failure},
        type:'FETCH'
    })
}

module.exports = {fetchActor, trigger};