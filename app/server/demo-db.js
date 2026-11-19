'use strict';
// Temporary storage for the explicitly enabled demonstration server.
function createMemoryDb(){
 const collections=new Map();
 const clone=x=>structuredClone(x);const get=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o);
 function matches(o,q={}){return Object.entries(q).every(([key,v])=>{if(key==='$or')return v.some(x=>matches(o,x));const a=get(o,key);if(v&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Date)){return Object.entries(v).every(([op,b])=>op==='$in'?b.includes(a):op==='$ne'?a!==b:op==='$gt'?a>b:op==='$exists'?(a!==undefined)===b:false);}return a===v;});}
 function project(row,p){if(!p)return clone(row);const keys=Object.keys(p).filter(k=>p[k]);if(keys.length){const r={};for(const k of keys)if(row[k]!==undefined)r[k]=clone(row[k]);if(p._id!==0&&row._id!==undefined)r._id=row._id;return r;}const r=clone(row);for(const k in p)if(p[k]===0)delete r[k];return r;}
 function change(row,u){for(const [k,v] of Object.entries(u.$set||{})){const parts=k.split('.');let target=row;while(parts.length>1){const part=parts.shift();target=target[part]||(target[part]={});}target[parts[0]]=clone(v);}for(const k of Object.keys(u.$unset||{}))delete row[k];for(const [k,v] of Object.entries(u.$inc||{}))row[k]=(row[k]||0)+v;}
 function collection(name){if(collections.has(name))return collections.get(name);let data=[];const c={
 async createIndex(){},async insertOne(doc){if(data.some(r=>r._id===doc._id||(name==='users'&&r.email===doc.email))){const e=Error('duplicate');e.code=11000;throw e;}data.push(clone(doc));return {insertedId:doc._id};},
 async findOne(q,opt={}){const r=data.find(x=>matches(x,q));return r?project(r,opt.projection):null;},
 find(q={},opt={}){let sortSpec,limit=Infinity;return {sort(s){sortSpec=s;return this;},limit(n){limit=n;return this;},async toArray(){let rows=data.filter(x=>matches(x,q));if(sortSpec){const [k,d]=Object.entries(sortSpec)[0];rows=rows.slice().sort((a,b)=>((get(a,k)>get(b,k))-(get(a,k)<get(b,k)))*d);}return rows.slice(0,limit).map(x=>project(x,opt.projection));}};},
 async updateOne(q,u){const r=data.find(x=>matches(x,q));if(!r)return {matchedCount:0,modifiedCount:0};change(r,u);return {matchedCount:1,modifiedCount:1};},
 async updateMany(q,u){let n=0;for(const r of data)if(matches(r,q)){change(r,u);n++;}return {matchedCount:n,modifiedCount:n};},
 async findOneAndUpdate(q,u){const r=data.find(x=>matches(x,q));if(!r)return null;change(r,u);return clone(r);},
 async deleteOne(q){const i=data.findIndex(x=>matches(x,q));if(i<0)return {deletedCount:0};data.splice(i,1);return {deletedCount:1};},
 async deleteMany(q){const before=data.length;data=data.filter(x=>!matches(x,q));return {deletedCount:before-data.length};},
 aggregate(pipeline){return {async toArray(){let rows=data.filter(x=>!pipeline[0].$match||matches(x,pipeline[0].$match));const g=pipeline.find(x=>x.$group)?.$group;if(!g)return [];const groups=new Map();for(const row of rows){const id=typeof g._id==='string'&&g._id.startsWith('$')?get(row,g._id.slice(1)):g._id;const result=groups.get(id)||{_id:id};for(const [k,v] of Object.entries(g))if(k!=='_id'&&v.$sum!==undefined)result[k]=(result[k]||0)+(typeof v.$sum==='number'?v.$sum:(get(row,String(v.$sum).slice(1))||0));groups.set(id,result);}return [...groups.values()];}};}
 };collections.set(name,c);return c;}
 return {collection,async command(){return {ok:1};}};
}
module.exports={createMemoryDb};
