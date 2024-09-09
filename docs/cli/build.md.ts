import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

(() => {
	try {
		const directoryPath = resolve("docs", "sections"); // Cambia esto a tu directorio

		// Lee el contenido del directorio
		const combinedContent = readdirSync(directoryPath)
			.filter((file) => extname(file) === ".md")
			.map((file) => join(directoryPath, file))
			.map((file) => readFileSync(file, "utf8"))
			.reverse()
			.join("\n");

		unlinkSync(resolve("docs", "README.md"));

		writeFileSync(resolve("docs", "README.md"), combinedContent);
	} catch (error) {
		console.log("error", error);
	}
})();
