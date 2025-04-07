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
      branchList:[],
    },
    states: {
      Idle: {
        on:{
          LOGIN: {
            actions:['receiveData', 'loadPartialCtx','sendPartialCtx'], 
            target:"MainMenu"
          },
          FETCHLOV:'FETCH_BRANCH_LIST',
        },
      },
      FETCH_BRANCH_LIST: {
        action:[
          'spawnFetchActor',
          async ({context}) => {
            trigger(
              context, 
              `${process.env.CAPI_URL}/getallbranches`,
              'GET',
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
          'receiveBranchList',
          'sendPartialCtx'
        ]
      },
      FETCH_FAILURE:{
        target:'Final',
        actions:[
          'receiveError',
          'sendPartialCtx'
        ]
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
      receiveError: assign({
        partialCtx: ({context, event}) => {
          console.log("Error Occurred while fetching", event)
          console.log("Current Context is ", context)
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.message = event.message;
          partialCtxClone.success = false;
          return partialCtxClone;
        }
      }),
      receiveBranchList: assign({
        branchList:({context, event}) => {
          console.log("Setting branchList data in context", event)
          console.log("Current Context is ", context)
          return event.result;
        },

        partialCtx: ({context, event}) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.data = event.result;
          return partialCtxClone;
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
