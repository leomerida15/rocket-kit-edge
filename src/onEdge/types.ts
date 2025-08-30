// deno-lint-ignore-file no-explicit-any
import { z, ZodObject, ZodType } from "zod";
import { responseFactory } from "./responseFactory";

export interface IZodSchemasValid<
	B extends ZodType<any, any, any>,
	C extends ZodObject<any>,
	Q extends ZodObject<any>,
	P extends ZodObject<any>,
> {
	body?: B;
	Info?: C;
	query?: Q;
	params?: P;
}

export interface IZodRequestFactoryResp<
	B extends ZodType<any, any, any>,
	C extends ZodObject<any>,
	Q extends ZodObject<any>,
	P extends ZodObject<any>,
> extends Request {
	getInfo: () => z.infer<C>;
	getQuery: (queryArray: string[]) => Partial<z.infer<Q>>;
	getBody: () => z.infer<B>;
	getParams: () => z.infer<P>;
}

export type HandlerType<
	B extends ZodType<any, ZodType, any> = any,
	C extends ZodObject<any> = any,
	Q extends ZodObject<any> = any,
	P extends ZodObject<any> = any,
> = (
	req: IZodRequestFactoryResp<B, C, Q, P>,
	reply: ReturnType<typeof responseFactory>,
	next?: () => Response,
) => Response | Promise<Response>;

export interface IZodRouteParams<
	B extends ZodType<any, any, any>,
	C extends ZodObject<any>,
	Q extends ZodObject<any>,
	P extends ZodObject<any>,
> {
	schemas?: IZodSchemasValid<B, C, Q, P>;
	Handler: HandlerType<B, C, Q, P>;
}
