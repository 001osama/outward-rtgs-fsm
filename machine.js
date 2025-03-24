const { assign, createMachine, createActor } = require('xstate');


const machine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgKwBdcA3MAYgBUB5AcRYBkBRAbQAYBdRKAAOAe1i4qo-EJAAPRAEYAbAE4ANCACeSgOy6SAFgCsAZkUAmYwF9rmtFjyFSlGvWZsufQUhBiJUjK+CggqGtqIAByKJDa2mviiEHCyDjgExLL+krjSsiEAtMqaOghF8SBpTsRk+K60WeI5ecGIhhYlSoq8JKa8qpGqxpGmo2OGFVUZLphUDb7ZgfmIFqqmvZbGnaGWJJH9g8Nj47a2QA */
        context: {
            user: '',
            noOfRequest:'',
            data:'',
        },
        initial: 'inactive',
        states: {
            inactive: { 
                on: { 
                    TOGGLE: {
                        actions: assign({
                            data: ({event}) => event.value,
                        }),
                        target: 'active',
                    }
                },
            },
            active: { 
                on: { 
                    TOGGLE: {
                        actions: assign({
                            data: ({event}) => event.value,
                        }),
                        target: 'inactive',
                    }
                }
            },
        }
    }
);


module.exports =  machine;
