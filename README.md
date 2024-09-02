# Quick Start

## Install


``` typescript
import { onEdge, onRouter, onSupabase } from "npm:@rocket-kit/edge";

```


## Example Usage


### Sigle Example

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { onRouter } from "npm:@rocket-kit/edge";
import { Middleware } from './middleware';
import { Controller } from './controller';

const Controller = onEdge({
    Handler(_req, reply) {

        return reply.json({
            message: "Hello from Supabase Edge Functions!",
        });
    },
});

Deno.serve(Controller);
```

### Full Example

#### Middleware


``` typescript
import { onEdge } from "npm:@rocket-kit/edge";

export const Middleware = onEdge({
    Handler(_req, _reply, _info, next) {
        console.log("Middleware")

        return next!();
    })
});

```

#### Controller

``` typescript
import { z } from "npm:zod";
import { onEdge, onSupabase, SupaError, ReasonPhrases, StatusCodes } from "npm:@rocket-kit/edge";

export const Controller = onEdge({
    // zod schemas
    schemas: {
        params: z.object({
            id: z.string().regex(/^[0-9]+$/, {
                message: "The id must be a number",
            }),
        }),
        query: z.object({
            name: z.string().optional(),
        }),
        body: z.object({
            name: z.string().optional(),
        }),
    },
    // logic that is executed with the controller
    async Handler(req, reply) {
        // custom method for getting and validation information
        const params = req.getParams();

        const body = req.getBody();

        const query = req.getQuery(["name"]);

        // method that returns a supabase client in a very simple way
        const supabase = onSupabase({ req });

        const { data, error } = await supabase.from("users").select("*")
          .throwOnError();

        if (error) throw new SupaError(error);

        return reply.json({
          message: "Hello from Supabase Edge Functions!",
          params,
          body,
          query,
          data,
        }, {
            status: StatusCodes.OK,
            statusText: ReasonPhrases.OK,
        });
    },
});

```

#### Router

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { onRouter } from "npm:@rocket-kit/edge";
import { Middleware } from './middleware';
import { Controller } from './controller';

// method for router
const router = onRouter();

router.get("/example/:id", Middleware, Controller);

Deno.serve(router.listen);
```
