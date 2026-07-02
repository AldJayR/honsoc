import { PgBoss } from "pg-boss";
import { env } from "@/config/env.ts";

export const boss = new PgBoss(env.DATABASE_URL);
boss.on("error", (error) => {
	console.error("[pg-boss] error:", error);
});

export async function startQueue() {
	try {
		await boss.start();
		console.log("[pg-boss] queue started");
	} catch (error) {
		console.error("[pg-boss] failed to start:", error);
		throw error;
	}
}

export async function stopQueue() {
	try {
		await boss.stop();
		console.log("[pg-boss] queue stopped");
	} catch (error) {
		console.error("[pg-boss] failed to stop:", error);
	}
}
