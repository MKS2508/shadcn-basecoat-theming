import { Plugin } from 'vite';

declare const browserLogger: () => Plugin;
export = browserLogger;