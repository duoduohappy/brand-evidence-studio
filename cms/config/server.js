module.exports=({env})=>({host:'127.0.0.1',port:18782,app:{keys:[env('CMS_TOKEN')+'-a',env('CMS_TOKEN')+'-b']}});
