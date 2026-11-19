const test=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const {createApp}=require('../app');
test('Admin data requires the separate administrator session',async()=>{
  const sessions=new Map(),records=[{_id:'u1',name:'Cliente',email:'cliente@example.com',lastSeen:new Date()}];
  const collections={sessions:{async insertOne(row){sessions.set(row._id,row);},async findOne(query){const row=sessions.get(query._id);return row&&row.admin===query.admin&&row.expiresAt>query.expiresAt.$gt?row:null;},async deleteOne(query){sessions.delete(query._id);}},users:{find(){return {sort(){return this;},limit(){return this;},async toArray(){return records;}};}}};
  const db={collection(name){return collections[name]||{};}};
  const previous=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='admin';
  try{const app=createApp({db,origin:'http://localhost'}),agent=request.agent(app);
    assert.equal((await agent.get('/api/admin/users')).status,401);
    assert.equal((await agent.post('/api/admin/login').set('Origin','http://localhost').send({email:'admin1@gmail.com',password:'wrong'})).status,401);
    assert.equal((await agent.post('/api/admin/login').set('Origin','http://localhost').send({email:'admin1@gmail.com',password:'admin'})).status,200);
    const list=await agent.get('/api/admin/users');assert.equal(list.status,200);assert.equal(list.body.users[0].email,'cliente@example.com');
    assert.equal((await agent.post('/api/admin/logout').set('Origin','http://localhost')).status,200);
    assert.equal((await agent.get('/api/admin/users')).status,401);
  }finally{if(previous===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=previous;}
});
