// deno-lint-ignore-file no-explicit-any
import { ZodError, ZodObject, ZodType, ZodTypeDef } from "zod";
import { responseFactory } from "./responseFactory";
import { IZodRequestFactoryResp, IZodRouteParams } from "./types";
import { requestFactory } from "./requestFactory";
 import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Deno } from "@deno/types";
import { EdgeError } from "./EdgeError";

export const onEdge = <
    B extends ZodType<any, ZodTypeDef, any>,
    C extends ZodObject<any>,
    Q extends ZodObject<any>,
>(
    P:
        | IZodRouteParams<B, C, Q>
        | IZodRouteParams<B, C, Q>["Handler"],
) => {
    const reply = responseFactory();

    const controllerFactory = (
        request: Request,
        Info: Deno.ServeHandlerInfo,
    ) => {
        try {
            const isOptions = request.method === "OPTIONS";
            if (isOptions) return reply.factory(ReasonPhrases.OK);

            const { schemas, Handler } = ((): {
                schemas?: IZodRouteParams<B, C, Q>["schemas"];
                Handler: IZodRouteParams<B, C, Q>["Handler"];
            } => {
                if (typeof P === "object") {
                    return {
                        schemas: P.schemas,
                        Handler: P.Handler,
                    };
                }

                return {
                    Handler: P,
                };
            })();

            return requestFactory<B, C, Q>(request, Info, schemas)
                .then((req: IZodRequestFactoryResp<B, C, Q>) =>
                    Handler(req, reply, Info)
                )
                .finally();
        } catch (error) {
            if (error instanceof EdgeError) {
                return reply.json(...error.resp);
            }

            if (error instanceof ZodError) {
                console.log("error", error);
                return reply.json((error as any).errors, {
                    status: StatusCodes.BAD_REQUEST,
                });
            }

            return reply.json(error as Error, {
                status: 500,
            });
        }
    };

    return controllerFactory;
};
