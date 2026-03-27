import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',

            transport: isProduction
              ? undefined // JSON thuần 1 dòng cho production
              : { target: 'pino-pretty', options: { colorize: true, singleLine: true } },

            // Tự sinh Request ID cho mỗi HTTP request
            genReqId: (req: any) =>
              req.headers['x-request-id'] || crypto.randomUUID(),

            // Redact thông tin nhạy cảm
            redact: {
              paths: [
                'req.headers.authorization',
                'req.body.password',
                'req.body.refresh_token',
              ],
              censor: '***REDACTED***',
            },

            // Tùy chỉnh log message
            customLogLevel: (_req: any, res: any, err: any) => {
              if (res.statusCode >= 500 || err) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },

            // Serialize gọn nhẹ
            serializers: {
              req: (req: any) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: any) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),
  ],
})
export class LoggerConfigModule {}
