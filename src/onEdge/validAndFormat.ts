import { z, ZodObject, ZodType } from "zod";
import { IZodSchemasValid } from "./types";

export default class ValidAndFormat<
	B extends ZodType<any, any, any>,
	C extends ZodObject<any>,
	Q extends ZodObject<any>,
	P extends ZodObject<any>,
> {
	private readonly Schemas?: IZodSchemasValid<B, C, Q, P>;
	private readonly NativeInfo: z.infer<C>;
	private readonly nativeRequest: Request;
	private readonly valid_methods: boolean;
	private bodyNative: z.infer<B> | undefined;

	constructor(
		nativeRequest: Request,
		Info: z.infer<C>,
		Schemas?: IZodSchemasValid<B, C, Q, P>,
	) {
		this.Schemas = Schemas;
		this.NativeInfo = Info;
		this.nativeRequest = nativeRequest;
		this.valid_methods = !["DELETE", "GET"].includes(nativeRequest.method);
	}

	private getNativeQueryParams(): URLSearchParams {
		const url = new URL(
			this.nativeRequest.url,
			this.nativeRequest.headers.get("origin") || "about:blank",
		);

		return new URLSearchParams(url.search);
	}

	private getQueryWhoNoHasSchema(): (
		queriesArray: Array<keyof z.infer<Q>>,
	) => Partial<z.infer<Q>> {
		return (queriesArray) => {
			const resQueries: any = {};
			queriesArray.map((q) => {
				resQueries[q] = this.getNativeQueryParams().get(String(q));
			});
			return resQueries;
		};
	}

	private createGetQueryWhoHasSchema(
		queryFormat: z.infer<Q>,
	): (queriesArray: Array<keyof z.infer<Q>>) => Partial<z.infer<Q>> {
		return (queriesArray) => {
			const queryFilter = Object.entries(queryFormat).filter(([k]) =>
				queriesArray.includes(k)
			);
			const queryObj = Object.fromEntries(queryFilter) as Partial<
				z.infer<Q>
			>;
			return queryObj;
		};
	}

	Info(): z.infer<C> {
		return this.Schemas?.Info?.parse(this.NativeInfo) || this.NativeInfo;
	}

	query(): (queriesArray: Array<keyof z.infer<Q>>) => Partial<z.infer<Q>> {
		return this.Schemas?.query
			? this.createGetQueryWhoHasSchema(
				this.Schemas.query.parse(
					Object.fromEntries(this.getNativeQueryParams().entries()),
				) as z.infer<Q>,
			)
			: this.getQueryWhoNoHasSchema();
	}

	params(): z.infer<P> {
		const { store } = this.NativeInfo;

		if (!store && !this.Schemas?.params) return {} as z.infer<P>;

		if (!store && this.Schemas?.params) {
			throw new Error(
				"In order to use route parameters you must implement the 'onRouter' method and create a router",
			);
		}

		if (!this.Schemas?.params) {
			return (store as any).get("params") as z.infer<P>;
		}

		return this.Schemas?.params.parse((store as any).get("params"));
	}

	private async defineBody() {
		if (this.valid_methods && this.Schemas?.body) {
			this.bodyNative = await this.nativeRequest.json();
		}
	}

	async body(): Promise<z.infer<B>> {
		await this.defineBody();
		return this.Schemas?.body?.parse(this.bodyNative) || this.bodyNative;
	}
}
