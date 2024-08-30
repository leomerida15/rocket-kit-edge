import { PostgrestError } from "@supabase/postgrest-js";

export class SupaError extends Error implements PostgrestError {
	details: string;
	hint: string;
	code: string;

	constructor({ message, details, hint, code }: PostgrestError) {
		super(message);
		this.name = "SupaError";
		this.details = details;
		this.hint = hint;
		this.code = code;
	}
}
