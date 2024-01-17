

const express = require("express")
const cors = require("cors")
const app = express()
const {setGlobalOptions} = require("firebase-functions/v2");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer")

require("dotenv").config()

setGlobalOptions({maxInstances: 10});
app.use(cors());

const {SENDER_EMAIL,SENDER_PASS} = process.env
const {getAllEvents,
    getOneEvent,
    postEvent,
    registerEvent,
    deleteEvent,
    updateEvent

} = require("./handlers/events")

const {getRegisteredTeams, deleteTeam, verifyTeam} = require("./handlers/teams")

const { signup, login,forgotPassword, getAuthenticatedUser, ca ,sendVerification, updateUser, getAllCa, getAllUsers} = require("./handlers/users");
const {registerTeam, joinTeam, uploadImage} = require("./handlers/teams")



const {onRequest} = require("firebase-functions/v2/https");
const FbAuth = require("./util/FbAuth");
const { getOnePass, postPass,getAllPasses, purchasePass } = require("./handlers/passes");
const onlyAdmin = require("./util/onlyAdmin");
const { db } = require("./util/admin");





exports.sendMail = onDocumentCreated("users/{userId}",(e)=>{
  
const transporter = nodemailer.createTransport({
  host:"smtp.gmail.com",
  port :465,
  secure:true,
  auth:{
    user:SENDER_EMAIL,
    pass:SENDER_PASS
  }
})


  const userEmail = e.data.data().email
  const username  = e.data.data().name
  const blitzId = e.data.data().blitzId
  const message = `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blitzschlag 2024 Registration Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
  
      .container {
        max-width: 600px;
        margin: 20px auto;
      }
  
      .header {
        background-color: #007BFF;
        color: #fff;
        padding: 10px;
        text-align: center;
      }
  
      .content {
        padding: 20px;
      }
  .head{
      margin-top: 10px;
      margin-bottom: 10px;
  }
      .footer {
        background-color: #f8f9fa;
        padding: 10px;
        text-align: center;
      }
      .foot{
          margin-top: 10px;
          font-size:12px ;
          opacity: 0.8;
      }
  
      .blitz-container{
          margin-top: 10px;
          margin-bottom: 10px;
      }
      .blitzId{
          font-weight: 700;
      }
    </style>
  </head>
  
  <body>
    <div class="container">
      <div class="header">
        <h2>Blitzschlag 2024 Registration Confirmation</h2>
      </div>
  
      <div class="content">
  
        <div class="head">Dear ${username},</div>
  
        <p>Greetings from the Cultural Society, MNIT Jaipur!</p>
        <p>We're thrilled to inform you that your registration for the festival has been successfully processed, and you're officially part of our electrifying journey!</p>
  
        <p class="blitzId-container">Your BlitzId is<span class="blitzId"> ${blitzId}</span></p>
  
        <p>Get ready to embark on a PADHARO MHARE FEST odyssey, where creativity takes center stage and talent reigns supreme. Brace yourself for 50+ exciting events, competitions, and performances spread across diverse categories, all meticulously crafted to ignite your passions and unleash your inner artist.</p>
        <p>We can't wait to welcome you to Blitzschlag 2024 and witness your talent unfold! Let the countdown begin!</p>
  
  
  <div class="foot">
      <p>For latest updates, follow our social media handles:</p>
      <p>Instagram: @blitz_mnit</p>
      <p>With vibrant anticipation,</p>
      <p>Team Blitzschlag</p>
  </div>
      
      </div>
  
    </div>
  </body>
  
  </html>
  
  `

  const messageMNIT = `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blitzschlag 2024 Registration Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
  
      .container {
        max-width: 600px;
        margin: 20px auto;
      }
  
      .header {
        background-color: #007BFF;
        color: #fff;
        padding: 10px;
        text-align: center;
      }
  
      .content {
        padding: 20px;
      }
  .head{
      margin-top: 10px;
      margin-bottom: 10px;
  }
      .footer {
        background-color: #f8f9fa;
        padding: 10px;
        text-align: center;
      }
      .foot{
          margin-top: 10px;
          font-size:12px ;
          opacity: 0.8;
      }
  
      .blitz-container{
          margin-top: 10px;
          margin-bottom: 10px;
      }
      .blitzId{
          font-weight: 700;
      }
    </style>
  </head>
  
  <body>
    <div class="container">
      <div class="header">
        <h2>Blitzschlag 2024 Registration Confirmation</h2>
      </div>
  
      <div class="content">
  
        <div class="head">Dear ${username},</div>
  
        <p>Greetings from the Cultural Society, MNIT Jaipur!</p>
        <p>We're thrilled to inform you that your registration for the festival has been successfully processed, and you're officially part of our electrifying journey!</p>
  
        <p class="blitzId-container">Your BlitzId is<span class="blitzId"> ${blitzId}</span></p>
  
        <p>Get ready to embark on a PADHARO MHARE FEST odyssey, where creativity takes center stage and talent reigns supreme. Brace yourself for 50+ exciting events, competitions, and performances spread across diverse categories, all meticulously crafted to ignite your passions and unleash your inner artist.</p>
        <p>We can't wait to welcome you to Blitzschlag 2024 and witness your talent unfold! Let the countdown begin!</p>
        <p>For Pronite Access register on Slick App :<a href="https://play.google.com/store/apps/details?id=com.slickapp">Download</a></p>
  
  
  <div class="foot">
      <p>For latest updates, follow our social media handles:</p>
      <p>Instagram: @blitz_mnit</p>
      <p>With vibrant anticipation,</p>
      <p>Team Blitzschlag</p>
  </div>
      
      </div>
  
    </div>
  </body>
  
  </html>
  
  `
  const mailOptions = {
    from:SENDER_EMAIL,
    to :userEmail,
    subject : "Welcome to Blitzschlag 2024! Your Cultural Odyssey Awaits!",
    html:(userEmail.slice(-10) === "mnit.ac.in")?messageMNIT:message
  }
  transporter.sendMail(mailOptions).then(res => console.log("sent Mail ")).catch(e => console.log(e))
})


exports.sendCaMail = onDocumentCreated("ca/{userId}",(e)=>{
  
  const transporter = nodemailer.createTransport({
    host:"smtp.gmail.com",
    port :465,
    secure:true,
    auth:{
      user:SENDER_EMAIL,
      pass:SENDER_PASS
    }
  })
  
  
    const userEmail = e.data.data().email
    const username  = e.data.data().name
    const message = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blitzschlag 2024 Campus Ambassador Registration Confirmation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }
    
        .container {
          max-width: 600px;
          margin: 20px auto;
        }
    
    
        .content {
          padding: 20px;
        }
    .head{
        margin-top: 10px;
        margin-bottom: 10px;
    }
    
        .foot{
            margin-top: 10px;
            font-size:12px ;
            opacity: 0.8;
        }
    
    
      </style>
    </head>
    
    <body>
      <div class="container">
    
        <div class="content">
    
          <div class="head">Dear ${username},</div>
    
       <p> Greetings from the Cultural Society, MNIT Jaipur!</p>
       <p> We're thrilled to inform you that your registration for the festival as a campus ambassador has been successfully processed, and you're officially part of our electrifying journey!<br />
        Kindly share your blitz ID as referral code to new Users, you can track number of users registered using your referral code from your profile section. <br />
    
    <div class="foot">
        <p>For latest updates, follow our social media handles:</p>
        <p>Instagram: @blitz_mnit</p>
        <p>With vibrant anticipation,</p>
        <p>Team Blitzschlag</p>
    </div>
        
        </div>
    
      </div>
    </body>
    
    </html>
    `
    const mailOptions = {
      from:SENDER_EMAIL,
      to :userEmail,
      subject : " Get ready to be the face of your institute at BLITZSCHLAG!",
      html:message
    }
    transporter.sendMail(mailOptions).then(res => console.log("sent Mail ")).catch(e => console.log(e))
  })


exports.sendTeamCreateMail = onDocumentCreated("team/{teamId}",(e)=>{
  
  const transporter = nodemailer.createTransport({
    host:"smtp.gmail.com",
    port :465,
    secure:true,
    auth:{
      user:SENDER_EMAIL,
      pass:SENDER_PASS
    }
  })
  // const teamleaderId = e.data.data().teamLeaderId
  const teamName = e.data.data().teamName
  const userEmail = e.data.data().leaderEmail     
  const message = `hey you have succesfully created ${teamName} for blitzschlag, you team status is currently unVerified. you can manage your team in your profile page.`
  const mailOptions = {
        from:SENDER_EMAIL,
        to :userEmail,
        subject : "Team Registered for Blitzschlag",
        html:message
      }
  transporter.sendMail(mailOptions)
    
  .then(res => console.log("sent Mail ")).catch(e => console.log(e))
  })
  
  
// event Routes
app.get("/events",getAllEvents)
app.get("/events/:eventId",getOneEvent)
app.post("/createEvent",onlyAdmin,postEvent)
app.post("/updateEvent/:eventId",onlyAdmin, updateEvent)
app.post("/deleteEvent/:eventId",onlyAdmin,deleteEvent)



app.post("/events/register/:eventId/:teamId",FbAuth,registerTeam)
app.post("/events/join/:eventId/:teamId",FbAuth,joinTeam)
app.post("/events/proof/:teamId",FbAuth,uploadImage)
app.get("/teams/:name",getRegisteredTeams)
app.get("/deleteTeam/:teamId",onlyAdmin,deleteTeam)
app.get("/verifyTeam/:teamId",onlyAdmin,verifyTeam)

//pass
app.get("/passes",getAllPasses)
app.get("/passes/:passId",getOnePass)
app.post("/createPass",onlyAdmin,postPass)
app.post("/buyPass/:passId",FbAuth,purchasePass)


//users
app.post("/signup",signup)
app.post("/login",login)
app.post("/resetPassword",forgotPassword)
app.get("/user",FbAuth,getAuthenticatedUser)
app.post("/updateUser/:userId",FbAuth,updateUser)
app.post("/verifyMail",FbAuth,sendVerification)
app.post("/ca",ca)
app.get("/getCa",onlyAdmin,getAllCa)
app.get("/getUsers",onlyAdmin,getAllUsers)


exports.api =  onRequest(app)

