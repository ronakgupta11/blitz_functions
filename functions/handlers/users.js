// const {auth,createUserWithEmailAndPassword} = require("../util/client")
const {admin,db} = require("../util/admin")
const config = require("../util/config");


const {initializeApp} = require("firebase/app")
const {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification} = require("firebase/auth")
const firebaseApp=initializeApp(config)
const auth = getAuth(firebaseApp)

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
        };
        return db.doc(`/users/${userId}`).set(userCredentials);
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

//   // Add user details
//   exports.addUserDetails = (req, res) => {
//     let userDetails = reduceUserDetails(req.body);
  
//     db.doc(`/users/${req.user.handle}`)
//       .update(userDetails)
//       .then(() => {
//         return res.json({ message: "Details added successfully" });
//       })
//       .catch((err) => {
//         console.error(err);
//         return res.status(500).json({ error: err.code });
//       });
//   };
//   // Get any user's details
//   exports.getUserDetails = (req, res) => {
//     let userData = {};
//     db.doc(`/users/${req.params.handle}`)
//       .get()
//       .then((doc) => {
//         if (doc.exists) {
//           userData.user = doc.data();
//           return db
//             .collection("screams")
//             .where("userHandle", "==", req.params.handle)
//             .orderBy("createdAt", "desc")
//             .get();
//         } else {
//           return res.status(404).json({ errror: "User not found" });
//         }
//       })
//       .then((data) => {
//         userData.screams = [];
//         data.forEach((doc) => {
//           userData.screams.push({
//             body: doc.data().body,
//             createdAt: doc.data().createdAt,
//             userHandle: doc.data().userHandle,
//             userImage: doc.data().userImage,
//             likeCount: doc.data().likeCount,
//             commentCount: doc.data().commentCount,
//             screamId: doc.id,
//           });
//         });
//         return res.json(userData);
//       })
//       .catch((err) => {
//         console.error(err);
//         return res.status(500).json({ error: err.code });
//       });
//   };




  // Get own user details
  exports.getAuthenticatedUser = (req, res) => {

    let userData = {};
    // console.log("user",req.user)
    db.doc(`/users/${req.user.uid}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          userData.credentials = doc.data();
          console.log(doc.data())
          userEvents = doc.data().registeredEvents
          return userEvents
        }
      })
      .then((data) => {
        console.log(data)
        userData.registeredEvents = [];
        data.forEach((doc) => {
        db.collection("events").doc(doc).get().then(
            d=>{
                userData.registeredEvents.push(d.data())
            }
        );

        });

        return res.json(userData);
      })
      


      .catch((err) => {
        // console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };