type CorsHeaders =
	| "Content-Type"
	| "Access-Control-Allow-Origin"
	| "Access-Control-Allow-Methods"
	| "Access-Control-Allow-Headers"
	| "Access-Control-Max-Age"
	| "Access-Control-Allow-Credentials"
	| "Access-Control-Expose-Headers";

class Cors extends Map<CorsHeaders, string> {
	constructor(props?: [CorsHeaders, string][] | null) {
		super(props);

		super.set("Content-Type", "application/json");
		super.set("Access-Control-Allow-Origin", "*");
		super.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, PATCH, DELETE, OPTIONS",
		);
		super.set(
			"Access-Control-Allow-Headers",
			"authorization, x-client-info, apikey, content-type",
		);

		// Si deseas añadir otro encabezado, obtendrás sugerencias:
		super.set("Access-Control-Max-Age", "86400");
	}

	getHeaders() {
		const entries = Array.from(this.entries());
		const headers = new Headers(entries);

		return headers;
	}
}

export const cors = new Cors();
