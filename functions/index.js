

const express = require("express")
const cors = require("cors")
// const functions = require("firebase-functions/v2")

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
    getRegisteredTeams

} = require("./handlers/events")


const { signup, login,forgotPassword, getAuthenticatedUser, ca ,sendVerification} = require("./handlers/users");




const {onRequest} = require("firebase-functions/v2/https");
const FbAuth = require("./util/FbAuth");
const { getOnePass, postPass,getAllPasses, purchasePass } = require("./handlers/passes");
const onlyAdmin = require("./util/onlyAdmin");





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
  const message = `hey ${username},you have succesfully signed usp for blitz`
  const mailOptions = {
    from:SENDER_EMAIL,
    to :userEmail,
    subject : "Signup Confirmation Blitz",
    html:message
  }
  transporter.sendMail(mailOptions).then(res => console.log("sent Mail ")).catch(e => console.log(e))
})



// event Routes
app.get("/events",getAllEvents)
app.get("/events/:eventId",getOneEvent)
app.post("/createEvent",onlyAdmin,postEvent)
app.post("/registerEvent/:eventId",FbAuth,registerEvent)
app.get("/registered/:eventId",onlyAdmin,getRegisteredTeams)
// app.get("/eventNotif/:eventId",getNotification)


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
app.post("/verifyMail",FbAuth,sendVerification)
app.post("/ca",onlyAdmin,ca)


exports.api =  onRequest(app)

