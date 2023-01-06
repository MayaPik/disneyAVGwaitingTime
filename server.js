const Themeparks = require("themeparks");
const express = require('express');
const { date } = require("faker/lib/locales/az");
const app = express();

const db = require('knex')({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'mayapik',
        password: 'nthvnthv1',
        database: 'Disneyland',
        port: 5432
    }
});
// configure where SQLite DB sits
// optional - will be created in node working directory if not configured
// Themeparks.Settings.Cache = __dirname + "/themeparks.db";
app.set("db", db);
const startTime = 9; 
const endTime = 22; 

// access a specific park
//  Create this *ONCE* and re-use this object for the lifetime of your application
//  re-creating this every time you require access is very slow, and will fetch data repeatedly for no purpose
const DisneyWorldMagicKingdom = new Themeparks.Parks.DisneylandParisMagicKingdom();
DisneyWorldMagicKingdom.geto
// Access wait times by Promise
const CheckWaitTimes = () => {
    DisneyWorldMagicKingdom.GetWaitTimes().then((rideTimes) => {
      rideTimes.filter((_, index) => index > 32).forEach((ride, index) => {
        db('disneyapi')
          .returning(['id', 'name', 'wait', 'status', 'time', 'hour'])
          .insert({ id: index, name: ride.name, wait: ride.waitTime, status: ride.status, time: new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }),hour: new Date().toLocaleTimeString([], {  hour: "2-digit", minute: "2-digit" , timeZone: 'Europe/Paris', hour12: false })
        })
          .then((disneyapi) => console.log(disneyapi))
          .catch((error) => console.error(error));
      });
      app.get('/', (req, res) => {
        db
        .select().from('disneyapi')
        .then(disneyapi =>
                res.send(disneyapi)
        )
    })
    }).catch((error) => {
      console.error(error);
    }).then(() => {
      setTimeout(CheckWaitTimes, 1000 * 60 * 5); // refresh every 5 minutes
    });
  };



setInterval(() => {
    const currentTime = Number(new Date().toLocaleTimeString([], {  hour: "2-digit", timeZone: 'Europe/Paris', hour12: false }));
    if (currentTime >= startTime && currentTime < endTime) {
        CheckWaitTimes();
    }
  }, 1000); // check every 1 second
  
app.listen(process.env.POTT || 5001)

// you can also call GetOpeningTimes on themeparks objects to get park opening hours