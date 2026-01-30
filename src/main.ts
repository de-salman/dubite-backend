import '@nestjs/core'; // So Nest CLI detects this as the Nest entrypoint
import { AppFactory } from './AppFactory';

async function bootstrap() {
  const { appPromise } = AppFactory.create();
  const app = await appPromise;
  await app.listen(process.env.PORT ?? 5050);
}
bootstrap();
