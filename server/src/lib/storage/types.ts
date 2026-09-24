export interface StorageDriver {
  /**
   * Persist a file and return its public URL.
   */
  save(buffer: Buffer, key: string, contentType: string): Promise<string>

  /**
   * Resolve the public URL for an already-stored key.
   */
  publicUrl(key: string): string
}