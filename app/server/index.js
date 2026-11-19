const {MongoClient,ServerApiVersion}=require('mongodb');
const cloudinary=require('cloudinary').v2;
const {createApp}=require('./app');
async function main(){
  const uri=process.env.MONGODB_URI,cloud=process.env.CLOUDINARY_CLOUD_NAME,key=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET,production=process.env.NODE_ENV==='production',origin=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL;
  if(process.env.DEMO_MODE==='true'){
    const {createMemoryDb}=require('./demo-db'),crypto=require('node:crypto'),{promisify}=require('node:util');
    const db=createMemoryDb(),salt=crypto.randomBytes(16).toString('hex'),hash=(await promisify(crypto.scrypt)('admin',Buffer.from(salt,'hex'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024})).toString('hex');
    await db.collection('users').insertOne({_id:'demo-andre',name:'André Teste',email:'andre@gmail.com',phone:'919000000',password:{salt,hash},createdAt:new Date(),avatarId:null});
    const app=createApp({db,origin,production,demo:true});const port=Number(process.env.PORT||10000);app.listen(port,'0.0.0.0',()=>console.log('Modo de demonstração ativo na porta '+port));return;
  }
  if(!uri)throw Error('MONGODB_URI em falta.');
  const client=new MongoClient(uri,{serverApi:{version:ServerApiVersion.v1,strict:true,deprecationErrors:true},serverSelectionTimeoutMS:10000});await client.connect();const db=client.db(process.env.MONGODB_DB||'hourtoyou');
  await Promise.all([db.collection('users').createIndex({email:1},{unique:true}),db.collection('sessions').createIndex({expiresAt:1},{expireAfterSeconds:0}),db.collection('user_data').createIndex({userId:1,kind:1},{unique:true}),db.collection('messages').createIndex({fromId:1,toId:1,createdAt:-1}),db.collection('messages').createIndex({toId:1,read:1}),db.collection('support_messages').createIndex({userId:1,createdAt:1})]);
  if(cloud&&key&&secret)cloudinary.config({cloud_name:cloud,api_key:key,api_secret:secret,secure:true});
  const app=createApp({db,cloudinary:cloud&&key&&secret?cloudinary:null,origin,production});const port=Number(process.env.PORT||10000);const server=app.listen(port,'0.0.0.0',()=>console.log(`HourToYou pronto na porta ${port}.`));
  async function shutdown(){server.close();await client.close();}process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
main().catch(error=>{console.error('Não foi possível iniciar:',error.message);process.exitCode=1;});
