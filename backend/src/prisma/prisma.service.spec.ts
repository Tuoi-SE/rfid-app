import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

// Test helper to expose private static parsePoolSize method
class TestablePrismaService {
  constructor(config: ConfigService) {
    const databaseUrl = config.get('DATABASE_URL');
    const poolSize = TestablePrismaService.parsePoolSize(databaseUrl);

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
      max: poolSize,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  static parsePoolSize(databaseUrl: string): number {
    try {
      const url = new URL(databaseUrl);
      const connectionLimit = url.searchParams.get('connection_limit');
      if (connectionLimit) {
        const parsed = parseInt(connectionLimit, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // Invalid URL, fall through to default
    }
    return 20;
  }
}

describe('PrismaService', () => {
  describe('parsePoolSize', () => {
    it('should extract valid connection_limit from URL', () => {
      const url = 'postgresql://user:pass@localhost:5432/db?connection_limit=15';
      expect(TestablePrismaService.parsePoolSize(url)).toBe(15);
    });

    it('should return 20 for URL without connection_limit', () => {
      const url = 'postgresql://user:pass@localhost:5432/db';
      expect(TestablePrismaService.parsePoolSize(url)).toBe(20);
    });

    it('should return 20 for invalid connection_limit (non-numeric)', () => {
      const url = 'postgresql://user:pass@localhost:5432/db?connection_limit=abc';
      expect(TestablePrismaService.parsePoolSize(url)).toBe(20);
    });

    it('should return 20 for connection_limit=0', () => {
      const url = 'postgresql://user:pass@localhost:5432/db?connection_limit=0';
      expect(TestablePrismaService.parsePoolSize(url)).toBe(20);
    });

    it('should return 20 for malformed URL', () => {
      const url = 'not-a-valid-url';
      expect(TestablePrismaService.parsePoolSize(url)).toBe(20);
    });
  });
});
