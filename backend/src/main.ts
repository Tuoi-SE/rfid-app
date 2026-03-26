import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const corsOrigins = config.get('CORS_ORIGINS', 'http://localhost:3001');

  app.enableCors({
    origin: corsOrigins.split(',').map((o: string) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RFID Inventory API')
    .setDescription('API documentation for RFID Inventory Management System')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth', 'Authentication & Token management')
    .addTag('Users', 'User management (Admin only)')
    .addTag('Categories', 'Product category management')
    .addTag('Products', 'Product management')
    .addTag('Tags', 'RFID tag management')
    .addTag('Inventory', 'Check-in / Check-out operations')
    .addTag('Dashboard', 'Dashboard statistics')
    .addTag('Activity Logs', 'System activity logs')
    .addTag('Sessions', 'Scan session management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = config.get('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();

