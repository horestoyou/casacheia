'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {addMonth,createTrial,createMonthly,createPending,effectiveStatus}=require('../subscriptions');
test('A trial ends after 15 days, while existing accounts retain access',()=>{const s=createTrial('2026-11-01T12:00:00Z');assert.equal(s.endsAt.toISOString(),'2026-11-16T12:00:00.000Z');assert.equal(effectiveStatus(s,'2026-11-16T11:59:59Z'),'active');assert.equal(effectiveStatus(s,'2026-11-16T12:00:00Z'),'expired');assert.equal(effectiveStatus(null),'active');});
test('A paid month clamps end of month and pending requests do not activate access',()=>{assert.equal(addMonth('2027-01-31T12:00:00Z').toISOString(),'2027-02-28T12:00:00.000Z');assert.equal(createMonthly('2028-01-31T12:00:00Z').endsAt.toISOString(),'2028-02-29T12:00:00.000Z');assert.equal(effectiveStatus(createPending('2026-11-01T00:00:00Z')),'pending');});
