const { createMachine, assign } = require("xstate");

const machine = createMachine(
  {
    id: "userStateMachine", 
    initial: "idle",
    context: {
      partialCtx: {},
      request:{}
    },
    states: {
      idle: {
        on:{
          LOGIN : {
            actions:['receiveData', 'loadPartialCtx','sendPartialCtx'], 
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
        request:({context, event}) => {
          console.log("Setting request data in context", event)
          console.log("Current Context is ", context)
          return event;
        }
      }),
      loadPartialCtx: assign({
        partialCtx: ({context, event}) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.dummyData = "Testing";
          partialCtxClone.token = event.jwtToken;
          return partialCtxClone;
        }
      })
    },
  }
);

module.exports = { machine };
