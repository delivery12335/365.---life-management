import { resolve } from 'node:path';
import { createApp } from './app.mjs';
import { resetDeliveryFromEnv } from './mail.mjs';
const app = createApp({
  databasePath: resolve(process.env.DATABASE_PATH ?? '.data/365.sqlite'),
  production: process.env.NODE_ENV === 'production',
  appOrigin: process.env.APP_ORIGIN,
  resetDelivery: resetDeliveryFromEnv(),
});
app.server.listen(
  Number(process.env.API_PORT ?? process.env.PORT ?? 3001),
  process.env.HOST ?? '127.0.0.1',
  () =>
    console.log(
      `365. server: http://${process.env.HOST ?? '127.0.0.1'}:${process.env.API_PORT ?? process.env.PORT ?? 3001}`,
    ),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    void app.close().finally(() => process.exit());
  });
