import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";
import { EdgeError, StatusCodes } from "../index";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const onSupabaseSecret = <
	Database,
	SchemaName extends string & keyof Database = "public" extends keyof Database
		? "public"
		: string & keyof Database,
	Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
		? Database[SchemaName]
		: any,
>(
	options?: Parameters<typeof createClient<Database>>[2],
): SupabaseClient<Database, SchemaName, Schema> => {
	if (!url || !key) {
		const message =
			"the .env var SUPABASE_URL as SUPABASE_SERVICE_ROLE_KEY is required";

		throw new EdgeError({ message, status: StatusCodes.BAD_REQUEST });
	}

	const Authorization = `Bearer ${key}`;

	const supabase = createClient<Database>(url, key, {
		...options,

		global: {
			...options?.global,
			headers: {
				Authorization,
				...options?.global?.headers,
			},
		},
	});

	return supabase as SupabaseClient<Database, SchemaName, Schema>;
};
