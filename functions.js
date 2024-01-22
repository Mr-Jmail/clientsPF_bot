const path = require("path")
const fs = require("fs")
const remindersFilePath = path.join(__dirname, "reminders.json")

async function startReplier(ctx) {
    ctx.reply("Команды:\n/addReminder - добавить напоминание\n/getReminders - просмотреть календарь напоминаний")
}

async function addReminderToDb(text, date, status) {
    const dates = await getReminders()
    const reminder = { text, status }
    if(!dates[date]) dates[date]= []
    dates[date].push(reminder)
    fs.writeFileSync(remindersFilePath, JSON.stringify(dates, null, 4), "utf-8")
}

async function getReminders(date = "all") {
    const dates = JSON.parse(fs.readFileSync(remindersFilePath, "utf-8"))
    if(date == "all") return dates
    return dates?.[date] || []
}

module.exports = { startReplier, addReminderToDb, getReminders }