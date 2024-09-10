import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { Cors } from "../cors";

export interface ReplyInit extends Omit<ResponseInit, "status"> {
	status?: StatusCodes;
}

const getReplyInit = (init?: ReplyInit) => {
	if (init?.status && !init?.statusText) {
		init.statusText = getReasonPhrase(init.status);
	}

	const cors = new Cors();

	cors.set("Content-Type", "application/json");
	cors.set("Access-Control-Allow-Origin", "*");
	cors.set(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE, OPTIONS",
	);
	cors.set(
		"Access-Control-Allow-Headers",
		"authorization, x-client-info, apikey, content-type",
	);

	const headers = cors.getHeaders();

	const InitConfig = {
		headers: { ...headers, ...init?.headers },
		...init,
	};

	return InitConfig;
};

/**
 * Create a new response factory with the following methods:
 * - `rewrite`: Creates a new response with the given body, status code and headers.
 * - `redirect`: Creates a new response with the given URL and status code.
 * - `json`: Creates a new JSON response with the given body and headers.
 * - `factory`: Creates a new response with the given body and headers.
 *
 * @returns An object with the above methods.
 */
export const responseFactory = () => {
	return {
		rewrite: Response.redirect,

		redirect: Response.redirect,

		/**
		 * Creates a new JSON response with the given body and headers.
		 *
		 * @param body - The body of the response.
		 * @param init - The headers of the response.
		 * @returns A new response.
		 */
		json<B extends object | string | number>(body: B, init?: ReplyInit) {
			const replyInit = getReplyInit(init);

			return Response.json(body, replyInit);
		},

		/**
		 * Creates a new response with the given body and headers.
		 *
		 * @param body - The body of the response.
		 * @param init - The headers of the response.
		 * @returns A new response.
		 */
		factory(body?: BodyInit | null, init?: ResponseInit) {
			const replyInit = getReplyInit(init);

			return new Response(body, replyInit);
		},
	};
};
