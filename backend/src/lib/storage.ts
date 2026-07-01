import { S3Client, PutObjectCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env.ts";

const client = new S3Client({
	endpoint: env.R2_ENDPOINT,
	region: "auto",
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

const EXPIRY_SECONDS = 900;

export async function setupStorageCors(): Promise<void> {
	try {
		const command = new PutBucketCorsCommand({
			Bucket: env.R2_BUCKET,
			CORSConfiguration: {
				CORSRules: [
					{
						AllowedHeaders: ["*"],
						AllowedMethods: ["PUT", "GET", "HEAD"],
						AllowedOrigins: [env.CORS_ORIGIN, "http://localhost:5173"],
						ExposeHeaders: ["ETag"],
						MaxAgeSeconds: 3000,
					},
				],
			},
		});
		await client.send(command);
		console.log("  Successfully configured CORS policy on R2 bucket");
	} catch (error) {
		console.warn("  Note: Could not set CORS policy on R2 bucket automatically. If uploads fail, configure CORS rules on Cloudflare Dashboard manually:", error instanceof Error ? error.message : error);
	}
}

export async function generatePresignedUrl(
	objectKey: string,
	contentType: string,
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: env.R2_BUCKET,
		Key: objectKey,
		ContentType: contentType,
	});

	return getSignedUrl(client, command, { expiresIn: EXPIRY_SECONDS });
}
