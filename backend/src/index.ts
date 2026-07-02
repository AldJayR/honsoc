import "dotenv/config";
import { env } from "@/config/env.ts";
import { buildApp } from "@/app.ts";
import { setupStorageCors } from "@/lib/storage.ts";
import { startQueue, stopQueue } from "@/lib/queue.ts";
import { registerWorker } from "@/lib/worker.ts";

async function main() {
	await setupStorageCors();
	await startQueue();
	await registerWorker();

	const app = await buildApp();
	await app.listen({ port: env.PORT, host: env.HOST });

	let closing = false;
	const signals = ["SIGINT", "SIGTERM"] as const;
	for (const signal of signals) {
		process.on(signal, async () => {
			if (closing) return;
			closing = true;
			await app.close();
			await stopQueue();
			process.exit(0);
		});
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
