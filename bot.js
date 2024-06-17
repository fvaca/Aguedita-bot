import { createRequire } from 'module';
const require = createRequire(import.meta.url);


import MistralClient from '@mistralai/mistralai';
const TelegramBot = require('node-telegram-bot-api');
const fs = require('node:fs/promises');
require('dotenv').config();

// Load environment variables
const token = process.env.TELEGRAM_TOKEN;
const mistralaiApiKey = process.env.MISTRAL_API_KEY;
const LOGFILE = process.env.LOGFILE;

// Create a new Telegram bot
const bot = new TelegramBot(token, { polling: true });

// Initialize MistarlAI API
const client = new MistralClient(mistralaiApiKey);

async function exists(f) {
    try {
      await fs.promises.stat(f);
      return true;
    } catch {
      return false;
    }
}

async function logOutput(msg) {
    try {
      const content = msg;
      if (exists(LOGFILE)) {
        await fs.appendFile(LOGFILE, content);
      } else {
        await fs.writeFile(LOGFILE, content);
      }      
      console.log(content);
    } catch (err) {
      console.log(err);
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userText = msg.text;
    const Author = msg.from.first_name;
    const chatType = msg.chat.type;
    const chatTitle = msg.chat.title;
    const messagetime = msg.date;
    const botName = (await bot.getMe()).username;
    const botFirstName = "nesimo";
   
    const regex_botname = RegExp('@'+botName, 'i')
    const regex_firstname = RegExp(botFirstName.toLowerCase(), 'i')
    logOutput("bot name: " + botName + "Name: "+ botFirstName);  
    logOutput(messagetime + " | ID: " + chatId +  " | Type: " + chatType + " | Author: " + Author +" | Message: " + userText);
   
    // Check if the message is not empty and the bot is mentioned
    let isGroup = chatType == "group" || chatType == "supergroup";
    const shallReply = userText && ((chatType == "private" && userText) 
    || (isGroup && regex_botname.exec(userText.trim())) 
    || (isGroup && regex_firstname.exec(userText.trim().toLowerCase())));
   if (shallReply) {
      try {
        
        const gptResponse = await client.chat({
            model: 'mistral-tiny',
            messages: [{role: 'user', content: userText},
                      {role: 'system', content: 'Te llamas Aguedita y eres una asistente útil que responde como una viejita venezolana.'}],
          });
        
        
        const replyText = gptResponse.choices[0].message.content.trim();
        logOutput(messagetime + " | ID: " + chatId +  " | Type" + chatType + " | Author: " + Author +" | Message: " + replyText);

        await bot.sendMessage(chatId, replyText);


      } catch (error) {
        logOutput(error);
        await bot.sendMessage(chatId, "Sorry, I couldn't process your request.");
      }
    }

  });