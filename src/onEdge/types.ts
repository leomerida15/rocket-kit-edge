// deno-lint-ignore-file no-explicit-any
import { TypeOf, ZodObject, ZodType, ZodTypeDef } from "zod";
import { responseFactory } from "./responseFactory";

export interface IZodSchemasValid<
    B extends ZodType<any, ZodTypeDef, any>,
    C extends ZodObject<any>,
    Q extends ZodObject<any>,
> {
    body?: B;
    Info?: C;
    query?: Q;
}

export interface IZodRequestFactoryResp<
    B extends ZodType<any, ZodTypeDef, any>,
    C extends ZodObject<any>,
    Q extends ZodObject<any>,
> extends Request {
    getInfo: () => TypeOf<C>;
    getQuery: (queryArray: string[]) => TypeOf<Q>;
    getBody: () => TypeOf<B>;
}

export type HandlerType<
    B extends ZodType<any, ZodTypeDef, any> = any,
    C extends ZodObject<any> = any,
    Q extends ZodObject<any> = any,
> = (
    req: IZodRequestFactoryResp<B, C, Q>,
    reply: ReturnType<typeof responseFactory>,
    Info: TypeOf<C>,
) => Response | Promise<Response>;

export interface IZodRouteParams<
    B extends ZodType<any, ZodTypeDef, any>,
    C extends ZodObject<any>,
    Q extends ZodObject<any>,
> {
    schemas?: IZodSchemasValid<B, C, Q>;
    Handler: HandlerType<B, C, Q>;
}
