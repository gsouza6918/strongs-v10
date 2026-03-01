const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./temp.json', 'utf8'));

const gkDrillSkills = {};
const row43 = data[43]; // Let's find the row with ANTECIPAÇÃO

let gkRowIndex = -1;
for (let i = 0; i < data.length; i++) {
    if (data[i] && data[i].__EMPTY_10 === 'ANTECIPAÇÃO') {
        gkRowIndex = i;
        break;
    }
}

if (gkRowIndex !== -1) {
    const row1 = data[gkRowIndex];
    const row2 = data[gkRowIndex + 1];
    const row3 = data[gkRowIndex + 2];
    const row4 = data[gkRowIndex + 3];
    const row5 = data[gkRowIndex + 4];

    for (let j = 10; j <= 38; j++) {
        const key = `__EMPTY_${j}`;
        const skills = [];
        if (row1 && row1[key]) skills.push(row1[key]);
        if (row2 && row2[key]) skills.push(row2[key]);
        if (row3 && row3[key]) skills.push(row3[key]);
        if (row4 && row4[key]) skills.push(row4[key]);
        if (row5 && row5[key]) skills.push(row5[key]);
        gkDrillSkills[j - 10] = skills;
    }
}

console.log(JSON.stringify(gkDrillSkills, null, 2));
