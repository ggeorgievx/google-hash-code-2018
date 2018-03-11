const solver = require('./solver');
const engine = require('./engine');

let inputFileName;
switch (process.argv[2]) {
  case 'b':
    inputFileName = 'b_should_be_easy';
    break;
  case 'c':
    inputFileName = 'c_no_hurry';
    break;
  case 'd':
    inputFileName = 'd_metropolis';
    break;
  case 'e':
    inputFileName = 'e_high_bonus';
    break;
  default:
    inputFileName = 'a_example';
}

solver.start(inputFileName).then(() => engine.calculatePoints(inputFileName)).then(points => console.log(points));
