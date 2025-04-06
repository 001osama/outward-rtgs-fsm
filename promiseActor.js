import {fromPromise} from 'xstate';

const fetchActorLogic = fromPromise(
    async ({input}) => {
        console.log(`Promise Actor Fetching with input`, input);
        try
        {
            const response = await fetch(input.url, 
                {
                    method: input.method || 'GET',
                    body: input.params ? JSON.stringify(input.params) : undefined,
                    headers: {
                        'Content-Type':'application/json'
                    }
                }
            );


            const data = await response.json();

            return {
                status: 'success',
                data,
            }
        }
        catch(error)
        {
            return {
                status:'failure',
                error: error.message,
            }

        }
    }
)