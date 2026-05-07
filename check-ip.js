/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

https.get('https://api.ipify.org?format=json', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Detected Public IP:', JSON.parse(data).ip);
    });
}).on('error', (err) => {
    console.error('Failed to fetch IP:', err);
});
