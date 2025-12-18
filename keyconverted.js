const fs = require('fs');
const key = fs.readFileSync('./blood-donation-center-b0020-firebase-adminsdk-fbsvc-9724785245.json', 'utf8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64)