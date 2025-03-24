const { createMachine, assign } = require("xstate");

const machine = createMachine(
  {
    id: "userStateMachine", 
    initial: "mainMenu",
    context: {
      partialCtx: null,
    },
    states: {
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
      sendPartialCtx: assign({
        partialCtx: (context, event) => {
          // This function is used to send context from the current state to a specified handler
          console.log("Sending Context", context);
          return {}; // Returning an empty object for now, but you can modify as needed
        },
      }),
    },
  }
);

module.exports = { machine };
