// const {auth,createUserWithEmailAndPassword} = require("../util/client")
const {admin,db} = require("../util/admin")
const config = require("../util/config");


const {initializeApp} = require("firebase/app")
const {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification} = require("firebase/auth")
const firebaseApp=initializeApp(config)
const auth = getAuth(firebaseApp)
function generateUniqueUserId(name) {
  // Ensure the name is at least 5 characters long
  const truncatedName = name.slice(0, 5);

  // Generate a random 5-character string
  const randomString = Math.random().toString(36).substring(2, 7);

  // Combine the "BLITZ" prefix, truncated name, and random string
  const userId = `BLITZ-${truncatedName.toUpperCase()}-${randomString.toUpperCase()}`;

  return userId;
}

const {
    validateSignupData,
    validateLoginData,
    validateEmail,
    validateCaData
    // reduceUserDetails, 
  } = require("../util/validators");

exports.signup = (req, res) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      name:req.body.name,
      phone: req.body.phone,
      college:req.body.college,
      referalid:req.body.referalid,
    };
  const blitzId = generateUniqueUserId(req.body.name)
    const { valid, errors } = validateSignupData(newUser);
  
    if (!valid) return res.status(400).json(errors);
      

  
    let token, userId;
    createUserWithEmailAndPassword(auth,newUser.email, newUser.password).then((data) => {
        userId = data.user.uid;
        
        return data.user.getIdToken();
      })
      .then((idToken) => {
        token = idToken;
        const userCredentials = {

          email: newUser.email,
          phone:newUser.phone,
          name:newUser.name,
          college:newUser.college,
          referalid:newUser.referalid,
          registeredEvents:[],
          createdAt: new Date().toISOString(),
          role:"user",

          //TODO Append token to imageUrl. Work around just add token from image in storage.
        //   imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
          userId,
          blitzId
        };
        return db.doc(`/users/${blitzId}`).set(userCredentials);
      })
      .then(() => {
        return res.status(201).json({ token });
      })
      .catch((err) => {
        // console.error(err);
        if (err.code === "auth/email-already-in-use") {
          return res.status(400).json({ email: "Email is already is use" });
        } else {
          return res
            .status(500)
            .json({ general: "Something went wrong, please try again" });
        }
      });
  };
  // Log user in
  exports.login = (req, res) => {
    const user = {
      email: req.body.email,
      password: req.body.password,
    };
  
    const { valid, errors } = validateLoginData(user);
  
    if (!valid) return res.status(400).json(errors);
  

      signInWithEmailAndPassword(auth,user.email, user.password)
      .then((data) => {
        return data.user.getIdToken();
      })
      .then((token) => {
        return res.json({ token });
      })
      .catch((err) => {
        // console.error(err);
        // auth/wrong-password
        // auth/user-not-user
        return res
          .status(403)
          .json({ general: "Wrong credentials, please try again" });
      });
  };


  exports.ca = (req, res) => {
    const user = {
      email: req.body.email,
      name: req.body.name,
      phone: req.body.phone,
      college: req.body.college,
    };
  
    const { valid, errors } = validateCaData(user);
  
    if (!valid) return res.status(400).json(errors);
    db.doc(`/ca/${user.email}`).get().then(
      snap=>{
        if(snap.exists){
          return res.status(400).json({email:"email already registered"})
        }
        else{
          
          return db.doc(`/ca/${user.email}`).set(user)


        }})

        .then(() => {
          return res.status(201).json({ success:"uploaded" });
        })
        .catch((err) => {
          // console.error(err);
          if (err.code === "auth/email-already-in-use") {
            return res.status(400).json({ email: "Email is already is use" });
          } else {
            return res
              .status(500)
              .json({ general: "Something went wrong, please try again" });
          }
        });
      
  


    
  };


exports.getAllCa = (request,response)=>{
  console.log("api called")
  db.collection("ca").get().then(
      data=>{
          let cas = []
          data.forEach(doc=>{
              cas.push({
                  id:doc.id,

                  ...doc.data()})
          })

          return response.json(cas)
      }
  )
  .catch(err=>{
      console.error(err);
      response.status(500).json({ error: err.code });
  })

}

exports.getAllUsers = (request,response)=>{
  console.log("api called")
  db.collection("users").get().then(
      data=>{
          let cas = []
          data.forEach(doc=>{
              cas.push({
                  id:doc.id,

                  ...doc.data()})
          })

          return response.json(cas)
      }
  )
  .catch(err=>{
      console.error(err);
      response.status(500).json({ error: err.code });
  })

}
  exports.forgotPassword= (req,res) =>{
    const email = req.body.email
    const { valid, errors } = validateEmail({email});
    if (!valid) return res.status(400).json(errors);

    sendPasswordResetEmail(auth, email)
    .then(() => {
    //  console.log("Password Reset Mail sent")
     return res.status(200).json({message:"Successfully Sent Password Reset Mail"})
    })
    .catch((error) => {

      res.status(500).json({error})
    });
  }



  
  exports.sendVerification= (req,res) =>{

    
    const user = req.user
    console.log(user)

    sendPasswordResetEmail(user)
    .then(() => {
    //  console.log("Password Reset Mail sent")
     return res.status(200).json({message:"Successfully Sent Verification Mail"})
    })
    .catch((error) => {
      console.log(error)

      res.status(500).json({error})
    });
  }





  exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
  
    db.doc(`/users/${req.user.blitzId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          userData.credentials = doc.data();
          const userEvents = doc.data().registeredEvents;
  
          // Check if user has registered events
          if (!userEvents || userEvents.length === 0) {
            // If not, send response with an empty array for registeredEventsData and registeredTeamsData
            userData.registeredEventsData = [];
            userData.registeredTeamsData = [];
            return res.json(userData);
          }
  
          // Create an array of promises to fetch event details and team details for each registered event
          const eventPromises = userEvents.map((event) => {
            const eventId = event.eventId;
            const teamId = event.teamId; // Assuming teamId is part of the registeredEvents data structure
  
            // Fetch event details
            const eventPromise = db.collection("events").doc(eventId).get();
  
            // Fetch team details
            const teamPromise = db.collection("teams").doc(teamId).get();
  
            // Return an object with both promises
            return { eventPromise, teamPromise };
          });
  
          // Resolve all promises
          return Promise.all(eventPromises.map(({ eventPromise, teamPromise }) => {
            // Resolve both promises and return an object with event and team data
            return Promise.all([eventPromise, teamPromise]);
          }));
        } else {
          // User not found
          res.status(403).json({ error: "Not Authorized" });
        }
      })
      .then((results) => {
        // Process event details and team details
        userData.registeredEventsData = results.map(([eventSnapshot, teamSnapshot]) => eventSnapshot.data());
        userData.registeredTeamsData = results.map(([eventSnapshot, teamSnapshot]) => teamSnapshot.data());
  
        return res.json(userData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };
  



  exports.updateUser = (request,response)=>{
    const userId = request.params.userId
    // console.log(request.body)
    
    db.collection("users").doc(userId).update(request.body).then(doc =>
        response.json({messgae:`document with updated successfully`})
    )
    .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})

}