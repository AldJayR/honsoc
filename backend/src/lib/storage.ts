import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env.ts";

const client = new S3Client({
	endpoint: env.R2_ENDPOINT,
	region: "auto",
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
	requestChecksumCalculation: "WHEN_REQUIRED",
});

const EXPIRY_SECONDS = 900;

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
