'use strict';

const TRIAL_MS=15*24*60*60*1000;
function validDate(value){const date=new Date(value);return Number.isFinite(date.getTime())?date:null;}
function addMonth(value){const date=validDate(value);if(!date)throw Error('Data inválida.');const year=date.getUTCFullYear(),month=date.getUTCMonth(),day=date.getUTCDate();const last=new Date(Date.UTC(year,month+2,0)).getUTCDate();date.setUTCDate(1);date.setUTCMonth(month+1);date.setUTCDate(Math.min(day,last));return date;}
function createTrial(now=new Date()){const start=validDate(now);if(!start)throw Error('Data inválida.');return {plan:'trial',status:'active',payment:'not_required',startedAt:start,endsAt:new Date(start.getTime()+TRIAL_MS)};}
function createPending(now=new Date()){const start=validDate(now);if(!start)throw Error('Data inválida.');return {plan:'monthly',status:'pending',payment:'pending',requestedAt:start};}
function createMonthly(now=new Date()){const start=validDate(now);if(!start)throw Error('Data inválida.');return {plan:'monthly',status:'active',payment:'paid',startedAt:start,endsAt:addMonth(start)};}
function createUnlimited(now=new Date()){const start=validDate(now);if(!start)throw Error('Data inválida.');return {plan:'unlimited',status:'active',payment:'not_required',startedAt:start,endsAt:null};}
function effectiveStatus(subscription,now=new Date()){if(!subscription)return 'active';if(subscription.status!=='active')return subscription.status;const end=subscription.endsAt&&validDate(subscription.endsAt);if(subscription.endsAt&&!end)return 'expired';return end&&end<=new Date(now)?'expired':'active';}
module.exports={TRIAL_MS,addMonth,createTrial,createPending,createMonthly,createUnlimited,effectiveStatus};
