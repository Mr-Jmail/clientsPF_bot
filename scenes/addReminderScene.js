const { Scenes } = require("telegraf");
const date = require("date-fns");
const { addReminderToDb, startReplier } = require("../functions");
const cancelButton = {text: "Отмена", callback_data: "cancel"}

// ПРОТЕСТИТЬ

module.exports = new Scenes.WizardScene("addReminderScene", 
    ctx => {
        ctx.scene.session.state = { textOfReminder: "", dateOfReminder: "", statusOfReminder: "" }
        ctx.reply("Введите текст напоминания (ссылку на сайт)", {reply_markup: {inline_keyboard: [[cancelButton]]}})
        return ctx.wizard.next()
    },
    async ctx => {
        if(ctx?.callbackQuery?.data == "cancel") return await cancelEditting(ctx)
        if(!ctx?.message?.text) return await ctx.reply("Пожалуйста дайте ответ текстом")
        ctx.scene.session.state.textOfReminder = ctx.message.text
        await ctx.replyWithHTML("Когда отправить первое напоминание?\n<i>(формат: дд.мм.гггг)</i>", {reply_markup: {inline_keyboard: [[cancelButton]]}})
        return ctx.wizard.next()
    },
    async ctx => {
        if(ctx?.callbackQuery?.data == "cancel") return await cancelEditting(ctx)
        if(!ctx?.message?.text) return await ctx.reply("Пожалуйста дайте ответ текстом")
        const error = isValidDate(ctx.message.text)?.error
        if(error) return await ctx.reply(error)
        ctx.scene.session.state.dateOfReminder = ctx.message.text
        await ctx.reply("Какой статус у заказа?", {reply_markup: {inline_keyboard: [[{text: "В работе", callback_data: "В работе"}], [{text: "На паузе", callback_data: "На паузе"}], [cancelButton]]}})
        return ctx.wizard.next()
    }, 
    async ctx => {
        if(ctx?.callbackQuery?.data == "cancel") return await cancelEditting(ctx)
        if(!["В работе", "На паузе"].includes(ctx?.callbackQuery?.data)) return await ctx.reply("Выберите одну из кнопок выше")
        ctx.scene.session.state.statusOfReminder = ctx.callbackQuery.data
        const { textOfReminder, dateOfReminder, statusOfReminder } = ctx.scene.session.state
        await ctx.reply(`Отлично, напоминание с текстом "${textOfReminder}" и статусом "${statusOfReminder}" придет ${dateOfReminder} в 12:00`)
        await ctx.reply("Перебрасываю в стартовое меню")
        await addReminderToDb(textOfReminder, dateOfReminder, statusOfReminder)
        await startReplier(ctx)
        return ctx.scene.leave()
    }
)
  
function isValidDate(dateString) {
    const inputDate = date.parse(dateString, 'dd.MM.yyyy', new Date());
    if (!date.isValid(inputDate)) return { error: "Введите пожалуйста дату в корректном формате" }
    if(!date.isAfter(inputDate, new Date())) return { error: "Дата должна быть больше текущей" };
    return true;
}

async function cancelEditting(ctx) {
    await ctx.reply("Добавление нового закза отменено, перебрасываю в главное меню")
    await ctx.scene.leave()
    await startReplier(ctx)
}

