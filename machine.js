const { createMachine, assign } = require("xstate");

const machine = createMachine(
  {
    id: "userStateMachine", 
    initial: "idle",
    context: {
      partialCtx: null,
      request:{}
    },
    states: {
      idle: {
        on:{
          INIT : {
            actions:['receiveData','sendPartialCtx'], 
            target:"mainMenu"
          },
        }
      },
      mainMenu: {
        on: {
          TO_RTGS: "rtgs", 
        },
      },
      rtgs: {
        on: {
          TO_MAIN_MENU: "mainMenu", 
        },
      },
    },
  },
  {
    actions: {
      receiveData: assign({
        request:(context, event) => {
          console.log("Setting request data in context", event)
          return event;
        }
      }),
      loadData: assign({
        partialCtx: (context, event) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);

          // partialCtxClone.token = context.megaset681.listOfStatus;
          // partialCtxClone.receiveTranModeList = context.megaset681.receiveTranModeList;
          // partialCtxClone.receiveChannelList = context.megaset681.receiveChannelList;
          // partialCtxClone.header = context.header;
          return partialCtxClone;
        }
      })
    },
  }
);

module.exports = { machine };
