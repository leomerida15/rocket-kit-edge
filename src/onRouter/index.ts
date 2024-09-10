import { Deno } from "@deno/types";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { RocketEnvs } from "../global.env";

type httpMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

interface Info extends Deno.ServeHandlerInfo {
	store: Map<string, any>;
}

type controller = (
	request: Request,
	info: Deno.ServeHandlerInfo,
	next: () => Response,
) => Response | Promise<Response> | void | Promise<void>;

export const onRouter = () => {
	const preMiddy = new Set<controller>([]);
	const posMiddy = new Set<controller>([]);

	const httpMethodsMap = new Map<httpMethods, Map<string, controller[]>>([
		["GET", new Map<string, controller[]>()],
		["POST", new Map<string, controller[]>()],
		["PUT", new Map<string, controller[]>()],
		["DELETE", new Map<string, controller[]>()],
		["PATCH", new Map<string, controller[]>()],
	]);

	const store = new Map<string, any>();

	const notfound = () => {
		const statusText = getReasonPhrase(StatusCodes.NOT_FOUND);

		const headers = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers":
				"authorization, x-client-info, apikey, content-type",
			"Content-Type": "application/json",
		};

		return new Response(statusText, {
			status: StatusCodes.NOT_FOUND,
			headers,
			statusText,
		});
	};

	const EventLoop = async (
		controllers: controller[],
		params: Parameters<Deno.ServeHandler>,
	) => {
		const EventsList = [controllers];

		if (preMiddy.size) EventsList.unshift(Array.from(preMiddy));

		if (posMiddy.size) EventsList.push(Array.from(posMiddy));

		const Events = EventsList.flat();

		for (const Event of Events) {
			try {
				const onAwaited = (params: Parameters<Deno.ServeHandler>) =>
					new Promise<Response | undefined>((resolver, reject) => {
						const next = (() => {
							reject(undefined);
						}) as unknown as () => Response;

						return resolver(Event(...params, next) as Response | undefined);
					});

				const response = await onAwaited(params);

				if (!response) throw response;

				return response;
			} catch {
				continue;
			}
		}
	};

	const matchRoute = (pathname: string, routes: string[]) => {
		for (const path of routes) {
			const paramNames: string[] = [];
			// Convertimos el path con parámetros a una expresión regular
			const regexPath = path.replace(/\/:(\w+)/g, (_, paramName) => {
				paramNames.push(paramName);
				return "/([^/]+)";
			});

			// Creamos la expresión regular con el comienzo (^) y fin ($) del string
			const regex = new RegExp(`^${regexPath}$`);

			// Intentamos hacer match entre el pathname y la regex
			const match = pathname.match(regex);
			if (match) {
				// Extraemos los valores de los parámetros
				const params = paramNames.reduce<Record<string, string>>(
					(acc, paramName, i) => {
						acc[paramName] = match[i + 1];
						return acc;
					},
					{},
				);

				return { path, params };
			}
		}

		return undefined;
	};

	const options = () => {
		const statusText = getReasonPhrase(StatusCodes.OK);

		const headers = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers":
				"authorization, x-client-info, apikey, content-type",
			"Content-Type": "application/json",
			"Access-Control-Max-Age": "43200",
			"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		};

		return new Response(statusText, {
			status: StatusCodes.OK,
			headers,
			statusText,
		});
	};

	return {
		get(path: string, ...controllers: controller[]) {
			const httpMethods = httpMethodsMap.get("GET")!;
			httpMethods.set(path, controllers);
		},

		post(path: string, ...controllers: controller[]) {
			const httpMethods = httpMethodsMap.get("POST")!;
			httpMethods.set(path, controllers);
		},

		put(path: string, ...controllers: controller[]) {
			const httpMethods = httpMethodsMap.get("PUT")!;
			httpMethods.set(path, controllers);
		},

		delete(path: string, ...controllers: controller[]) {
			const httpMethods = httpMethodsMap.get("DELETE")!;
			httpMethods.set(path, controllers);
		},

		preMiddy,
		posMiddy,

		listen(...props: Parameters<Deno.ServeHandler>) {
			const req = props[0];

			const jwt = req.headers.get("Authorization");

			if (jwt) RocketEnvs.set("SUPABASE_JWT", jwt);

			const url = new URL(req.url);

			const method = req.method as httpMethods;

			if (method === "OPTIONS") return options();

			// Extract the last part of the path as the command
			const pathname = url.pathname;

			const httpMethods = httpMethodsMap.get(method);

			if (!httpMethods) return notfound();

			const paths = Array.from(httpMethods.keys());

			const command = matchRoute(pathname, paths);

			if (!command) return notfound();

			if (command.params) store.set("params", command.params);

			const controllers = httpMethods.get(command.path);

			if (!controllers?.length) return notfound();

			(props[1] as Info).store = store;

			return EventLoop(controllers, props) as Promise<Response>;
		},
	};
};
