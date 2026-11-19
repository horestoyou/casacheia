'use strict';
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Atlantic/Azores',year:'numeric',month:'2-digit',day:'2-digit'});
function dayAt(value){const p=Object.fromEntries(formatter.formatToParts(new Date(value)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
function parse(rows,kind,fallback){try{const value=rows.find(x=>x.kind===kind)?.value;return value==null?fallback:JSON.parse(value);}catch{return fallback;}}
function summarize(rows){const punches=parse(rows,'punches',[]),manual=parse(rows,'manual-hours',{}),extra=parse(rows,'overtime',[]),salary=parse(rows,'salary',null),days=new Map();let open=null,issues=0;
  function day(date){if(!days.has(date))days.set(date,{date,minutes:0,manualMinutes:0,extraHours:0,extraValue:0});return days.get(date);}
  if(Array.isArray(punches))for(const p of punches){if(!p||!Number.isFinite(Date.parse(p.at))){issues++;continue;}if(p.type==='entry'||p.type==='return'){if(open)issues++;open=p;}else if(p.type==='lunch'||p.type==='exit'){if(!open){issues++;continue;}const diff=Date.parse(p.at)-Date.parse(open.at);if(diff<0){issues++;open=null;continue;}day(dayAt(open.at)).minutes+=diff/60000;open=null;}else issues++;}else issues++;
  if(open)issues++;
  if(manual&&typeof manual==='object'&&!Array.isArray(manual))for(const [date,minutes] of Object.entries(manual)){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(minutes)||minutes<1||minutes>1440){issues++;continue;}const d=day(date);d.minutes+=minutes;d.manualMinutes+=minutes;}else issues++;
  if(Array.isArray(extra))for(const item of extra){if(!item||!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||!Number.isFinite(item.hours)||!Number.isFinite(item.total)){issues++;continue;}const d=day(item.date);d.extraHours+=item.hours;d.extraValue+=item.total;}else issues++;
  const salaryValue=Number.isFinite(salary)&&salary>0?salary:null;
  const result=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({...d,baseEstimate:salaryValue===null?null:d.minutes/60*salaryValue/176}));
  return {salary:salaryValue,days:result,issues};
}
module.exports={summarize};
