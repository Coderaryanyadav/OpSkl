import * as Sentry from '@sentry/react-native';

export const initSentry = () => {
  if (!__DEV__) {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
      tracesSampleRate: 1.0,
    });
  }
};
