const database = require('./database');

const fs = require('fs');

function Vehicle(index) {
  this.id = index;
  this.posX = 0;
  this.posY = 0;
  this.rides = [];
  this.step = 0;
}

function Ride() {
  this.id = 0;
  this.startPosX = 0;
  this.startPosY = 0;
  this.endPosX = 0;
  this.endPosY = 0;
  this.earliestStart = 0;
  this.latestFinish = 0;
  this.isTaken = false;
}

const calculateDistanceBetweenTwoPoints = (startX, startY, endX, endY) =>
  Math.abs(startX - endX) + Math.abs(startY - endY);

const calculateDistanceFromVehicleToPosition = (vehicle, posX, posY) =>
  calculateDistanceBetweenTwoPoints(vehicle.posX, vehicle.posY, posX, posY);

const calculateDistanceFromVehicleToRideStart = (vehicle, ride) =>
  calculateDistanceFromVehicleToPosition(vehicle, ride.startPosX, ride.startPosY);

const calculateVehicleTimeToWaitForRide = (vehicle, ride) => {
  const distanceToStart = calculateDistanceFromVehicleToRideStart(vehicle, ride);
  const timeToWait = ride.earliestStart - (vehicle.step + distanceToStart);

  return timeToWait <= 0 ? 0 : timeToWait;
};

const calculateRideDistance = ride =>
  calculateDistanceBetweenTwoPoints(ride.startPosX, ride.startPosY, ride.endPosX, ride.endPosY);

const calculateTimeToCompleteRideForVehicle = (vehicle, ride) => {
  const distanceToStart = calculateDistanceFromVehicleToRideStart(vehicle, ride);
  const timeToWait = calculateVehicleTimeToWaitForRide(vehicle, ride);
  const distance = calculateRideDistance(ride);

  return distanceToStart + timeToWait + distance;
};

const willVehicleArriveOnTimeForBonus = (vehicle, ride) =>
  vehicle.step + calculateDistanceFromVehicleToRideStart(vehicle, ride) <= ride.earliestStart;

const canRideBeCompletedOnTimeByVehicle = (vehicle, ride) => {
  const timeItWillTake = calculateTimeToCompleteRideForVehicle(vehicle, ride);
  const endTime = timeItWillTake + vehicle.step;

  return endTime < ride.latestFinish;
};

const sortRideGoodnessObjectsByGoodness = (ride1, ride2) =>
  (ride1.goodness >= ride2.goodness ? 1 : -1);

const assignRideToVehicle = (vehicle, ride) => {
  const timeItWillTake = calculateTimeToCompleteRideForVehicle(vehicle, ride);
  const indexOfRide = ride.id;
  vehicle.posX = ride.endPosX;
  vehicle.posY = ride.endPosY;
  vehicle.rides.push(indexOfRide);
  vehicle.step += timeItWillTake;
  database.rides[indexOfRide].isTaken = true;
  database.totalVehicleSteps += timeItWillTake;
  database.averageVehicleSteps = database.totalVehicleSteps / database.vehiclesCount;
};

const isThereAPossibleRideForVehicle = vehicle =>
  database.rides.filter(ride => !ride.isTaken).some(ride => canRideBeCompletedOnTimeByVehicle(vehicle, ride));

const isThereAVehicleBelowAvgStepsThatCanStillAcceptRide = () =>
  database.vehicles.find(vehicle => vehicle.step <= database.averageVehicleSteps && isThereAPossibleRideForVehicle(vehicle));

const isThereAVehicleThatCanStillAcceptRide = () => {
  const vehicleBelowAvg = isThereAVehicleBelowAvgStepsThatCanStillAcceptRide();
  if (vehicleBelowAvg) {
    return vehicleBelowAvg;
  }

  return database.vehicles.find(vehicle => isThereAPossibleRideForVehicle(vehicle));
};

const calculateHowGoodARideIs = (vehicle, ride) => {
  if (!canRideBeCompletedOnTimeByVehicle(vehicle, ride)) {
    return Number.MIN_VALUE;
  }
  const distanceToStart = calculateDistanceFromVehicleToRideStart(vehicle, ride);
  const timeToWait = calculateVehicleTimeToWaitForRide(vehicle, ride);
  const distance = calculateRideDistance(ride);
  const rideBonus = willVehicleArriveOnTimeForBonus(vehicle, ride) ? database.bonus : 0;

  let weightedTimeItWillTake = (distanceToStart * 2) + (timeToWait * 3);
  let timeUntilEnd = ride.latestFinish - (distanceToStart + distance);
  if (timeUntilEnd === 0) {
    timeUntilEnd = 1;
  }
  if (weightedTimeItWillTake === 0) {
    weightedTimeItWillTake = 1;
  }

  return (distance * (1 + rideBonus)) / (weightedTimeItWillTake * timeUntilEnd);
};

function rideToRideGoodnessObjectForVehicle(ride) {
  if (ride.isTaken) {
    return undefined;
  }
  const goodness = calculateHowGoodARideIs(this, ride);
  return {
    ride,
    goodness,
  };
}

const writeToFile = (path, value) =>
  new Promise(resolve => fs.writeFile(path, value, () => resolve()));

module.exports = {
  Vehicle,
  Ride,
  calculateDistanceBetweenTwoPoints,
  calculateDistanceFromVehicleToPosition,
  calculateDistanceFromVehicleToRideStart,
  calculateVehicleTimeToWaitForRide,
  calculateRideDistance,
  calculateTimeToCompleteRideForVehicle,
  willVehicleArriveOnTimeForBonus,
  canRideBeCompletedOnTimeByVehicle,
  sortRideGoodnessObjectsByGoodness,
  assignRideToVehicle,
  isThereAPossibleRideForVehicle,
  isThereAVehicleBelowAvgStepsThatCanStillAcceptRide,
  isThereAVehicleThatCanStillAcceptRide,
  calculateHowGoodARideIs,
  rideToRideGoodnessObjectForVehicle,
  writeToFile,
};
