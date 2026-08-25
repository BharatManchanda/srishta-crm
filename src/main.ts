import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];

  app.use(cookieParser());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },

      exceptionFactory(errors) {
        const formattedErrors = {};

        errors.forEach((error) => {
          const firstError = Object.values(error.constraints || {})[0];

          formattedErrors[error.property] = firstError;
        });

        return new BadRequestException({
          errors: formattedErrors,
        });
      },
    }),
  );
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
