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
      currencyList:[],
      branchList:[],
      sBPTranTypeList:[],
    },
    states: {
      Idle: {
        on:{
          LOGIN: {
            actions:['receiveData', 'loadPartialCtx','sendPartialCtx'], 
            target:"MainMenu"
          },
          FETCHLOV:'FetchBranchList',
        },
      },
      MainMenu:{
        on:{
          OUTWARDRTGS:'OutwardRtgs'
        }
      },
      OutwardRtgs: {
        on:{
          FETCHLOV:'FetchBranchList',
        }
      },
      FetchBranchList: {
        entry:[
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
        ],
        on: {
          FETCH_SUCCESS:{
            target:'FetchCurrencyList',
            actions:[
              'receiveBranchList',
            ]
          },
          FETCH_FAILURE:{
            target:'Final',
            actions:[
              'receiveError',
              'sendPartialCtx'
            ]
          },
        }
      },
      FetchCurrencyList: {
        entry:[
          'spawnFetchActor',
          async ({context}) => {
            trigger(
              context, 
              `${process.env.CAPI_URL}/getallcurrencies`,
              'GET',
              null,
              'FETCH_SUCCESS',
              'FETCH_FAILURE',
            )
          }
        ],
        on: {
          FETCH_SUCCESS:{
            target:'FetchSBPTranTypesList',
            actions:[
              'receiveCurrencyList',
            ]
          },
          FETCH_FAILURE:{
            target:'Final',
            actions:[
              'receiveError',
              'sendPartialCtx'
            ]
          },
        }
      },
      FetchSBPTranTypesList: {
        entry:[
          'spawnFetchActor',
          async ({context}) => {
            trigger(
              context, 
              `${process.env.CAPI_URL}/getallsbptrantypes`,
              'GET',
              null,
              'FETCH_SUCCESS',
              'FETCH_FAILURE',
            )
          }
        ],
        on: {
          FETCH_SUCCESS:{
            target:'OutwardRtgs',
            actions:[
              'receiveSBPTranTypeList',
              'loadLOVs',
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
        }
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
      }),

      receiveCurrencyList: assign({
        currencyList:({context, event}) => {
          console.log("Setting currencyList data in context", event)
          console.log("Current Context is ", context)
          return event.result;
        },
      }),

      receiveSBPTranTypeList: assign({
        SBPTranTypeList:({context, event}) => {
          console.log("Setting SBPTranTypeList data in context", event)
          console.log("Current Context is ", context)
          return event.result;
        },
      }),

      loadPartialCtx: assign({
        partialCtx: ({context, event}) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.message = "Authentication is Successful";
          partialCtxClone.token = event.jwtToken;
          return partialCtxClone;
        }
      }),
      loadLOVs: assign({
        partialCtx: ({context, event}) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.data = {
            branchList: context.branchList,
            currencyList: context.currencyList,
            sBPTranTypeList: context.sBPTranTypeList
          };
          partialCtxClone.success = true;
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
