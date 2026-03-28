import * as crypto from 'crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

class LoggerConfigFactory {
  static createOptions(config: ConfigService) {
    const isProduction = config.get('NODE_ENV') === 'production';

    return {
      pinoHttp: {
        level: isProduction ? 'info' : 'debug',

        transport: isProduction
          ? undefined // JSON thuần 1 dòng cho production
          : { target: 'pino-pretty', options: { colorize: true, singleLine: true } },

        // Tự sinh Request ID cho mỗi HTTP request
        genReqId: LoggerConfigFactory.generateRequestId,

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
        customLogLevel: LoggerConfigFactory.resolveLogLevel,

        // Serialize gọn nhẹ
        serializers: {
          req: LoggerConfigFactory.serializeRequest,
          res: LoggerConfigFactory.serializeResponse,
        },
      },
    };
  }

  private static generateRequestId(req: any) {
    return req.headers['x-request-id'] || crypto.randomUUID();
  }

  private static resolveLogLevel(_req: any, res: any, err: any) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  }

  private static serializeRequest(req: any) {
    return {
      id: req.id,
      method: req.method,
      url: req.url,
    };
  }

  private static serializeResponse(res: any) {
    return {
      statusCode: res.statusCode,
    };
  }
}

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: LoggerConfigFactory.createOptions,
    }),
  ],
})
export class LoggerConfigModule {}
