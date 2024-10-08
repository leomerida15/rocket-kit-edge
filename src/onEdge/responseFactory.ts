import { StatusCodes, getReasonPhrase } from "http-status-codes";

export interface ReplyInit extends Omit<ResponseInit, "status"> {
	status?: StatusCodes;
}

// Configurar los encabezados CORS
const getReplyInit = (init?: ReplyInit) => {
	if (init?.status && !init?.statusText) {
		init.statusText = getReasonPhrase(init.status);
	}

	const headers = new Headers(init?.headers);

	headers.append(
		"Access-Control-Allow-Headers",
		"authorization, x-client-info, apikey, Origin, X-Requested-With, Content-Type, Accept",
	);
	headers.append("Access-Control-Allow-Origin", "*");
	headers.append("Content-Type", "application/json");

	const InitConfig = {
		...init,
		headers,
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
