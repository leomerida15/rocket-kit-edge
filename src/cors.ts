type CorsHeaders =
	| "Content-Type"
	| "Access-Control-Allow-Origin"
	| "Access-Control-Allow-Methods"
	| "Access-Control-Allow-Headers"
	| "Access-Control-Max-Age"
	| "Access-Control-Allow-Credentials"
	| "Access-Control-Expose-Headers";

export class Cors extends Map<CorsHeaders, string> {
	getHeaders() {
		const entries = Array.from(this.entries());
		const headers = new Headers(entries);

		return headers;
	}
}
