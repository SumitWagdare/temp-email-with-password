const fs = require('fs');
const tsNode = require('ts-node');
tsNode.register({ compilerOptions: { module: 'commonjs', target: 'es6' } });
const { generatePassword, DEFAULT_OPTIONS } = require('./src/lib/password-generator.ts');
console.log("Password:", generatePassword(DEFAULT_OPTIONS));
