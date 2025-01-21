# Quick Start

## Install

> **Note:**: We recommend using a deno.json file to manage your dependencies

``` bash
deno add npm:@rocket-kit/edge npm:zod jsr:@supabase/functions-js/edge-runtime.d.ts
```

### Recommended Architecture
``` text
.
└──supabase
    ├── common ('methods that share multiple functions')
    └── functions ('functions')
        └── <function-name>
            ├── index.ts ('router')
            ├── utils ('methods that share multiple modules')
            └── modules ('modules')
                └── module ('exemple for POST method use name "createProduct" or GET "getProductById"')
                    ├──  controller.ts
                    └── service.ts

```

## Example Usage


### Sigle Example




```typescript
// path: ./index.ts

import "@supabase/functions-js/edge-runtime.d.ts";

import { onEdge } from "@rocket-kit/edge";
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
<!--
#### Middleware


``` typescript
// path: ./example.middleware.ts

import { onEdge } from "@rocket-kit/edge";

export const Middleware = onEdge({
    Handler(_req, _reply, next) {
        console.log("Middleware")

        return next!();
    })
});

```
 -->

#### Schemas


``` typescript
// path: ./modules/example/schemas.ts
import { z } from "zod";

export const exampleBodySchemas = z.object({
    name: z.string().optional(),
});

export type exampleBodyType = Zod.infer<typeof exampleBodySchemas>

export const exampleSchemas = {
    params: z.object({
        id: z.string().regex(/^[0-9]+$/, {
            message: "The id must be a number",
        }),
    }),
    query: z.object({
        name: z.string().optional(),
    }),
    body: exampleBodySchemas,
}

```

#### service

``` typescript
// path: ./modules/example/service.ts

import { exampleBodyType } from "./schemas";
import { onSupabase, SupaError } from "@rocket-kit/edge";

interface exampleServiceParamsType {
    id: string;
    name: string;
    body: exampleBodyType;
}

type ExampleServiceFn = (p: exampleServiceParamsType) => string;

export const exampleService = async ({ id, name, body }) => {
    // method that returns a supabase client in a very simple way
    const supabase = onSupabase();

    const { data, error } = await supabase
        .from("users")
        .update(body)
        .eq("id", id)
        .eq("name", name)
        .throwOnError();

    // SupaError es para la validación de errores de la consulta.
    if (error) throw new SupaError(error);

    return "Hello from Supabase Edge Functions!";
}
```

#### Controller

``` typescript
// path: ./modules/example/controller.ts

import { exampleSchemas } from "./schemas";
import { exampleService } from "./service";
import { onEdge, ReasonPhrases, StatusCodes } from "@rocket-kit/edge";

export const exampleController = onEdge({
    // zod schemas
    schemas: exampleSchema,
    // logic that is executed with the controller
    async Handler(req, reply) {
        // custom method for getting and validation information
        const params = req.getParams();

        const body = req.getBody();

        const query = req.getQuery(["name"]);

        const message = exampleService({
            id: params.id,
            name: query.name,
            body
        });

        return reply.json({
          message,
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
// path: ./index.ts

import "@supabase/functions-js/edge-runtime.d.ts";

import { onRouter } from "@rocket-kit/edge";
import { Controller } from './modules/example/controller.ts';

// method for router
const router = onRouter();

router.get("/example/:id", exampleController);

Deno.serve(router.listen);
```

#### Middleware

``` typescript
// path: ./utils/middleware.ts or ./modules/example//middleware.ts

import { exampleSchemas } from "./schemas";
import { exampleService } from "./service";
import { onEdge, ReasonPhrases, StatusCodes } from "@rocket-kit/edge";

export const exampleMiddleware = onEdge({
    // zod schemas
    schemas: exampleSchema,
    // logic that is executed with the controller
    async Handler(_req, _reply, next) {

        // Logic

        return next!();
    },
});

```


You can use any number of middleware, before or after the routes,
remembering that all pre must return next to move on to the next step
in the life cycle or reply to respond to the client and stop the cycle.

#### Use global middlewae in a routes
```typescript
// path: ./index.ts

import "@supabase/functions-js/edge-runtime.d.ts";

import { onRouter } from "@rocket-kit/edge";
import { exampleMiddleware } from './urils/middleware';
import { Controller } from './modules/example/controller.ts';

// method for router
const router = onRouter();


router.get("/example/pre/:id", exampleMiddleware, exampleController /* ...edge cotrollers */);

router.get("/example/pos/:id", exampleController,  exampleMiddleware /* ...edge cotrollers */);

Deno.serve(router.listen);
```

#### Use global middlewae in all routes
```typescript
// path: ./index.ts

import "@supabase/functions-js/edge-runtime.d.ts";

import { onRouter } from "@rocket-kit/edge";
import { exampleMiddleware } from './urils/middleware';
import { Controller } from './modules/example/controller.ts';

// method for router
const router = onRouter();

router.preMiddy(exampleMiddleware, /* ...edge cotrollers */);

router.get("/example/:id", exampleController);

router.posMiddy(exampleMiddleware, /* ...edge cotrollers */);


Deno.serve(router.listen);
```