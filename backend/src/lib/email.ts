export async function sendEmail(
	to: string,
	subject: string,
	html: string,
): Promise<void> {
	console.log("--- Email ---");
	console.log(`To: ${to}`);
	console.log(`Subject: ${subject}`);
	console.log(`Body: ${html}`);
	console.log("-------------");
}
