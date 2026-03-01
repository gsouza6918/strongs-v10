const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./temp.json', 'utf8'));

const drills = [];
const drillNames = [];
const drillDifficulties = [];

const row0 = data[0];
const row2 = data[2];

for (let i = 10; i <= 38; i++) {
    const key = `__EMPTY_${i}`;
    if (row2[key]) {
        drillNames.push(row2[key]);
        drillDifficulties.push(row0[key]);
    }
}

const skills = [];
for (let i = 3; i <= 25; i++) {
    const row = data[i];
    if (row && row.__EMPTY_2) {
        const skillName = row.__EMPTY_2;
        const skillDrills = [];
        for (let j = 10; j <= 38; j++) {
            const key = `__EMPTY_${j}`;
            if (row[key] === '•') {
                skillDrills.push(drillNames[j - 10]);
            }
        }
        skills.push({ name: skillName, drills: skillDrills });
    }
}

console.log(JSON.stringify({ drills: drillNames, difficulties: drillDifficulties, skills }, null, 2));
