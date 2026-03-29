const fs = require('fs');
const path = require('path');

const elitePath = path.join(process.cwd(), 'haykala', 'elite.json');
const devPath = path.join(process.cwd(), 'haykala', 'developer.json');

let eliteNumbers = [];
let lastDevData = {};

const loadEliteNumbers = () => {
  if (fs.existsSync(elitePath)) {
    eliteNumbers = JSON.parse(fs.readFileSync(elitePath, 'utf-8'));
  } else {
    eliteNumbers = [];
  }
};

const saveEliteNumbers = () => {
  fs.writeFileSync(elitePath, JSON.stringify(eliteNumbers, null, 2));
};

const extractPureNumber = (jid) => jid.toString().replace(/[@:].*/g, '');

const isElite = (number) => {
  const pureNumber = extractPureNumber(number);
  return eliteNumbers.includes(pureNumber);
};

const addEliteNumber = (number) => {
  const pureNumber = extractPureNumber(number);
  if (!eliteNumbers.includes(pureNumber)) {
    eliteNumbers.push(pureNumber);
    saveEliteNumbers();
  }
};

const removeEliteNumber = (number) => {
  const pureNumber = extractPureNumber(number);
  eliteNumbers = eliteNumbers.filter(n => n !== pureNumber);
  saveEliteNumbers();
};

loadEliteNumbers();

const syncWithDevelopers = () => {
  if (!fs.existsSync(devPath)) return;

  let devData;
  try {
    devData = JSON.parse(fs.readFileSync(devPath, 'utf-8'));
  } catch {
    return;
  }

  const allDevLEDs = [
    ...(devData.founder || []),
    ...(devData.ownerbot || []),
    ...(devData.developers || [])
  ];

  const devNumbers = allDevLEDs.map(extractPureNumber);

  devNumbers.forEach(n => {
    if (!eliteNumbers.includes(n)) addEliteNumber(n);
  });

  lastDevData = devData;
};

fs.watchFile(devPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtimeMs !== prev.mtimeMs) {
    syncWithDevelopers();
  }
});

syncWithDevelopers();

module.exports = {
  eliteNumbers,
  isElite,
  addEliteNumber,
  removeEliteNumber,
  extractPureNumber
};