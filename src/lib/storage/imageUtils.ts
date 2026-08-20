/**
 * Helper to inspect magic bytes of images to prevent MIME spoofing.
 */
export function verifyImageMagicBytes(buffer: Buffer, declaredMime: string): boolean {
    if (buffer.length < 12) return false;

    const hex = buffer.toString('hex', 0, 12).toUpperCase();

    // JPEG: FF D8 FF
    if (declaredMime === 'image/jpeg' || declaredMime === 'image/jpg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (declaredMime === 'image/png') {
        return (
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0d &&
            buffer[5] === 0x0a &&
            buffer[6] === 0x1a &&
            buffer[7] === 0x0a
        );
    }

    // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
    if (declaredMime === 'image/webp') {
        const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
        const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
        return isRiff && isWebp;
    }

    // AVIF: ftypavif or ftyp
    if (declaredMime === 'image/avif') {
        const ftyp = buffer.toString('ascii', 4, 8);
        return ftyp === 'ftyp';
    }

    return false;
}

/**
 * Basic image dimension parser for PNG & JPEG headers.
 */
export function getImageDimensions(buffer: Buffer): { width?: number; height?: number } {
    try {
        // PNG dimensions at bytes 16-24
        if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            return { width, height };
        }

        // JPEG dimensions parsing
        if (buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
            let offset = 2;
            while (offset < buffer.length) {
                if (buffer[offset] !== 0xff) break;
                const marker = buffer[offset + 1];
                // SOF0 (0xC0) or SOF2 (0xC2)
                if (marker === 0xc0 || marker === 0xc2) {
                    const height = buffer.readUInt16BE(offset + 5);
                    const width = buffer.readUInt16BE(offset + 7);
                    return { width, height };
                }
                const length = buffer.readUInt16BE(offset + 2);
                offset += 2 + length;
            }
        }
    } catch {
        // Return empty if parsing fails
    }
    return {};
}

/**
 * File extension resolver for supported mime types
 */
export function getExtensionForMime(mime: string): string {
    switch (mime.toLowerCase()) {
        case 'image/jpeg':
        case 'image/jpg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/webp':
            return 'webp';
        case 'image/avif':
            return 'avif';
        default:
            return 'bin';
    }
}
