import type { ProductStatus } from '@/server/db/schema';

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = { published: 'Nashrda', draft: 'Qoralama', archived: 'Arxiv' };
