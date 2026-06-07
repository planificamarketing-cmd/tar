// Esquemas Zod y tipos compartidos entre API y Web (packages/shared).
// La validación de TODA entrada de API vive aquí (CLAUDE.md, regla de oro 4; PRD §5).

export * from './enums';
export * from './common';
export * from './auth';
export * from './user';
export * from './property';
export * from './lead';
export * from './webhook';
export * from './script';

export const SHARED_PACKAGE_VERSION = '0.1.0';
