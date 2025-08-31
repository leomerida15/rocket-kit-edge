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
		const Schema = this.Schemas?.Info;
		if (!Schema) return this.NativeInfo;

		const { success, data, error } = Schema.safeParse(
			this.NativeInfo,
		);

		if (!success) throw error;

		return data;
	}

	query(): (queriesArray: Array<keyof z.infer<Q>>) => Partial<z.infer<Q>> {
		const Schema = this.Schemas?.query;
		if (!Schema) return this.getQueryWhoNoHasSchema();

		const { success, data, error } = Schema.safeParse(
			Object.fromEntries(this.getNativeQueryParams().entries()),
		);

		if (!success) throw error;

		return this.createGetQueryWhoHasSchema(data);
	}

	params(): z.infer<P> {
		const Schema = this.Schemas?.params;
		const { store } = this.NativeInfo;

		if (!store && !Schema) return {} as z.infer<P>;

		if (!store && Schema) {
			throw new Error(
				"In order to use route parameters you must implement the 'onRouter' method and create a router",
			);
		}

		if (!Schema) {
			return (store as any).get("params") as z.infer<P>;
		}

		const { success, data, error } = Schema.safeParse(
			(store as any).get("params"),
		);

		if (!success) throw error;

		return data;
	}

	private async defineBody() {
		if (this.valid_methods) {
			this.bodyNative = await this.nativeRequest.json();
		}
	}

	async body(): Promise<z.infer<B>> {
		await this.defineBody();
		const Schema = this.Schemas?.body;
		if (!Schema) return this.bodyNative as any;

		const { success, data, error } = Schema.safeParse(this.bodyNative);

		if (!success) throw error;

		return data;
	}
}
