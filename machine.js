const { createMachine, assign } = require("xstate");
const { fetchActor, trigger } = require("./fetchActor");

const machine = createMachine(
  {
    id: "userStateMachine", 
    initial: "Idle",
    context: {
      partialCtx: {},
      request:{},
      fetchActorRef:{},
    },
    states: {
      Idle: {
        on:{
          LOGIN : {
            actions:['receiveData', 'loadPartialCtx','sendPartialCtx'], 
            target:"MainMenu"
          },
          GETDATA: {
            actions:[
              'spawnFetchActor',
              async ({context}) => {
                trigger(
                  context, 
                  'http://localhost:8088/data-access/getuserinfo',
                  'POST',
                  null,
                  'FETCH_SUCCESS',
                  'FETCH_FAILURE',
                )
              }
            ]
          },
          FETCH_SUCCESS:{
            target:'Final',
            actions:[
              'receiveData',
              'sendPartialCtx'
            ]
          },
          FETCH_FAILURE:{
            target:'Final',
            actions:[
              'receiveData',
              'sendPartialCtx'
            ]
          }
        }
      },
      MainMenu: {
        on: {
          TO_RTGS: "Rtgs",
          SIGNOFF: {
            actions:['sendPartialCtx'],
            target:['Final']
          }
        },
      },
      Rtgs: {
        on: {
          TO_MAIN_MENU: "MainMenu",
        },
      },
      Final: {
        type: "final",
        entry: ["sendPartialCtx"],
      },
    },
  },
  {
    actions: {
      receiveData: assign({
        request:({context, event}) => {
          console.log("Setting request data in context", event)
          console.log("Current Context is ", context)
          return event;
        }
      }),
      loadPartialCtx: assign({
        partialCtx: ({context, event}) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.message = "Authentication is Successful";
          partialCtxClone.token = event.jwtToken;
          return partialCtxClone;
        }
      }),
      spawnFetchActor: assign({
        fetchActorRef: ({spawn}) => spawn(fetchActor)
      })
    },
  }
);

module.exports = { machine };
