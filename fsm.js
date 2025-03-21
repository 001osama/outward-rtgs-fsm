const { assign, createMachine, createActor } = require('xstate');


const machine = createMachine(
    {
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

const machineStore = new Map();

function getOrCreateMachine(userId)
{
    if(!machineStore.has(userId))
    {
        const actor = createActor(machine).start();
        
        actor.subscribe((snapshot) => {
            console.log('Value:', snapshot.value);
        });    
        
        machineStore.set(userId, actor);
    }


    return machineStore.get(userId);
}


module.exports = { getOrCreateMachine };
