import {mkdirSync,copyFileSync,readdirSync,writeFileSync,readFileSync} from 'node:fs';
mkdirSync('dist',{recursive:true});
for(const name of readdirSync('public'))copyFileSync('public/'+name,'dist/'+name);
const source=readFileSync('src/worker.mjs','utf8').replace('export function ','function ').replaceAll('export function ','function ').replaceAll('export async function ','async function ').replace('export default','const app =');
writeFileSync('dist/_worker.js',source+'\nexport default {fetch:app.fetch};\n');
writeFileSync('dist/_routes.json',JSON.stringify({version:1,include:['/*'],exclude:[]}));
console.log('Cloudflare Pages: dist pronto.');
