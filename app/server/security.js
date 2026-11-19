const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const SCRYPT={N:32768,r:8,p:1,maxmem:64*1024*1024};
async function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){
  if(typeof password!=='string'||password.length<8||password.length>128)throw new Error('A palavra-passe deve ter entre 8 e 128 caracteres.');
  const hash=await scrypt(password,Buffer.from(salt,'hex'),64,SCRYPT);return {salt,hash:hash.toString('hex')};
}
async function checkPassword(password,stored){
  if(typeof password!=='string'||password.length>128||!stored||!/^[a-f0-9]{32}$/.test(stored.salt||'')||!/^[a-f0-9]{128}$/.test(stored.hash||''))return false;
  const result=await scrypt(password,Buffer.from(stored.salt,'hex'),64,SCRYPT);return crypto.timingSafeEqual(result,Buffer.from(stored.hash,'hex'));
}
function sessionToken(){return crypto.randomBytes(32).toString('hex');}
function tokenHash(token){return crypto.createHash('sha256').update(token).digest('hex');}
function parseCookie(header,name){for(const part of String(header||'').split(';')){const at=part.indexOf('=');if(at<0)continue;if(part.slice(0,at).trim()===name){try{return decodeURIComponent(part.slice(at+1).trim());}catch{return '';}}}return '';}
const allowedKinds=new Set(['profile','salary','overtime','days-off','schedule','punches','cards','welcomed','active-route','manual-hours']);
function validStored(kind,value){
  if(!allowedKinds.has(kind)||(value!==null&&typeof value!=='string'))return false;if(value===null)return true;
  if(Buffer.byteLength(value,'utf8')>1024*1024)return false;if(kind==='welcomed')return value==='yes'||value==='no';
  let parsed;try{parsed=JSON.parse(value);}catch{return false;}
  if(kind==='manual-hours')return !!parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.keys(parsed).length<=10000&&Object.entries(parsed).every(([date,minutes])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isInteger(minutes)&&minutes>=1&&minutes<=1440);
  if(kind==='salary')return typeof parsed==='number'&&Number.isFinite(parsed)&&parsed>0&&parsed<=10000000;
  if(['overtime','schedule','punches'].includes(kind))return Array.isArray(parsed)&&parsed.length<=10000;
  return !!parsed&&typeof parsed==='object'&&!Array.isArray(parsed);
}
function detectImage(buffer){if(!Buffer.isBuffer(buffer))return null;if(buffer.length>=3&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return 'jpeg';if(buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';if(buffer.length>=6&&['GIF87a','GIF89a'].includes(buffer.subarray(0,6).toString('ascii')))return 'gif';if(buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP')return 'webp';return null;}
function emailOf(v){return String(v||'').trim().toLowerCase();}
function isEmail(v){return typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
module.exports={hashPassword,checkPassword,sessionToken,tokenHash,parseCookie,allowedKinds,validStored,detectImage,emailOf,isEmail};
