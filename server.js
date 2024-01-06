const express = require("express");
const app = express();
const https = require("https");
const axios = require("axios");
const { Telegraf } = require("telegraf");
const dotenv=require("dotenv")
const moment = require("moment");
dotenv.config({path:"./config/config.env"})

const bot = new Telegraf(process.env.BOT_TOKEN);

const channelUsername = "@mbbsrussiaadmission"; // Use '@' for channels with usernames
// const channelId = '1001338130732'; // Use the actual chat ID for private channels

// Get Messages From KTU Website
const instance = axios.create({
  baseURL: "https://api.ktu.edu.in/ktu-web-portal-api/anon", // Set a base URL for all requests
  timeout: 10000, // Set a timeout for requests in milliseconds
  headers: {
    "Content-Type": "application/json",
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore SSL certificate verification (not recommended for production)
  }),
});
var notifyid = "2375";

async function sendMessage(messageText,sendQuery,filename,ktu) {
    try {
      // Send the message to the channel
      bot.telegram.sendMessage(channelUsername, messageText, {
        parse_mode: "Markdown",
      });
      console.log("New Notification Found , Message Sent");

      //Send Attachment
      const pdfdata = await getAttachmentData(sendQuery);
      const pdfToSend = Buffer.from(pdfdata, "base64");
      if (pdfToSend) {
        await bot.telegram.sendDocument(channelUsername, {
          source: pdfToSend,
          filename: filename,
        });
        console.log("Attatchment Sent");
      }

     
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  }

  //Function For Getting Attatchment Data
  async function getAttachmentData(sendQuery) {
    try {
      const response = await instance.post("/getAttachment", sendQuery);
      return response.data;
    } catch (error) {
      console.error(
        "Error: Error While Getting Attachment",
        error.message
      );
      throw error; // Re-throw the error to propagate it further if needed
    }
  }


setInterval(function () {

  let postData = { number: 0, searchText: "MCA", size: 1 };

  instance
    .post("/announcemnts", postData)
    //   .get("http://localhost:3000/ktu")
    .then((response) => {
      //    console.log(response.data.content[0]);
      //    console.log(response.data.message.content[0]) //Testing
      //    let ktu=response.data.message.content[0];

      let ktu = response.data.content[0];

      //Checking with Variable
      if (notifyid != ktu.id) 
      {
        
        //Formatting Date
        const inputDate = moment(ktu.announcementDate);
        const formattedDate = inputDate.format("DD-MM-YYYY");

        //Get Attatchment
        // console.log(ktu.attachmentList[0].encryptId);
        let attachmentid = ktu.attachmentList[0].encryptId;
        let filename = ktu.attachmentList[0].attachmentName;
        let sendQuery = { encryptId: attachmentid };
        
        // Your message content
        const messageText = `
    *KTU MCA Community* \n\n\
    Date of Posting - *${formattedDate}* \n\n \
    ${ktu.subject} \n\n
    ${ktu.message} \n\n \
    ---------------------------------------------------------------------- \n \
    \nConnect with us on:\n
    📌 Group:  t.me/ktustudentsmca \n\
    📌 Channel:t.me/keralamcastudents\n\n`;

    // --------------------------------------------------------------------------
    sendMessage(messageText,sendQuery,filename,ktu);
    notifyid = ktu.id;
   } 
   else
   {
     console.log("Id Exist Notification already posted");
   }
    })
    .catch((error) => {
      console.error("Error: Error While Requesting Resource", error.message);
    });
}, 10000);

bot.launch();
