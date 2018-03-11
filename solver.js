const util = require('./util');
const database = require('./database');

const readline = require('readline');
const fs = require('fs');

const start = inputFileName => new Promise((resolve) => {
  let lineCounterIn = 0;

  const rd = readline.createInterface({
    input: fs.createReadStream(`./input/${inputFileName}.in`),
  });

  rd.on('line', (line) => {
    if (lineCounterIn === 0) {
      const params = line.split(' ').map(string => +string);
      [, , database.vehiclesCount, database.ridesCount, database.bonus] = params;
      database.vehicles = new Array(database.vehiclesCount).fill(undefined).map((element, index) => new util.Vehicle(index));
    }
    if (lineCounterIn > 0 && lineCounterIn <= database.ridesCount) {
      const newRide = new util.Ride();
      const params = line.split(' ').map(string => +string);
      [newRide.startPosX, newRide.startPosY, newRide.endPosX, newRide.endPosY, newRide.earliestStart, newRide.latestFinish] = params;
      newRide.id = lineCounterIn - 1;
      database.rides.push(newRide);

      if (lineCounterIn === database.ridesCount) {
        let vehicleToAssign = util.isThereAVehicleThatCanStillAcceptRide();
        while (vehicleToAssign) {
          let rideGoodnessObjectArray = [];
          rideGoodnessObjectArray = database.rides.filter(ride => !ride.isTaken).map(util.rideToRideGoodnessObjectForVehicle, vehicleToAssign);
          rideGoodnessObjectArray = rideGoodnessObjectArray.sort(util.sortRideGoodnessObjectsByGoodness).reverse();

          util.assignRideToVehicle(vehicleToAssign, rideGoodnessObjectArray[0].ride);

          vehicleToAssign = util.isThereAVehicleThatCanStillAcceptRide();
        }

        const fileContent = database.vehicles.reduce((temp, vehicle) =>
          `${temp}${vehicle.rides.length} ${vehicle.rides.join(' ')}\n`, '');
        util.writeToFile(`./output/${inputFileName}.out`, fileContent).then(() => resolve());
      }
    }
    lineCounterIn++;
  });
});

module.exports = {
  start,
};
