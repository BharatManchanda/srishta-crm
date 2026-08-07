import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
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
