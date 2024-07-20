const { CronJob } = require('cron');

const job = new CronJob(
    '* * * * * *', // cronTime
    function () {
        console.log('You will see this message every second');
    }, // onTick
    null, // onComplete
    true, // start
    'America/Los_Angeles', // timeZone
);

console.log('1', job);
