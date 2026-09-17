const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
fs.writeFileSync(path.join(__dirname,'content.js'),'// Generated from index.html, styles.css and form.js by build-content.cjs.\n'+[['html','index.html'],['css','styles.css'],['js','form.js']].map(([key,file])=>'export const '+key+'='+JSON.stringify(read(file))+';').join('\n')+'\n');

