import { Deno as DenoTypes } from "@deno/types";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { ZodError, ZodObject, ZodType, ZodTypeDef } from "zod";
import { RocketEnvs } from "../global.env";
import { EdgeError } from "./EdgeError";
import { requestFactory } from "./requestFactory";
import { responseFactory } from "./responseFactory";
import { IZodRouteParams } from "./types";

const jwt = process.env.SUPABASE_JWT;

export const onEdge = <
	B extends ZodType<any, ZodTypeDef, any>,
	C extends ZodObject<any>,
	Q extends ZodObject<any>,
	P extends ZodObject<any>,
>(
	P: IZodRouteParams<B, C, Q, P> | IZodRouteParams<B, C, Q, P>["Handler"],
) => {
	const reply = responseFactory();

	const controllerFactory = async (
		request: Request,
		Info: DenoTypes.ServeHandlerInfo,
		next?: () => Response,
	) => {
		try {
			const isOptions = request.method === "OPTIONS";
			if (isOptions) return reply.factory(ReasonPhrases.OK);

			const { schemas, Handler } = ((): {
				schemas?: IZodRouteParams<B, C, Q, P>["schemas"];
				Handler: IZodRouteParams<B, C, Q, P>["Handler"];
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

			const req = await requestFactory<B, C, Q, P>(request, Info, schemas);

			const auth = req.headers.get("Authorization");

			if (!jwt && auth) RocketEnvs.set("SUPABASE_JWT", auth);

			return Handler(req, reply, next);
		} catch (error) {
			if (error instanceof EdgeError) {
				return reply.json(...error.resp);
			}

			if (error instanceof ZodError) {
				return reply.json(error.issues, {
					status: StatusCodes.BAD_REQUEST,
				});
			}

			if (error instanceof ReferenceError || error instanceof Error)
				return reply.json(
					{
						...error,
						message: error.message,
					},
					{ status: StatusCodes.BAD_REQUEST },
				);

			return reply.json(error as string | object | number, {
				status: StatusCodes.BAD_REQUEST,
			});
		}
	};

	return controllerFactory;
};
