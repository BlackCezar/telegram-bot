import TelegramBot from 'node-telegram-bot-api'

var telegramToken = "6607259093:AAEI5rmxG3Ndzta7hUHVKC4A6lBXK663qoE"
var bot = new TelegramBot(telegramToken, {
    polling: true
})
var userConfig = {}

console.log('Bot started')

var questions = [
    'Ваше имя и отчество',
    'Ваш номер телефона',
    'Ваш email',
    'Есть ребенок?' ,
    'Возраст ребенка'
]

var answers = {}

// bot.onText(/\/start/, (msg) => {
//     const chatId = msg.chat.id;
//     console.log('msg', msg)
//     sendQuestion(chatId, 0);
// });


bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (userConfig[chatId]) {
        if (userConfig[chatId].activeQuestion === 1) {
            // Enter Name
            userConfig[chatId].username = msg.text
            sendQuestion(chatId, userConfig[chatId].activeQuestion);
        }
        if (userConfig[chatId].activeQuestion === 2) {
            // Enter Phone
            userConfig[chatId].phone = msg.text
            sendQuestion(chatId, userConfig[chatId].activeQuestion);
        }
        if (userConfig[chatId].activeQuestion === 3) {
            // Enter email

            userConfig[chatId].email = msg.text
            sendQuestion(chatId, userConfig[chatId].activeQuestion,  {
                reply_markup: {
                    keyboard: ['Да', 'Нет'],
                    one_time_keyboard: true,
                    inline_keyboard: [{
                        text: 'Да',

                    }]
                }
            });
        }
        if (userConfig[chatId].activeQuestion === 4) {
            // Enter ahs child

            userConfig[chatId].email = msg.text
            console.log('ON FOR', msg.text)
            sendQuestion(chatId, userConfig[chatId].activeQuestion, {
                reply_markup: {
                    keyboard: ['Да', 'Нет'],
                    one_time_keyboard: true
                }
            });
        }
        userConfig[chatId].activeQuestion++;

    } else {
        userConfig[chatId] = {
            activeQuestion: 1,
            isCompleted: false,
            username: '',
            phone: '',
            hasChildren: false,
        }
        sendQuestion(chatId, 0);
    }
});


function sendQuestion(chatId, questionIndex, options?:  TelegramBot.SendMessageOptions) {
    if (questionIndex < questions.length) {
        bot.sendMessage(chatId, questions[questionIndex]);
    } else {
        const age = parseInt(answers[3]);
        const giftMessage = getGiftMessage(age);
        bot.sendMessage(chatId, `Спасибо за ответы!\n${giftMessage}`, options);
    }
}

function getGiftMessage(age) {
    // Здесь вы можете создать логику для сообщения о подарке в зависимости от возраста ребенка
    // Например, используя switch или if-else
    // В данном случае просто возвращаем заглушку
    return 'Ваш подарок: Заглушка';
}

function saveData() {
    const data = JSON.stringify(answers, null, 2);
    Bun.write('data.json', data)
    // fs.writeFileSync('data.json', data);
}