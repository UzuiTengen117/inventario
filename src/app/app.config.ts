import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { appRouter } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), appRouter],
};
