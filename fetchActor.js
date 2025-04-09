const { createMachine, fromPromise,setup, assign, sendParent } = require("xstate");

const fetchActor = setup({
    actors: {
        getData: fromPromise(async ({input}) => {
            console.log("Get Data service is being hit");
            let url = input.url;
            const options = { 
                method: input.requestType || 'GET',
                headers: {'Content-Type':'application/json'},
                body: input.params ? JSON.stringify(input.params) : null,
            }

            if (options.method && options.method.toUpperCase() === 'GET' && input.params)
            {
                const queryParams = new URLSearchParams(input.params).toString();
                url += `?${queryParams}`;
                options.body = null;
            }
            else
                options.body = input.params ? JSON.stringify(input.params) : null;

            return await fetch(url, options)
                .then((response)=>{
                    console.log('Getting response from API. Reponse: ', response);
                    return response.json();
                })
                .catch((error) => {
                    console.error('Error Occurred while hitting API', error);
                    return Promise.reject(error);
                });
        })
    },
    actions: {
        receiveEvent: assign(({ context, event }) => {
            console.log("recieve event function working, recieved the body", event);
            return {
                url: event.value.url,
                params: event.value.parameters,
                requestType: event.value.requestType,
                success: event.value.success,
                failure: event.value.failure,
            }
        })
    }
}).createMachine(
    {
        id: "FetchActor",
        initial: "Idle",
        context: {
            requestType: '',
            success: '',
            failure: '',
            params:{},
            errorMessage: '',
            url: '',
        },
        states: {
            Idle: {
                on: {
                    FETCH: {
                        actions: ['receiveEvent'],
                        target: 'GetData'
                    }
                }
            },
            GetData: {
                invoke: {
                    id: 'getUser',
                    src: 'getData',
                    input: ({context}) => 
                            { 
                                console.log(context);
                                return context;
                            },
                    onDone: {
                        target: 'Final',
                        actions: [
                            assign({
                                result: ({ context, event }) => {
                                    console.log("Event Received on Done", event);
                                    return event.output.data;
                                }
                            }),
                            sendParent(({ context }) => ({
                                result: context.result,
                                type: context.success
                            }))
                        ]
                    },
                    onError: {
                        target: 'Final',
                        actions: [
                            assign({
                                result: ({ context, event }) => {
                                    console.log("error occurred");
                                    return event.output;
                                }
                            }),
                            sendParent(({ context }) => ({
                                ...context,
                                type: context.failure
                            }))
                        ]
                    }
                }
            },
            Final: {
                type: "final",
            }

        }
    }
)

const trigger = (context, url, requestType, parameters, success, failure) => {
    console.log(context);
    context.fetchActorRef.send({
        value: { url, requestType, parameters, success, failure },
        type: 'FETCH'
    })
}

module.exports = { fetchActor, trigger };