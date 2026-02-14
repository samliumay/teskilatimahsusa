import * as Minio from 'minio';

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER || '',
      secretKey: process.env.MINIO_ROOT_PASSWORD || '',
    });
  }
  return minioClient;
}

const BUCKET = process.env.MINIO_BUCKET || 'teskilat-files';

export async function ensureBucket(): Promise<void> {
  const client = getMinioClient();
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET);
  }
}

export async function uploadFile(
  objectName: string,
  buffer: Buffer,
  size: number,
  contentType: string
): Promise<string> {
  const client = getMinioClient();
  await ensureBucket();
  await client.putObject(BUCKET, objectName, buffer, size, {
    'Content-Type': contentType,
  });
  return objectName;
}

export async function getFileUrl(objectName: string, expirySeconds = 3600): Promise<string> {
  const client = getMinioClient();
  return await client.presignedGetObject(BUCKET, objectName, expirySeconds);
}

export async function deleteFile(objectName: string): Promise<void> {
  const client = getMinioClient();
  await client.removeObject(BUCKET, objectName);
}
