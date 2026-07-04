import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class StorageService {
    private s3 = new S3Client({
        region: process.env.AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!,
        },
    });

    async createUploadUrl(folder: string, filename: string, mimeType: string) {
        const key = `${folder}/${Date.now()}-${randomUUID()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: key,
            ContentType: mimeType,
        });

        const uploadUrl = await getSignedUrl(this.s3, command, {
                expiresIn: 300,
            },
        );

        return {
            uploadUrl,
            key,
            publicUrl: `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET}/${key}`,
        };
    }

    async getObject(key: string) {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: key,
        });

        return this.s3.send(command);
    }
}