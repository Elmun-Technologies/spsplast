import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyImageMagicBytes, getImageDimensions, getExtensionForMime } from './imageUtils';

export interface UploadResult {
    url: string;
    key: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
    width?: number;
    height?: number;
}

export interface MediaStorageProvider {
    name: 'LOCAL' | 'R2_S3';
    upload(fileBuffer: Buffer, originalFilename: string, mimeType: string, folder?: string): Promise<UploadResult>;
    delete(key: string): Promise<boolean>;
    getPublicUrl(key: string): string;
    validate(fileBuffer: Buffer, mimeType: string): Promise<ValidationResult>;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function validateMediaFile(fileBuffer: Buffer, mimeType: string): Promise<ValidationResult> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        return {
            valid: false,
            error: `Ruxsat berilmadi: Faqat JPG, PNG, WEBP, AVIF rasmlari yuklanishi mumkin (SVG yoki boshqa fayllar taqiqlangan).`,
        };
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: `Fayl hajmi juda katta: Max 10 MB allowed. Sizning faylingiz: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB.`,
        };
    }

    const isMagicValid = verifyImageMagicBytes(fileBuffer, mimeType);
    if (!isMagicValid) {
        return {
            valid: false,
            error: `Fayl formati tasdiqlanmadi (MIME spoofing taqiqlangan).`,
        };
    }

    const dims = getImageDimensions(fileBuffer);
    return {
        valid: true,
        width: dims.width,
        height: dims.height,
    };
}

export class LocalStorageProvider implements MediaStorageProvider {
    name: 'LOCAL' = 'LOCAL';

    private uploadsDir: string;

    constructor() {
        this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    }

    async validate(fileBuffer: Buffer, mimeType: string): Promise<ValidationResult> {
        return validateMediaFile(fileBuffer, mimeType);
    }

    async upload(fileBuffer: Buffer, originalFilename: string, mimeType: string, folder: string = 'products'): Promise<UploadResult> {
        const val = await this.validate(fileBuffer, mimeType);
        if (!val.valid) {
            throw new Error(val.error || 'Invalid file');
        }

        const ext = getExtensionForMime(mimeType);
        const safeKey = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const fullPath = path.join(this.uploadsDir, safeKey);

        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, fileBuffer);

        const publicUrl = `/uploads/${safeKey.replace(/\\/g, '/')}`;

        return {
            url: publicUrl,
            key: safeKey,
            mimeType,
            sizeBytes: fileBuffer.length,
            width: val.width,
            height: val.height,
        };
    }

    async delete(key: string): Promise<boolean> {
        try {
            // Prevent path traversal
            const sanitizedKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
            const fullPath = path.join(this.uploadsDir, sanitizedKey);

            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error deleting local storage file:', err);
            return false;
        }
    }

    getPublicUrl(key: string): string {
        if (key.startsWith('http://') || key.startsWith('https://')) return key;
        return `/uploads/${key.replace(/\\/g, '/')}`;
    }
}

export class S3MediaStorageProvider implements MediaStorageProvider {
    name: 'R2_S3' = 'R2_S3';
    private s3Client: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor() {
        const endpoint = process.env.S3_ENDPOINT;
        const region = process.env.S3_REGION || 'auto';
        const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || '';
        const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || '';
        this.bucket = process.env.S3_BUCKET || '';
        this.publicUrl = process.env.S3_PUBLIC_URL || '';

        if (!accessKeyId || !secretAccessKey || !this.bucket) {
            throw new Error('S3 / Cloudflare R2 credentials are missing or incomplete.');
        }

        this.s3Client = new S3Client({
            region,
            endpoint: endpoint || undefined,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async validate(fileBuffer: Buffer, mimeType: string): Promise<ValidationResult> {
        return validateMediaFile(fileBuffer, mimeType);
    }

    async upload(fileBuffer: Buffer, originalFilename: string, mimeType: string, folder: string = 'products'): Promise<UploadResult> {
        const val = await this.validate(fileBuffer, mimeType);
        if (!val.valid) {
            throw new Error(val.error || 'Invalid file');
        }

        const ext = getExtensionForMime(mimeType);
        const safeKey = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: safeKey,
            Body: fileBuffer,
            ContentType: mimeType,
        });

        await this.s3Client.send(command);

        const publicUrl = this.getPublicUrl(safeKey);

        return {
            url: publicUrl,
            key: safeKey,
            mimeType,
            sizeBytes: fileBuffer.length,
            width: val.width,
            height: val.height,
        };
    }

    async delete(key: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            await this.s3Client.send(command);
            return true;
        } catch (err) {
            console.error('Error deleting object from S3/R2:', err);
            return false;
        }
    }

    getPublicUrl(key: string): string {
        if (key.startsWith('http://') || key.startsWith('https://')) return key;
        if (this.publicUrl) {
            const baseUrl = this.publicUrl.endsWith('/') ? this.publicUrl.slice(0, -1) : this.publicUrl;
            return `${baseUrl}/${key}`;
        }
        const endpoint = process.env.S3_ENDPOINT || '';
        if (endpoint) {
            const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
            return `${baseUrl}/${this.bucket}/${key}`;
        }
        return `/uploads/${key}`;
    }
}

/**
 * Returns active media storage provider.
 * Uses S3/R2 if credentials are provided, otherwise defaults to local storage.
 */
export function getMediaStorageProvider(): MediaStorageProvider {
    const accessKey = process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY;
    const bucket = process.env.S3_BUCKET;

    if (accessKey && secretKey && bucket) {
        try {
            return new S3MediaStorageProvider();
        } catch (e) {
            console.warn('Failed to initialize S3 provider, falling back to LocalStorageProvider:', e);
        }
    }

    return new LocalStorageProvider();
}
