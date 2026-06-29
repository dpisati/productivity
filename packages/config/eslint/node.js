import globals from 'globals';
import base from './base.js';

/** ESLint flat config for Node.js backend packages. */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
