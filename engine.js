const util = require('./util');
const database = require('./database');

const readline = require('readline');
const fs = require('fs');

const calculatePoints = inputFileName => new Promise((resolve) => {
  let points = 0;
  let lineCounterOut = 0;

  const rdOut = readline.createInterface({
    input: fs.createReadStream(`./output/${inputFileName}.out`),
  });

  rdOut.on('line', (lineOut) => {
    const vehicle = new util.Vehicle();
    const ridesIndexes = lineOut.split(' ').splice(1).filter(string => string).map(string => +string);
    ridesIndexes.forEach((rideIndex) => {
      const ride = database.rides[rideIndex];
      const distance = util.calculateRideDistance(ride);
      if (util.canRideBeCompletedOnTimeByVehicle(vehicle, ride)) {
        points += distance;
      }
      if (util.willVehicleArriveOnTimeForBonus(vehicle, ride)) {
        points += database.bonus;
      }
      const timeItWillTake = util.calculateTimeToCompleteRideForVehicle(vehicle, ride);
      vehicle.posX = ride.endPosX;
      vehicle.posY = ride.endPosY;
      vehicle.step += timeItWillTake;
    });
    if (lineCounterOut === database.vehiclesCount - 1) {
      resolve(points);
    }
    lineCounterOut++;
  });
});

module.exports = {
  calculatePoints,
};
