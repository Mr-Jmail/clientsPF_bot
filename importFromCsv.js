const path = require("path")
const fs = require("fs")
const csvPath = path.join(__dirname, "x.csv")
const csv = require('fast-csv');
const { findNextDate, addReminderToDb } = require("./functions");

const fileContents = fs.readFileSync(csvPath, 'utf-8');
const rows = []

csv
.parseString(fileContents, { headers: true, delimiter: ';' })
.on('data', async row => {
    if(row["Срок"].length < 3 || row["Сайт"].length < 4) return 
    var site = row["Сайт"].trim()
    var date = row["Срок"].trim()
    var match = date.match(/\d+/)
    if(!match) return
    var day = match[0]
    var status = row["Статус запуска"].trim()
    rows.push({site, day, status})
})
.on('end', async () => {
    await saveAllToBd(rows).then(() => console.log('CSV файл успешно прочитан.'))
});

async function saveAllToBd(rows) {
    for (var row of rows) {
        var date = await findNextDate(row.day)
        var status = ["ПАУЗА", ""].includes(row.status) ? "На паузе" : "В работе"
        await addReminderToDb(row.site, date, status)
    }
}
