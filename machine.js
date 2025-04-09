const { createMachine,setup, fromPromise, assign } = require("xstate");
const { fetchActor, trigger } = require("./fetchActor");

const createRequest = (url, requestType, params) => { 
  return{ url, requestType, params }
}

const machine = setup({
  actors: {
    promiseActor: fromPromise(async ({ input }) => {
      console.log("Promise actor service is being hit");
      let url = input.url;
      const options = {
        method: input.requestType || "GET",
        headers: { "Content-Type": "application/json" },
        body: input.params ? JSON.stringify(input.params) : null,
      };

      if (
        options.method &&
        options.method.toUpperCase() === "GET" &&
        input.params
      ) {
        const queryParams = new URLSearchParams(input.params).toString();
        url += `?${queryParams}`;
        options.body = null;
      } 
      else options.body = input.params ? JSON.stringify(input.params) : null;

      return await fetch(url, options)
        .then((response) => {
          console.log("Getting response from API. Reponse: ", response);
          return response.json();
        })
        .catch((error) => {
          console.error("Error Occurred while hitting API", error);
          return Promise.reject(error);
        });
    }),
  },
}).createMachine(
  {
    id: "userStateMachine",
    initial: "Idle",
    context: {
      partialCtx: {},
      request: {},
      fetchActorRef: {},
      branchList: [],
      currencyList: [],
      branchList: [],
      sBPTranTypeList: [],
      purposeOfPaymentList: [],
      accountList: [],
      accountDetails: {},
      selectedAccountNo: "",
      customerNo: "",
    },
    states: {
      Idle: {
        on: {
          LOGIN: {
            actions: ["receiveData", "loadPartialCtx", "sendPartialCtx"],
            target: "OutwardRtgs",
          },
        },
      },
      OutwardRtgs: {
        invoke: {
          id: 'getData',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( 'url','GET',null )),
          onDone: {
            target: 'Final',
            actions: [
                assign({
                    result: ({ context, event }) => {
                        console.log("Event Received on Done", event);
                        return event.output.data;
                    }
                })
            ]
          },
          onError: {
            target: 'Final',
            actions: [
                assign({
                    result: ({ context, event }) => {
                        console.log("Event Received on Done", event);
                        return event.output.data;
                    }
                })
            ]
          }
        },
        on: {
          FETCHLOV: "FetchBranchList",
          FETCHCUSTACCOUNTS: "FetchCustomerAccounts",
          FETCHACCOUNTDETAILS: "FetchAccountDetails",
        },
      },
      FetchBranchList: {
        entry: [
          "spawnFetchActor",
          async ({ context }) => {
            trigger(
              context,
              `${process.env.CAPI_URL}/getbranchlist`,
              "GET",
              null,
              "FETCH_SUCCESS",
              "FETCH_FAILURE"
            );
          },
        ],
        on: {
          FETCH_SUCCESS: {
            target: "FetchCurrencyList",
            actions: ["receiveBranchList"],
          },
          FETCH_FAILURE: {
            target: "Final",
            actions: ["receiveError", "sendPartialCtx"],
          },
        },
      },
      FetchCurrencyList: {
        entry: [
          "spawnFetchActor",
          async ({ context }) => {
            trigger(
              context,
              `${process.env.CAPI_URL}/getcurrencylist`,
              "GET",
              null,
              "FETCH_SUCCESS",
              "FETCH_FAILURE"
            );
          },
        ],
        on: {
          FETCH_SUCCESS: {
            target: "FetchSBPTranTypesList",
            actions: ["receiveCurrencyList"],
          },
          FETCH_FAILURE: {
            target: "Final",
            actions: ["receiveError", "sendPartialCtx"],
          },
        },
      },
      FetchSBPTranTypesList: {
        entry: [
          "spawnFetchActor",
          async ({ context }) => {
            trigger(
              context,
              `${process.env.CAPI_URL}/getsbptrantypelist`,
              "GET",
              null,
              "FETCH_SUCCESS",
              "FETCH_FAILURE"
            );
          },
        ],
        on: {
          FETCH_SUCCESS: {
            target: "FetchPurposeOfPaymentList",
            actions: ["receiveSBPTranTypeList"],
          },
          FETCH_FAILURE: {
            target: "Final",
            actions: ["receiveError", "sendPartialCtx"],
          },
        },
      },
      FetchPurposeOfPaymentList: {
        entry: [
          "spawnFetchActor",
          async ({ context }) => {
            trigger(
              context,
              `${process.env.CAPI_URL}/getpurposeofpaymentlist`,
              "GET",
              null,
              "FETCH_SUCCESS",
              "FETCH_FAILURE"
            );
          },
        ],
        on: {
          FETCH_SUCCESS: {
            target: "OutwardRtgs",
            actions: [
              "receivePurposeOfPaymentList",
              "loadLOVs",
              "sendPartialCtx",
            ],
          },
          FETCH_FAILURE: {
            target: "Final",
            actions: ["receiveError", "sendPartialCtx"],
          },
        },
      },
      FetchCustomerAccounts: {
        entry: [
          "receiveCustomerNo",
          "spawnFetchActor",
          async ({ context }) => {
            trigger(
              context,
              `${process.env.CAPI_URL}/getcustomeraccountnos`,
              "GET",
              { customerNo: context.customerNo },
              "FETCH_SUCCESS",
              "FETCH_FAILURE"
            );
          },
        ],
        on: {
          FETCH_SUCCESS: {
            target: "OutwardRtgs",
            actions: ["receiveAccountList", "sendPartialCtx"],
          },
          FETCH_FAILURE: {
            target: "Final",
            actions: ["receiveError", "sendPartialCtx"],
          },
        },
      },
      FetchAccountDetails: {
        entry: [
          "receiveAccountNo",
          "spawnFetchActor",
          async ({ context }) => {
            trigger(
              context,
              `${process.env.CAPI_URL}/getaccountdetails`,
              "GET",
              { accountNo: context.selectedAccountNo },
              "FETCH_SUCCESS",
              "FETCH_FAILURE"
            );
          },
        ],
        on: {
          FETCH_SUCCESS: {
            target: "OutwardRtgs",
            actions: ["receiveAccountList", "sendPartialCtx"],
          },
          FETCH_FAILURE: {
            target: "Final",
            actions: ["receiveError", "sendPartialCtx"],
          },
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
        request: ({ context, event }) => {
          console.log("Setting request data in context", event);
          console.log("Current Context is ", context);
          return event;
        },
      }),

      receiveError: assign({
        partialCtx: ({ context, event }) => {
          console.log("Error Occurred while fetching", event);
          console.log("Current Context is ", context);
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.message = event.message;
          partialCtxClone.success = false;
          return partialCtxClone;
        },
      }),

      receiveBranchList: assign({
        branchList: ({ context, event }) => {
          console.log("Setting branchList data in context", event);
          console.log("Current Context is ", context);
          return event.result;
        },
      }),

      receiveCurrencyList: assign({
        currencyList: ({ context, event }) => {
          console.log("Setting currencyList data in context", event);
          console.log("Current Context is ", context);
          return event.result;
        },
      }),

      receiveSBPTranTypeList: assign({
        sBPTranTypeList: ({ context, event }) => {
          console.log("Setting SBPTranTypeList data in context", event);
          console.log("Current Context is ", context);
          return event.result;
        },
      }),

      receivePurposeOfPaymentList: assign({
        purposeOfPaymentList: ({ context, event }) => {
          console.log("Setting Purpose of Payment list data in context", event);
          return event.result;
        },
      }),

      receiveAccountNo: assign({
        selectedAccountNo: ({ context, event }) => {
          console.log("Setting Selected Account No data in context", event);
          return event.accountNo;
        },
      }),

      receiveAccountDetails: assign({
        accountDetails: ({ context, event }) => {
          console.log("Setting Account Details data in context", event);
          return event.result;
        },

        partialCtx: ({ context, event }) => {
          console.log("Loading Account Details in partial context", event);
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.success = true;
          partialCtxClone.data = event.result;
          return partialCtxClone;
        },
      }),

      receiveAccountList: assign({
        accountList: ({ context, event }) => {
          console.log("Setting Account list data in context", event);
          return event.result;
        },

        partialCtx: ({ context, event }) => {
          console.log("Loading account no in partial context", event);
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.success = true;
          partialCtxClone.data = event.result;
          return partialCtxClone;
        },
      }),

      receiveCustomerNo: assign({
        customerNo: ({ context, event }) => {
          console.log("Setting Customer No data in context", event);
          return event.customerNo;
        },
      }),

      loadPartialCtx: assign({
        partialCtx: ({ context, event }) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.success = true;
          partialCtxClone.data = event.jwtToken;
          return partialCtxClone;
        },
      }),

      loadLOVs: assign({
        partialCtx: ({ context, event }) => {
          let partialCtxClone = Object.assign({}, context.partialCtx);
          partialCtxClone.data = {
            branchList: context.branchList,
            currencyList: context.currencyList,
            sBPTranTypeList: context.sBPTranTypeList,
            purposeOfPaymentList: context.purposeOfPaymentList,
          };
          partialCtxClone.success = true;
          return partialCtxClone;
        },
      }),

      spawnFetchActor: assign({
        fetchActorRef: ({ spawn }) => spawn(fetchActor),
      }),
    },
  }
);

module.exports = { machine };
