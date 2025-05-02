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
        options.  method &&
        options.method.toUpperCase() === "GET" &&
        input.params
      ) {
        const queryParams = new URLSearchParams(input.params).toString();
        url += `?${queryParams}`;
        options.body = null;
      } 
      else options.body = input.params ? JSON.stringify(input.params) : null;
      console.log(`------------------------!!!Sending Request in URL!!!---------------------------`);
      console.log(url);
      console.log(`------------------------!!!Sending Request With Body!!!---------------------------`);
      console.log(options.body);
      return await fetch(url, options)
        .then((response) => {
          console.log("Getting response from API. Reponse: ", response);
          
          return response.json();
        })
        .then((resolvedResponse) => {
          if(!resolvedResponse.success)
            return Promise.reject(resolvedResponse);

          return resolvedResponse.data;
        })
        .catch((error) => {
          console.error("Error Occurred while hitting API", error);
          return Promise.reject(error);
        });
    }),
  },
  actions: {
    receiveError: assign({
      partialCtx: ({ context, event }) => {
        console.log("Error Occurred while fetching", event);
        console.log("Current Context is ", context);
        let partialCtxClone = Object.assign({}, context.partialCtx);
        partialCtxClone.message = event.error.message;
        partialCtxClone.success = false;
        return partialCtxClone;
      },
    }),

    // spawnFetchActor: assign({
    //   fetchActorRef: ({ spawn }) => spawn(fetchActor),
    // }),
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
      sBPTranTypeList: [],
      purposeOfPaymentList: [],
      accountList: [],
      accountDetails: {},
      selectedAccountNo: "",
      customerNo: "",
      rtgsForm:{},
      exceptionData:{},
      exceptionList:[], 
      voucherInfo:{},
    },
    states: {
      Idle: {
        on: {
          LOGIN: {
            actions: [
              assign({
                partialCtx: ({ context, event }) => {
                  let partialCtxClone = Object.assign({}, context.partialCtx);
                  partialCtxClone.success = true;
                  partialCtxClone.data = event.jwtToken;
                  return partialCtxClone;
                },
              }), 
              "sendPartialCtx"
            ],
            target: "OutwardRtgs",
          },
        },
      },
      OutwardRtgs: {
        on: {
          FETCHLOV: "FetchBranchList",
          FETCHCUSTACCOUNTS: "FetchCustomerAccounts",
          FETCHACCOUNTDETAILS: "FetchAccountDetails",
          FETCHBENEFBANKLIST: "FetchBeneficiaryBankList",
          FETCHBENEFACCDETAILS: "FetchBeneficiaryAccountDetails",
          RECEIVEOUTWARDRTGS: "ReceiveOutwardRtgs",
          FETCHEXCEPTIONDATA: "FetchExceptionData",
          POSTOUTWARDRTGS: "PostOutwardRtgs",
          FETCHOUTWARDRTGS: "FetchOutwardRtgs",
          RECEIVEOUTWARDRTGSVOUCHERINFO: "ReceiveOutwardRtgsVoucherInfo",
          CANCELOUTWARDRTGS:"CancelOutwardRtgs",
          FETCHUNAUTHOUTWARDRTGSLIST:"FetchUnauthOutwardRtgsList",
          ISVOUCHEREXISTFORCANCELLATION:"IsVoucherExistForCancellation",
          AUTHORIZEUSER: "AuthorizeUser",
          AUTHORIZEOUTWARDRTGS: "AuthorizeOutwardRtgs",
          FETCHEXCELREPORT: "FetchExcelReport",
          FETCHCHEQUESTATUS: "FetchChequeStatus",
          FETCHRTGSPDFREPORT: "FetchRtgsPdfReport",
          SIGNOFF:{
            actions:[
              assign({
                partialCtx: ({ context, event }) => {
                  let partialCtxClone = Object.assign({}, context.partialCtx);
                  partialCtxClone.message = 'Sign out successfully';
                  partialCtxClone.success = true;
                  return partialCtxClone;
                },
              }),
              "sendPartialCtx",
            ],
            target:'Final'
          }
        },
      },
      FetchBranchList: {
        invoke: {
          id: 'fetchBranchList',
          src: 'promiseActor',
          input:({context, event}) => (createRequest(`${process.env.CAPI_URL}/getbranchlist`,'GET',null )),
          onDone: {
            target: 'FetchCurrencyList',
            actions: [
                assign({
                  branchList: ({ context, event }) => {
                    console.log("Setting branchList data in context", event);
                    return event.output;
                  }
                })
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          }
        },
      },
      FetchCurrencyList: {
        invoke: {
          id: 'fetchCurrencyList',
          src: 'promiseActor',
          input:({context, event}) => (createRequest(`${process.env.CAPI_URL}/getcurrencylist`,'GET',null )),
          onDone: {
            target: 'FetchSBPTranTypesList',
            actions: [
                assign({
                  currencyList: ({ context, event }) => {
                    console.log("Setting currencyList data in context", event);
                    return event.output;
                  }
                })
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          }
        },
      },
      FetchSBPTranTypesList: {
        invoke: {
          id: 'fetchSBPTranTypesList',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( `${process.env.CAPI_URL}/getsbptrantypelist`,'GET',null )),
          onDone: {
            target: 'FetchPurposeOfPaymentList',
            actions: [
                assign({
                  sBPTranTypeList: ({ context, event }) => {
                    console.log("Setting SBP TranType List data in context", event);
                    return event.output;
                  }
                })
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          }
        },
      },
      FetchPurposeOfPaymentList: {
        invoke: {
          id: 'fetchPurposeOfPaymentList',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( `${process.env.CAPI_URL}/getpurposeofpaymentlist`,'GET',null )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  purposeOfPaymentList: ({ context, event }) => {
                    console.log("Setting Purpose Of Payment List data in context", event);
                    return event.output;
                  }
                }),
                assign({
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
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        }
      },
      FetchCustomerAccounts: {
        invoke: {
          id: 'fetchCustomerAccounts',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( `${process.env.CAPI_URL}/getcustomeraccountnos`,'GET',{customerNo: event.customerNo} )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  accountList: ({ context, event }) => {
                    console.log("Setting Account list data in context", event);
                    return event.output;
                  },
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event.output);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchAccountDetails: {
        invoke: {
          id: 'FetchAccountDetails',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( `${process.env.CAPI_URL}/getaccountdetails`,'GET',{accountNo: event.accountNo} )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchBeneficiaryBankList: {
        invoke: {
          id: 'FetchBeneficiaryBankList',
          src: 'promiseActor',
          input:() => ( createRequest( `${process.env.CAPI_URL}/getbeneficiarybanklist`,'GET',null )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchBeneficiaryAccountDetails:{
        invoke: {
          id: 'fetchBeneficiaryAccountDetails',
          src: 'promiseActor',
          input:({context, event}) => ( createRequest( `${process.env.CAPI_URL}/getbeneficiaryaccountdetails`,'GET', {accOrIban: event.accOrIban, bankCode: event.bankCode} )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      //make it simpler, the request hitting should be in a separate state left it for later
      ReceiveOutwardRtgs: {
        entry:[
          assign({
            rtgsForm: ({event}) => {
              console.log("Loading rtgs form in partial context", event);
              return event.rtgsForm;
            }
          })
        ],
        invoke: {
          id: 'receiveOutwardRtgs',
          src: 'promiseActor',
          input:({event}) => (createRequest(`${process.env.CAPI_URL}/getexceptionlist`,'GET',{ activityCode: event.rtgsForm.activityCode })),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  exceptionData: ({event}) => {
                    return {
                      exceptionList: event.output,
                      onAcknowledge: 'POSTOUTWARDRTGS',
                    };
                  },
                  partialCtx: ({ context, event }) => {
                    console.log("Loading success response in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    return partialCtxClone;
                  },
                }),
                "sendPartialCtx"
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchUnauthOutwardRtgsList: {
        invoke: {
          id: 'fetchUnauthOutwardRtgsList',
          src: 'promiseActor',
          input:({event}) => (createRequest( `${process.env.CAPI_URL}/getunauthorizedoutwardrtgslist`,'GET',null)),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading success response in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.data = event.output;
                    partialCtxClone.success = true;
                    return partialCtxClone;
                  },
                }),
                "sendPartialCtx"
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchOutwardRtgs:{
        invoke: {
          id: 'fetchOutwardRtgs',
          src: 'promiseActor',
          input:({event}) => (createRequest( `${process.env.CAPI_URL}/getOutwardRTGS`,'GET', {voucherNo: event.voucherNo, voucherYear: event.voucherYear })),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading success response in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.data = event.output;
                    partialCtxClone.success = true;
                    return partialCtxClone;
                  },
                }),
                "sendPartialCtx"
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchExceptionData: {
        invoke: {
          id: 'fetchExceptionData',
          src: 'promiseActor',
          input:({event}) => (createRequest( `${process.env.CAPI_URL}/getexceptionlist`,'GET', { activityCode: event.activityCode })),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading success response in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.data = { exceptionList: event.output };
                    partialCtxClone.success = true;
                    return partialCtxClone;
                  },
                }),
                "sendPartialCtx"
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      PostOutwardRtgs: {
        invoke: {
          id: 'postOutwardRtgs',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( `${process.env.CAPI_URL}/createOutwardRtgs`,'POST', event.rtgsForm)),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      ReceiveOutwardRtgsVoucherInfo: {
        entry: [
          assign({
            voucherInfo: ({event}) => {
              console.log("Loading voucher no in context", event);
              return {voucherNo: event.voucherNo, voucherYear: event.voucherYear};
            }
          })
        ],
        invoke: {
          id: 'receiveOutwardRtgsVoucherInfo',
          src: 'promiseActor',
          input:({event}) => (
            createRequest( 
              `${process.env.CAPI_URL}/getexceptionlist`, 'GET',{ activityCode: event.activityCode }
            )
          ),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  exceptionData: ({event}) => {
                    return {
                      exceptionList: event.output,
                      onAcknowledge:'AUTHORIZEUSER'
                    };
                  },
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      CancelOutwardRtgs : {
        invoke: {
          id: 'cancelOutwardRtgs',
          src: 'promiseActor',
          input:({context, event}) => ( createRequest( `${process.env.CAPI_URL}/cancelOutwardRtgs`,'POST', { voucherNo: event.voucherNo, voucherYear: event.voucherYear } )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = context.voucherInfo;
                    // context.voucherInfo = {};
                    return partialCtxClone;
                  },
                }),
                "sendPartialCtx"
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      AuthorizeUser:{
        invoke: {
          id: 'authorizeUser',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( `${process.env.CAPI_URL}/authorizeUser`,'POST', {
            loginId: event.loginId, 
            password: event.password,
            voucherNo: event.voucherNo,
            voucherYear: event.voucherYear,
          })),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      AuthorizeOutwardRtgs: {
        invoke: {
          id: 'authorizeOutwardRtgs',
          src: 'promiseActor',
          input:({context, event}) => (createRequest( `${process.env.CAPI_URL}/authorizeOutwardRtgs`,'POST', {voucherNo: event.voucherNo, voucherYear: event.voucherYear, loginId: event.loginId})),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchAdviceNos : {
        invoke: {
          id: 'fetchAdviceNos',
          src: 'promiseActor',
          input:({context, event}) => ( createRequest( `${process.env.CAPI_URL}/getbeneficiaryaccountdetails`,'GET', {accOrIban: event.accOrIban, bankCode: event.bankCode} )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      IsVoucherExistForCancellation: {
        invoke: {
          id: 'isVoucherExistForCancellation',
          src: 'promiseActor',
          input:({context, event}) => ( createRequest( `${process.env.CAPI_URL}/iscancelvoucherexist`,'GET', {voucherNo: event.voucherNo, voucherYear: event.voucherYear} )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchExcelReport: {
        invoke: {
          id: 'fetchExcelReport',
          src: 'promiseActor',
          input:({event}) => ( createRequest( `${process.env.CAPI_URL}/downloadExcelReport`,'GET', {voucherNo: event.voucherNo, voucherYear: event.voucherYear} )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchRtgsPdfReport: {
        invoke: {
          id: 'fetchRtgsPdfReport',
          src: 'promiseActor',
          input:({event}) => ( createRequest( `${process.env.CAPI_URL}/downloadBirtReport`,'GET', null )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      FetchChequeStatus: {
        invoke: {
          id: 'FetchChequeStatus',
          src: 'promiseActor',
          input:({event}) => ( createRequest( `${process.env.CAPI_URL}/validatecheque`,'GET', {accountNo: event.accountNo, chequeNo: event.chequeNo} )),
          onDone: {
            target: 'OutwardRtgs',
            actions: [
                assign({
                  partialCtx: ({ context, event }) => {
                    console.log("Loading account no in partial context", event);
                    let partialCtxClone = Object.assign({}, context.partialCtx);
                    partialCtxClone.success = true;
                    partialCtxClone.data = event.output;
                    return partialCtxClone;
                  },
                }),
                'sendPartialCtx'
            ]
          },
          onError: {
            target: 'OutwardRtgs',
            actions: ["receiveError", "sendPartialCtx"]
          },
        },
      },
      Final: {
        type: "final",
      },
    },
  }
);

module.exports = { machine };
