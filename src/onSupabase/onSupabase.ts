import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";
import { RocketEnvs } from "../global.env";
import { EdgeError } from "../index";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

export const onSupabase = <
	Database,
	SchemaName extends string & keyof Database = "public" extends keyof Database
		? "public"
		: string & keyof Database,
	Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
		? Database[SchemaName]
		: // biome-ignore lint/suspicious/noExplicitAny: <explanation>
			any,
>(
	options?: Parameters<typeof createClient<Database>>[2],
): SupabaseClient<Database, SchemaName, Schema> => {
	const jwt = RocketEnvs.get("SUPABASE_JWT");

	if (!url || !key || !jwt) throw new EdgeError();

	const supabase = createClient<Database>(url, key, {
		...options,

		global: {
			...options?.global,
			headers: {
				Authorization: jwt,
				...options?.global?.headers,
			},
		},
	});

	return supabase as SupabaseClient<Database, SchemaName, Schema>;
};
