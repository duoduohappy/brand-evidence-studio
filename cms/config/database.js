const path=require('node:path');module.exports=()=>({connection:{client:'sqlite',connection:{filename:path.resolve(__dirname,'../.tmp/content.db')},useNullAsDefault:true}});
