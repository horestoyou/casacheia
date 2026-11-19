const test=require('node:test');
const assert=require('node:assert/strict');
const {MongoMemoryServer}=require('mongodb-memory-server');
const {MongoClient}=require('mongodb');
const {Writable}=require('node:stream');
const request=require('supertest');
const {createApp}=require('../app');
const {hashPassword,checkPassword,detectImage}=require('../security');
let mongo,client,app;const origin='http://localhost';
test.before(async()=>{mongo=await MongoMemoryServer.create({instance:{storageEngine:'wiredTiger'}});client=new MongoClient(mongo.getUri());await client.connect();const db=client.db('test');await db.collection('users').createIndex({email:1},{unique:true});const fakeCloud={uploader:{upload_stream(opts,cb){return new Writable({write(chunk,enc,next){next();},final(next){cb(null,{public_id:'test-avatar',format:'jpg'});next();}});},async destroy(){}},utils:{private_download_url(){return 'data:image/jpeg;base64,/9j/';}}};app=createApp({db,origin,cloudinary:fakeCloud});});
test.after(async()=>{if(client)await client.close();if(mongo)await mongo.stop();});
test('Passwords are salted and verified',async()=>{const a=await hashPassword('palavra-segura'),b=await hashPassword('palavra-segura');assert.notEqual(a.hash,b.hash);assert.equal(await checkPassword('palavra-segura',a),true);assert.equal(await checkPassword('errada',a),false);});
test('Private data, conflicts, conversations and video rejection',async()=>{
  const alice=request.agent(app),bob=request.agent(app),eve=request.agent(app);
  const sign=async(agent,name,email)=>{const r=await agent.post('/api/auth/register').set('Origin',origin).send({name,email,phone:'919111222',password:'palavra-segura'});assert.equal(r.status,201,JSON.stringify(r.body));return r.body.user;};
  const a=await sign(alice,'Ana Teste','ana@example.com'),b=await sign(bob,'Bruno Teste','bruno@example.com'),c=await sign(eve,'Carla Teste','carla@example.com');
  assert.equal((await request(app).get('/api/me/data')).status,401);
  assert.equal((await alice.put('/api/me/data/salary').send({value:'1000',expectedVersion:0})).status,403);
  const saved=await alice.put('/api/me/data/salary').set('Origin',origin).set('X-HTY-Account',a.id).send({value:'1000',expectedVersion:0});assert.equal(saved.status,200);assert.equal(saved.body.version,1);
  const manual=await alice.put('/api/me/data/manual-hours').set('Origin',origin).set('X-HTY-Account',a.id).send({value:JSON.stringify({'2026-11-01':450}),expectedVersion:0});assert.equal(manual.status,200);
  const invalidManual=await alice.put('/api/me/data/manual-hours').set('Origin',origin).set('X-HTY-Account',a.id).send({value:JSON.stringify({'2026-11-01':1441}),expectedVersion:1});assert.equal(invalidManual.status,400);
  const duplicate=await alice.put('/api/me/data/salary').set('Origin',origin).set('X-HTY-Account',a.id).send({value:'1200',expectedVersion:0});assert.equal(duplicate.status,409);assert.equal(duplicate.body.current.value,'1000');
  const firstPhoto=await alice.post('/api/me/avatar').set('Origin',origin).set('X-HTY-Account',a.id).field('expectedVersion','0').attach('image',Buffer.from([255,216,255,1]),'foto.jpg');assert.equal(firstPhoto.status,201);assert.equal(firstPhoto.body.version,1);
  const stalePhoto=await alice.post('/api/me/avatar').set('Origin',origin).set('X-HTY-Account',a.id).field('expectedVersion','0').attach('image',Buffer.from([255,216,255,1]),'foto.jpg');assert.equal(stalePhoto.status,409);assert.equal(stalePhoto.body.current.version,1);
  assert.equal((await bob.get('/api/me/data').set('X-HTY-Account',b.id)).body.items.length,0);assert.equal((await bob.get('/api/me/data').set('X-HTY-Account',a.id)).status,409); assert.equal((await alice.put('/api/me/data/salary').set('Origin',origin).set('X-HTY-Account',b.id).send({value:'7',expectedVersion:1})).status,409);
  const msg=await alice.post(`/api/chats/${b.id}/messages`).set('Origin',origin).set('X-HTY-Account',a.id).send({text:'Mensagem privada',kind:'text'});assert.equal(msg.status,201);
  const inbox=await bob.get(`/api/chats/${a.id}/messages`).set('X-HTY-Account',b.id);assert.equal(inbox.body.messages[0].text,'Mensagem privada');
  const notShared=await eve.get(`/api/chats/${a.id}/messages`).set('X-HTY-Account',c.id);assert.equal(notShared.body.messages.length,0);
  const privateImage=await alice.post(`/api/chats/${b.id}/images`).set('Origin',origin).set('X-HTY-Account',a.id).attach('image',Buffer.from([255,216,255,1]),'foto.jpg');assert.equal(privateImage.status,201);
  assert.equal((await eve.get(`/api/media/${privateImage.body.message.assetId}`)).status,404);
  assert.equal((await bob.get(`/api/media/${privateImage.body.message.assetId}`)).status,200);
  assert.equal((await alice.post(`/api/chats/${b.id}/images`).set('Origin',origin).set('X-HTY-Account',a.id).attach('image',Buffer.from('not a photo'),'video.mp4')).status,400);
  assert.equal((await alice.get('/api/users').set('X-HTY-Account',a.id)).body.users.some(x=>'email' in x||'phone' in x),false);
  assert.equal(detectImage(Buffer.from('not a photo')),null);
});

test('Package requests require activation and deleted accounts can register again',async()=>{
  const prior=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='testing-admin-secret';
  try{
    const clientAgent=request.agent(app),administrator=request.agent(app),body={name:'Pessoa Teste',email:'pessoa-nova@example.com',phone:'919111222',password:'palavra-segura',plan:'monthly',packageMessage:'Quero aderir.'};
    const created=await clientAgent.post('/api/auth/register').set('Origin',origin).send(body);assert.equal(created.status,201);assert.equal(created.body.user.subscriptionStatus,'pending');const id=created.body.user.id;
    assert.equal((await clientAgent.get('/api/me/data').set('X-HTY-Account',id)).status,403);
    assert.equal((await clientAgent.delete(`/api/admin/users/${id}`).set('Origin',origin)).status,401);
    assert.equal((await administrator.post('/api/admin/login').set('Origin',origin).send({email:'admin1@gmail.com',password:'testing-admin-secret'})).status,200);
    assert.equal((await administrator.post(`/api/admin/users/${id}/package`).set('Origin',origin).send({action:'monthly_paid'})).status,200);
    assert.equal((await clientAgent.get('/api/me/data').set('X-HTY-Account',id)).status,200);
    assert.equal((await clientAgent.put('/api/me/data/salary').set('Origin',origin).set('X-HTY-Account',id).send({value:'1760',expectedVersion:0})).status,200);
    assert.equal((await clientAgent.put('/api/me/data/manual-hours').set('Origin',origin).set('X-HTY-Account',id).send({value:JSON.stringify({'2026-11-17':450}),expectedVersion:0})).status,200);
    assert.equal((await clientAgent.get(`/api/admin/users/${id}/report`)).status,401);
    const report=await administrator.get(`/api/admin/users/${id}/report`);assert.equal(report.status,200);assert.equal(report.body.report.days[0].minutes,450);assert.equal(report.body.report.days[0].baseEstimate,75);
    assert.equal((await administrator.delete(`/api/admin/users/${id}`).set('Origin',origin)).status,200);
    assert.equal(await client.db('test').collection('user_data').countDocuments({userId:id}),0);
    assert.equal((await clientAgent.get('/api/me/data').set('X-HTY-Account',id)).status,401);
    const retry=await request.agent(app).post('/api/auth/register').set('Origin',origin).send({...body,plan:'trial'});assert.equal(retry.status,201);assert.notEqual(retry.body.user.id,id);
  }finally{if(prior===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=prior;}
});



