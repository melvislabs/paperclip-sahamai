export interface BatchOptions {
  size: number;
  delayMs?: number;
}

export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchOptions = { size: 100 }
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += options.size) {
    const batch = items.slice(i, i + options.size);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    if (options.delayMs && i + options.size < items.length) {
      await new Promise(resolve => setTimeout(resolve, options.delayMs));
    }
  }

  return results;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
