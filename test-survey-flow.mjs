import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.warn("DNS config warning:", e);
}

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function runLocalTests() {
    console.log('====================================================');
    console.log('🚀 RUNNING INEXRA LOCALHOST SURVEY FLOW TEST SUITE');
    console.log('====================================================\n');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not set in environment!');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;

    // Create an auth token cookie for testing protected dashboard endpoints
    const authToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId().toString(), email: 'admin@inexraresearch.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    const authHeaders = {
        'Cookie': `token=${authToken}`,
        'Content-Type': 'application/json'
    };

    // 1. Setup Test Project & Test Supplier
    const testProjectId = new mongoose.Types.ObjectId();
    const testSupplierId = new mongoose.Types.ObjectId();
    const testSlug = `test-supplier-${Date.now()}`;

    console.log('\n[SETUP] Creating test Project & Supplier in MongoDB...');
    await db.collection('projects').insertOne({
        _id: testProjectId,
        projectName: `Localhost Test Project ${Date.now()}`,
        status: 'Running',
        requiredCompletes: 100,
        completes: 0,
        disqualify: 0,
        quotaFull: 0,
        securityTerm: 0,
        hits: 0,
        surveyLink: 'https://client-survey.com/start?rid=[uid]&tx=[sessionId]',
        surveyTestLink: 'https://client-survey.com/test?rid=[uid]&tx=[sessionId]',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.collection('suppliers').insertOne({
        _id: testSupplierId,
        projectId: testProjectId,
        supplierName: 'Test Supplier Local',
        trackingSlug: testSlug,
        status: 'active',
        completes: 0,
        disqualified: 0,
        quotaFull: 0,
        securityTerm: 0,
        hits: 0,
        cpi: 1.5,
        originalLink: 'https://client-survey.com/start?rid=[uid]&tx=[sessionId]',
        completeUrl: 'https://supplier.com/complete?uid=[uid]&tx=[sessionId]',
        terminateUrl: 'https://supplier.com/terminate?uid=[uid]&tx=[sessionId]',
        quotaFullUrl: 'https://supplier.com/quota?uid=[uid]&tx=[sessionId]',
        securityUrl: 'https://supplier.com/security?uid=[uid]&tx=[sessionId]',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    console.log(`✅ Test Project created: ${testProjectId}`);
    console.log(`✅ Test Supplier created: ${testSupplierId} (slug: ${testSlug})`);

    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`   ✅ PASS: ${message}`);
            passedTests++;
        } else {
            console.error(`   ❌ FAIL: ${message}`);
            failedTests++;
        }
    }

    try {
        // -------------------------------------------------------------
        // TEST 1: Survey Start Pipeline (/api/survey-start)
        // -------------------------------------------------------------
        console.log('\n--- TEST 1: Survey Start Pipeline (/api/survey-start) ---');
        const uid1 = `USER_DQ_${Date.now()}`;
        const startRes = await fetch(
            `${BASE_URL}/api/survey-start?pid=${testProjectId}&sid=${testSupplierId}&uid=${uid1}&format=json`,
            { redirect: 'manual' }
        );

        console.log(`   Survey-start HTTP status: ${startRes.status}`);
        const startData = await startRes.json();
        console.log('   Survey-start JSON response:', startData);

        assert(startRes.status === 200, 'Survey-start (format=json) returns HTTP 200');
        assert(startData.success === true, 'Survey-start returns success: true');
        assert(startData.redirectUrl && startData.redirectUrl.includes(`rid=${encodeURIComponent(uid1)}`), 'Redirect URL contains interpolated uid');

        // Verify session created in MongoDB
        const session1 = await db.collection('sessions').findOne({
            projectId: testProjectId,
            respondentUid: uid1,
        });

        assert(session1 !== null, 'Session record created in MongoDB');
        assert(session1?.status === 'started', 'Session initial status is "started"');
        const sessionId1 = session1?.sessionId;
        console.log(`   Created Session ID: ${sessionId1}`);

        // -------------------------------------------------------------
        // TEST 2: Disqualify Callback & Status Tracking
        // -------------------------------------------------------------
        console.log('\n--- TEST 2: Disqualify Callback (/api/survey-callback) ---');
        const dqCallbackRes = await fetch(
            `${BASE_URL}/api/survey-callback?status=disqualify&uid=${uid1}&sessionId=${sessionId1}&pid=${testProjectId}`
        );
        const dqData = await dqCallbackRes.json();
        console.log('   Callback response:', dqData);

        assert(dqCallbackRes.status === 200, 'Callback returns HTTP 200');
        assert(dqData.success === true, 'Callback returns success: true');
        assert(dqData.session?.status === 'disqualified', 'Session status normalized to "disqualified"');

        // Check MongoDB Session
        const updatedSession1 = await db.collection('sessions').findOne({ sessionId: sessionId1 });
        assert(updatedSession1?.status === 'disqualified', 'MongoDB Session status updated to "disqualified"');

        // Check MongoDB Project counters
        const projAfterDq = await db.collection('projects').findOne({ _id: testProjectId });
        assert(projAfterDq?.disqualify === 1, `Project disqualify counter is 1 (actual: ${projAfterDq?.disqualify})`);

        // Check MongoDB Supplier counters
        const suppAfterDq = await db.collection('suppliers').findOne({ _id: testSupplierId });
        assert(suppAfterDq?.disqualified === 1, `Supplier disqualified counter is 1 (actual: ${suppAfterDq?.disqualified})`);

        // -------------------------------------------------------------
        // TEST 3: Final-Status Guard (Anti-Duplicate Check)
        // -------------------------------------------------------------
        console.log('\n--- TEST 3: Final-Status Guard (Anti-Duplicate Check) ---');
        // Try calling complete on the same already disqualified session
        const overwriteRes = await fetch(
            `${BASE_URL}/api/survey-callback?status=complete&uid=${uid1}&sessionId=${sessionId1}&pid=${testProjectId}`
        );
        const overwriteData = await overwriteRes.json();
        console.log('   Second callback attempt response:', overwriteData);

        assert(overwriteData.duplicate === true, 'Recognized as duplicate');
        assert(overwriteData.session?.status === 'disqualified', 'Status retained as "disqualified" without overwriting');

        // Counters must NOT have changed
        const projAfterDup = await db.collection('projects').findOne({ _id: testProjectId });
        assert(projAfterDup?.completes === 0, 'Completes counter remained 0 (not falsely incremented)');
        assert(projAfterDup?.disqualify === 1, 'Disqualify counter remained 1 (not double counted)');

        // -------------------------------------------------------------
        // TEST 4: Complete Callback
        // -------------------------------------------------------------
        console.log('\n--- TEST 4: Complete Callback Flow ---');
        const uid2 = `USER_CMP_${Date.now()}`;
        const start2Res = await fetch(`${BASE_URL}/api/survey-start?pid=${testProjectId}&sid=${testSupplierId}&uid=${uid2}&format=json`);
        const start2Data = await start2Res.json();
        const sessionId2 = start2Data.sessionId;

        const cmpRes = await fetch(
            `${BASE_URL}/api/survey-callback?status=complete&uid=${uid2}&sessionId=${sessionId2}&pid=${testProjectId}`
        );
        const cmpData = await cmpRes.json();
        console.log('   Complete callback response:', cmpData);

        assert(cmpData.session?.status === 'complete', 'Callback normalized to "complete"');
        const projAfterCmp = await db.collection('projects').findOne({ _id: testProjectId });
        assert(projAfterCmp?.completes === 1, `Project completes counter is 1 (actual: ${projAfterCmp?.completes})`);
        const suppAfterCmp = await db.collection('suppliers').findOne({ _id: testSupplierId });
        assert(suppAfterCmp?.completes === 1, `Supplier completes counter is 1 (actual: ${suppAfterCmp?.completes})`);

        // -------------------------------------------------------------
        // TEST 5: Quota Full Callback
        // -------------------------------------------------------------
        console.log('\n--- TEST 5: Quota Full Callback Flow ---');
        const uid3 = `USER_QF_${Date.now()}`;
        const start3Res = await fetch(`${BASE_URL}/api/survey-start?pid=${testProjectId}&sid=${testSupplierId}&uid=${uid3}&format=json`);
        const start3Data = await start3Res.json();
        const sessionId3 = start3Data.sessionId;

        const qfRes = await fetch(
            `${BASE_URL}/api/survey-callback?status=quota_full&uid=${uid3}&sessionId=${sessionId3}&pid=${testProjectId}`
        );
        const qfData = await qfRes.json();
        console.log('   Quota Full callback response:', qfData);

        assert(qfData.session?.status === 'quota_full', 'Callback normalized to "quota_full"');
        const projAfterQf = await db.collection('projects').findOne({ _id: testProjectId });
        assert(projAfterQf?.quotaFull === 1, `Project quotaFull counter is 1 (actual: ${projAfterQf?.quotaFull})`);
        const suppAfterQf = await db.collection('suppliers').findOne({ _id: testSupplierId });
        assert(suppAfterQf?.quotaFull === 1, `Supplier quotaFull counter is 1 (actual: ${suppAfterQf?.quotaFull})`);

        // -------------------------------------------------------------
        // TEST 6: Security Terminate Callback
        // -------------------------------------------------------------
        console.log('\n--- TEST 6: Security Terminate Callback Flow ---');
        const uid4 = `USER_SEC_${Date.now()}`;
        const start4Res = await fetch(`${BASE_URL}/api/survey-start?pid=${testProjectId}&sid=${testSupplierId}&uid=${uid4}&format=json`);
        const start4Data = await start4Res.json();
        const sessionId4 = start4Data.sessionId;

        const secRes = await fetch(
            `${BASE_URL}/api/survey-callback?status=security_terminate&uid=${uid4}&sessionId=${sessionId4}&pid=${testProjectId}`
        );
        const secData = await secRes.json();
        console.log('   Security callback response:', secData);

        assert(secData.session?.status === 'security', 'Callback normalized to "security"');
        const projAfterSec = await db.collection('projects').findOne({ _id: testProjectId });
        assert(projAfterSec?.securityTerm === 1, `Project securityTerm counter is 1 (actual: ${projAfterSec?.securityTerm})`);
        const suppAfterSec = await db.collection('suppliers').findOne({ _id: testSupplierId });
        assert(suppAfterSec?.securityTerm === 1, `Supplier securityTerm counter is 1 (actual: ${suppAfterSec?.securityTerm})`);

        // -------------------------------------------------------------
        // TEST 7: Real-Time Live Stats API (/api/projects/[id]/live-stats)
        // -------------------------------------------------------------
        console.log('\n--- TEST 7: Real-Time Live Stats API ---');
        const liveStatsRes = await fetch(`${BASE_URL}/api/projects/${testProjectId}/live-stats`, {
            headers: authHeaders
        });
        const liveStats = await liveStatsRes.json();
        console.log('   Live Stats response:', JSON.stringify(liveStats, null, 2));

        assert(liveStats.success === true, 'Live stats API returned success: true');
        assert(liveStats.project?.hits === 4, `Project hits is 4 (actual: ${liveStats.project?.hits})`);
        assert(liveStats.project?.complete === 1, `Completes is 1 (actual: ${liveStats.project?.complete})`);
        assert(liveStats.project?.disqualified === 1, `Disqualified is 1 (actual: ${liveStats.project?.disqualified})`);
        assert(liveStats.project?.quota_full === 1, `Quota full is 1 (actual: ${liveStats.project?.quota_full})`);
        assert(liveStats.project?.security === 1, `Security is 1 (actual: ${liveStats.project?.security})`);

        // -------------------------------------------------------------
        // TEST 8: Sync Counters API (/api/projects/[id]/sync-counters)
        // -------------------------------------------------------------
        console.log('\n--- TEST 8: Sync Counters API ---');
        // Artificially tamper project counters to 0 to verify sync repairs them accurately
        await db.collection('projects').updateOne(
            { _id: testProjectId },
            { $set: { completes: 0, disqualify: 0, quotaFull: 0, securityTerm: 0 } }
        );

        const syncRes = await fetch(`${BASE_URL}/api/projects/${testProjectId}/sync-counters`, {
            method: 'POST',
            headers: authHeaders
        });
        const syncData = await syncRes.json();
        console.log('   Sync Counters response:', JSON.stringify(syncData, null, 2));

        assert(syncData.success === true, 'Sync counters returned success: true');
        assert(syncData.project?.completes === 1, `Project completes resynced to 1 (actual: ${syncData.project?.completes})`);
        assert(syncData.project?.disqualify === 1, `Project disqualify resynced to 1 (actual: ${syncData.project?.disqualify})`);
        assert(syncData.project?.quotaFull === 1, `Project quotaFull resynced to 1 (actual: ${syncData.project?.quotaFull})`);
        assert(syncData.project?.securityTerm === 1, `Project securityTerm resynced to 1 (actual: ${syncData.project?.securityTerm})`);

        // -------------------------------------------------------------
        // TEST 9: Client Redirect Page Branding & Content
        // -------------------------------------------------------------
        console.log('\n--- TEST 9: Client Redirect Page Branding ---');
        const redirectPageRes = await fetch(`${BASE_URL}/client-redirect-url?status=disqualified&uid=TEST_USER_999`);
        const html = await redirectPageRes.text();

        assert(redirectPageRes.status === 200, 'Redirect page returns HTTP 200');
        assert(html.includes('INEXRA RESEARCH'), 'Redirect page contains "INEXRA RESEARCH"');
        assert(html.includes('&amp; ANALYTICS') || html.includes('& ANALYTICS'), 'Redirect page contains "& ANALYTICS"');
        assert(
            html.includes('PROJECT DISQUALIFY') || html.includes('disqualified') || html.includes('Disqualified'),
            'Redirect page shows terminate/disqualify messaging'
        );

        // Test Complete redirect page branding
        const completePageRes = await fetch(`${BASE_URL}/client-redirect-url?status=complete&uid=TEST_USER_CMP`);
        const completeHtml = await completePageRes.text();
        assert(completeHtml.includes('INEXRA RESEARCH'), 'Complete redirect page contains "INEXRA RESEARCH"');
        assert(completeHtml.includes('&amp; ANALYTICS') || completeHtml.includes('& ANALYTICS'), 'Complete redirect page contains "& ANALYTICS"');
        assert(
            completeHtml.includes('PROJECT COMPLETE') || completeHtml.includes('complete') || completeHtml.includes('Complete'),
            'Complete redirect page shows complete messaging'
        );

    } finally {
        // Cleanup test data
        console.log('\n[CLEANUP] Removing test Project, Supplier, and Sessions from DB...');
        await db.collection('projects').deleteOne({ _id: testProjectId });
        await db.collection('suppliers').deleteOne({ _id: testSupplierId });
        await db.collection('sessions').deleteMany({ projectId: testProjectId });
        console.log('✅ Cleanup complete');
        await mongoose.disconnect();
    }

    console.log('\n====================================================');
    console.log(`📊 FINAL TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('====================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runLocalTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
