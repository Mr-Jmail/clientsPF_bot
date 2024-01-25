const path = require("path")
const fs = require("fs")
const remindersFilePath = path.join(__dirname, "reminders.json")
const date = require("date-fns");

async function startReplier(ctx) {
    ctx.reply("Команды:\n/addReminder - добавить напоминание\n/getReminders - просмотреть календарь напоминаний")
}

async function addReminderToDb(text, date, status) {
    const dates = await getReminders()
    const reminder = { id: dates.nextId, text, status }
    if(!dates[date]) dates[date]= []
    dates[date].push(reminder)
    dates.nextId += 1
    fs.writeFileSync(remindersFilePath, JSON.stringify(dates, null, 4), "utf-8")
}

async function getReminders(date = "all") {
    const dates = JSON.parse(fs.readFileSync(remindersFilePath, "utf-8"))
    if(date == "all") return dates
    return dates?.[date] || []
}

async function getReminderById(id) {
    const dates = await getReminders()
    console.log(dates)
    // var dates = [{d: "d"}]
    for (const date in dates) {
        if(date == "nextId") continue
        const reminder = dates[date].find(reminder => reminder.id == id)
        if(reminder) return {id: reminder.id, text: reminder.text, status: reminder.status, date}
    }
    return 
}

async function editReminder(id, key, newValue) {
    const dates = await getReminders()
    const reminder = await getReminderById(id)
    dates[reminder?.date]?.map(reminder => {
        if(reminder.id == id) reminder[key] = newValue
    })
    fs.writeFileSync(remindersFilePath, JSON.stringify(dates, null, 4), "utf-8")
}

async function findNextDate(dayOfMonth, startDate = new Date()) {
    const firstDayOfMonth = date.startOfMonth(startDate);
    let nextDate = date.set(firstDayOfMonth, { date: dayOfMonth, hours: 12, minutes: 0 });
    if (!date.isAfter(nextDate, startDate)) nextDate = date.addMonths(nextDate, 1);
    return date.format(nextDate, 'dd.MM.yyyy');
}

module.exports = { startReplier, addReminderToDb, getReminders, getReminderById, editReminder, findNextDate }