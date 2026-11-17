const fs=require('node:fs');const path=require('node:path');process.chdir(__dirname);fs.mkdirSync('.tmp',{recursive:true});fs.mkdirSync('public/uploads',{recursive:true});
if(!process.env.CMS_TOKEN)throw Error('Use the project launcher: CMS_TOKEN is required');
const {createStrapi}=require('@strapi/strapi');createStrapi({appDir:__dirname,distDir:__dirname}).start().catch(e=>{console.error(e);process.exit(1)});
