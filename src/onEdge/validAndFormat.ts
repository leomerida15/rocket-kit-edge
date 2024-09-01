// deno-lint-ignore-file no-explicit-any
import { TypeOf, ZodObject, ZodType, ZodTypeDef } from "zod";
import { IZodSchemasValid } from "./types";

export default class ValidAndFormat<
	B extends ZodType<any, ZodTypeDef, any>,
	C extends ZodObject<any>,
	Q extends ZodObject<any>,
	P extends ZodObject<any>,
> {
	private readonly Schemas?: IZodSchemasValid<B, C, Q, P>;
	private readonly NativeInfo: TypeOf<C>;
	private readonly nativeRequest: Request;
	private readonly valid_methods: boolean;
	private bodyNative: TypeOf<B> | undefined;

	constructor(
		nativeRequest: Request,
		Info: TypeOf<C>,
		Schemas?: IZodSchemasValid<B, C, Q, P>,
	) {
		this.Schemas = Schemas;
		this.NativeInfo = Info;
		this.nativeRequest = nativeRequest;
		this.valid_methods = !["DELETE", "GET"].includes(nativeRequest.method);
	}

	private getParams(route: string, pathname: string) {
		const params = {};
		const paramNames: string[] = [];

		// Convertimos el path con parámetros a una expresión regular
		const regexPath = route.replace(/\/:(\w+)/g, (_, paramName) => {
			paramNames.push(paramName);
			return "/([^/]+)";
		});

		// Creamos la expresión regular con el comienzo (^) y fin ($) del string
		const regex = new RegExp(`^${regexPath}$`);

		// Hacemos el match y extraemos los valores de los parámetros
		const match = pathname.match(regex);
		if (match) {
			paramNames.forEach((paramName, index) => {
				params[paramName] = match[index + 1];
			});
		}

		return params;
	}

	private getQueryParams(): URLSearchParams {
		const url = new URL(
			this.nativeRequest.url,
			this.nativeRequest.headers.get("origin") || "about:blank",
		);

		return new URLSearchParams(url.search);
	}

	private getQueryWhoNoHasSchema(): (
		queriesArray: Array<keyof TypeOf<Q>>,
	) => Partial<TypeOf<Q>> {
		return (queriesArray) => {
			const resQueries: any = {};
			queriesArray.map((q) => {
				resQueries[q] = this.getQueryParams().get(String(q));
			});
			return resQueries;
		};
	}

	private createGetQueryWhoHasSchema(
		queryFormat: TypeOf<Q>,
	): (queriesArray: Array<keyof TypeOf<Q>>) => Partial<TypeOf<Q>> {
		return (queriesArray) => {
			const queryFilter = Object.entries(queryFormat).filter(([k]) =>
				queriesArray.includes(k),
			);
			const queryObj = Object.fromEntries(queryFilter) as Partial<TypeOf<Q>>;
			return queryObj;
		};
	}

	Info(): TypeOf<C> {
		return this.Schemas?.Info?.parse(this.NativeInfo) || this.NativeInfo;
	}

	query(): (queriesArray: Array<keyof TypeOf<Q>>) => Partial<TypeOf<Q>> {
		return this.Schemas?.query
			? this.createGetQueryWhoHasSchema(
					this.Schemas.query.parse(
						Object.fromEntries(this.getQueryParams().entries()),
					) as TypeOf<Q>,
				)
			: this.getQueryWhoNoHasSchema();
	}

	params(): TypeOf<P> {
		const { store } = this.NativeInfo;

		if (!store && this.Schemas?.params) {
			throw new Error(
				"In order to use route parameters you must implement the 'onRouter' method and create a router",
			);
		}

		if (!this.Schemas?.params) return store.get("params") as object;

		return this.Schemas?.params.parse(store.get("params"));
	}

	private async defineBody() {
		if (this.valid_methods && this.Schemas?.body) {
			this.bodyNative = await this.nativeRequest.json();
		}
	}

	async body(): Promise<TypeOf<B>> {
		await this.defineBody();
		return this.Schemas?.body?.parse(this.bodyNative) || this.bodyNative;
	}
}
