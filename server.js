const Themeparks = require("themeparks");
const express = require("express");
const app = express();

const db = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
});

app.set("db", db);

const DisneyWorldMagicKingdom =
  new Themeparks.Parks.DisneylandParisMagicKingdom();

const CheckWaitTimes = () => {
  return DisneyWorldMagicKingdom.GetWaitTimes()
    .then((rideTimes) => {
      const currentHour = Number(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          timeZone: "Europe/Paris",
          hour12: false,
        })
      );
      const currentMinutes = Number(
        new Date().toLocaleTimeString([], {
          minute: "2-digit",
          timeZone: "Europe/Paris",
          hour12: false,
        })
      );
      console.log(currentHour, currentMinutes);
      if (currentHour < 9) {
        return (9 - currentHour) * 60 - currentMinutes;
      }
      if (currentHour >= 22 && currentMinutes > 0) {
        return 9 * 60 + (24 - currentHour) * 60 - currentMinutes;
      }
      if (currentMinutes % 5 !== 0) {
        return (60 - currentMinutes) % 5;
      }
      rideTimes
        .filter((_, index) => index > 32)
        .forEach((ride, index) => {
          db("disneyapi")
            .returning(["id", "name", "wait", "status", "time", "hour"])
            .insert({
              id: index,
              name: ride.name,
              wait:
                ride.status === "Closed" || ride.status === "Down"
                  ? null
                  : ride.waitTime,
              status: ride.status,
              time: new Date().toLocaleString("en-US", {
                timeZone: "Europe/Paris",
              }),
              hour: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Paris",
                hour12: false,
              }),
            })
            .then(() => console.log("Row was added"))
            .catch((error) => console.error(error));
        });
      return 5;
    })
    .catch((error) => {
      console.error(error);
    })
    .then((next) => {
      console.log(`Running next in ${next} minutes`);
      setTimeout(CheckWaitTimes, 1000 * 60 * next);
    });
};

CheckWaitTimes();

app.get("/data", (req, res) => {
  db.select()
    .from("disneyapi")
    .then((disneyapi) => res.send(disneyapi));
});

app.get("/avg", (req, res) => {
  db.select("id")
    .distinct()
    .from("disneyapi")
    .then((results) => {
      const idValues = results.map((row) => row.id);
      let data = {};
      idValues.forEach((id) => {
        db.select("id", "hour", "name")
          .avg("wait as avg_waiting_time")
          .from("disneyapi")
          .where({ id: id })
          .groupBy("id", "hour", "name")
          .orderBy("id", "asc")
          .orderBy("hour", "asc")
          .then((results) => {
            results.forEach((row) => {
              const nonWorking = [
                1, 2, 4, 5, 9, 12, 15, 18, 21, 22, 26, 27, 29, 32, 35, 38, 39,
                40, 41,
              ];
              if (nonWorking.includes(Number(id))) {
                data[(row.id, row.name)] = data[(row.id, row.name)] || {};
                data[(row.id, row.name)] =
                  "The ride is not operating / No queue / No data";
              } else {
                data[(row.id, row.name)] = data[(row.id, row.name)] || {};
                data[(row.id, row.name)][row.hour] =
                  Math.round(Number(row.avg_waiting_time)) || null;
              }
            });

            // send the response after all queries have finished
            if (Object.keys(data).length === idValues.length) {
              res.send(data);
            }
          });
      });
    });
});

app.get("/avg/:number", (req, res) => {
  const nonWorking = [
    1, 2, 4, 5, 9, 12, 15, 18, 21, 22, 26, 27, 29, 32, 35, 38, 39, 40, 41,
  ];
  let data = {};
  let number = req.params.number;
  if (nonWorking.includes(Number(number))) {
    res.send("The ride is not operating / No queue / No data");
  } else {
    db.select("id", "hour", "name")
      .avg("wait as avg_waiting_time")
      .from("disneyapi")
      .where({ id: number })
      .groupBy("id", "hour", "name")
      .orderBy("hour", "asc")
      .then((results) => {
        results.forEach((row) => {
          data[(row.id, row.name)] = data[(row.id, row.name)] || {};
          data[(row.id, row.name)][row.hour] = Math.round(
            Number(row.avg_waiting_time)
          );
        });
        res.json(data);
      });
  }
});

app.listen(process.env.PORT);
