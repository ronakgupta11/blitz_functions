const {db,admin} = require("../util/admin")
const { uuid } = require("uuidv4");

exports.registerTeam = (req, response) => {
    const teamId = req.params.teamId;
    const eventId = req.params.eventId;
    const blitzId = req.user.blitzId;
  
    // Check if the user has already formed a team for the same event
    db.collection("users")
      .doc(blitzId)
      .get()
      .then((userDoc) => {
        const userEventData = userDoc.data().registeredEvents || [];
  
        // Check if the user has already formed a team for the same event
        const hasFormedTeamForEvent = userEventData.some(
          (event) => event.eventId === eventId && event.teamId
        );
  
        if (hasFormedTeamForEvent) {
          // If the user has already formed a team for the same event, return an error response
          return response.status(400).json({teamName:"Already registered for Event"});
        }
        
  
        // Proceed with registering the team
        const teamDetails = {
          teamName: req.body.teamName,
          teamSize : req.body.teamSize,
          teamId: teamId,
          members: [blitzId],
          teamLeaderId:blitzId,
          eventId: eventId,
          teamStatus: "unVerified",
          leaderEmail:req.user.email
        };
  
        return db.collection("teams").doc(teamId).set(teamDetails);
      })
      .then((doc) => {
        return db.doc(`/events/${eventId}`).get();
      })
      .then((eventDoc) => {
        const data = eventDoc.data();
        const currentTeams = data.registeredTeams || [];
        currentTeams.push(teamId);
  
        return db.doc(`/events/${eventId}`).update({
          registeredTeams: currentTeams,
        });
      })
      .then(() => {
        return db.doc(`/users/${blitzId}`).get();
      })
      .then((userDoc) => {
        const data = userDoc.data();
        const registeredEvents = data.registeredEvents || [];
        registeredEvents.push({ eventId, teamId });
  
        return db.doc(`/users/${blitzId}`).update({
          registeredEvents: registeredEvents,
        });
      })
      .then(() => {
        response.status(200).json({ message: "Registered team successfully." });
      })
      .catch((err) => {
        console.error(err);
        if (err.message) {
          response.status(400).json({ error: err.message });
        } else {
          response.status(500).json({ error: "Something went wrong while creating the team." });
        }
      });
  };
  
exports.joinTeam = (req,res)=>{
const eventId = req.params.eventid
    const teamId = req.params.teamId;
    const blitzId = req.user.blitzId
    db.doc(`/teams/${teamId}`).get().then(

        d=>{
            if(!d.exists){
                return res.status(402).json({general:"Team not found"})
            }
            const data = d.data()
            const Currentmembers = data.members || []
            if(Currentmembers.includes(blitzId)){
                return res.status(402).json({teamCode:"You have already joined team"})
            }
            Currentmembers.push(blitzId)
            return db.doc(`/teams/${teamId}`).update({
                members:Currentmembers
            })
        }
    ).then(d=>{
        return db.doc(`/users/${blitzId}`).get()
    }).then(
        d=>{
            const data = d.data()
            const registeredEvents = data.registeredEvents || []
            registeredEvents.push({eventId,teamId})

            return db.doc(`/users/${blitzId}`).update({
                registeredEvents:registeredEvents
            })
        }
    ).then(
        d=>
        res.status(200).json({message:"success"})
    ).catch(err=>

       { console.log(err)
        res.status(500).json({err:err})})



}


exports.addMember = (req,res)=>{
    const teamId = req.body.teamId;
    const userId = req.body.userId;

    db.doc(`/team/${teamId}`).get().then(
        d =>{
            const data = d.data()
            const members = data.members || []
            members.push(userId)
            return db.doc(`/team/${teamId}`).update({
                members:members
            })
        }
    ).then(
        d=>{
            return db.doc(`/users/${userId}`).get()
        }

    ).then(
        d=>{
            const data = d.data()
            const registeredEvents = data.registeredEvents || []
            registeredEvents.push(teamId)

            return db.doc(`/users/${userId}`).update({
                registeredEvents:registeredEvents
            })
        }
    ).then(
        d=>
        res.status(200).json({message:"success"})
    ).catch(err=>

       { console.log(err)
        res.status(500).json({err:err})})






}



exports.getTeam = (request,response)=>{
let teamData = {}

db.doc(`/teams/${request.params.teamId}`).get().then(
        
        doc=>{
            if (!doc.exists) {
                return res.status(404).json({ error: 'team  not found' });
            }
            teamData  = doc.data()
            return doc.data().members

            
        }
    ).then(
        data=>{
             teamData.membersData  = []
            data.forEach(mem => {

                db.collection("users").doc(mem).get().then(
                    d=>{
                        teamData.membersData.push(d.data())
                    }
                )
            });
            return response.json(teamData)
        }
    )
    .catch(err=>{
        console.error(err);
        response.status(500).json({ error: err.code });
    })

}


exports.getRegisteredTeams = (req, res) => {
  const event = req.params.name;
  const teamAndUserData = [];

  // Assuming db is your Firestore instance
  db.collection("events")
    .where("name", "==", event)
    .get()
    .then(eventDocs => {
      if (eventDocs.empty) {
        console.error("Event document not found");
        return res.status(404).json({ error: "Event not found" });
      }

      const eventData = eventDocs.docs[0].data();
      const teams = eventData.registeredTeams || [];

      const teamPromises = teams.map(team => {
        console.log("Fetching team:", team);
        // Fetch team details from "teams" collection
        return db.collection("teams").doc(team).get();
      });

      return Promise.all(teamPromises)
        .then(teamsData => {
          const userPromises = teamsData.map(teamDoc => {
            if (teamDoc.exists && teamDoc.data().teamLeaderId) {
              const teamData = teamDoc.data();
              console.log("Fetched team data:", teamData);
              return db.collection("users").doc(teamData.teamLeaderId).get();
            } else {
              return Promise.resolve(null); // Resolve with null for teams without valid data
            }
          });

          return Promise.all(userPromises).then(userData => {
            return { teamsData, userData };
          });
        });
    })
    .then(({ teamsData, userData }) => {
      const teamsAndUsersData = teamsData.map((teamDoc, index) => {
        const teamData = teamDoc.data(); // Access team data at the corresponding index
        const userDoc = userData[index];
        
        if (userDoc && userDoc.exists) {
          const userData = userDoc.data();
          console.log("Fetched user data:", userData);

          // Combine team and team leader details
          return { team: teamData, teamLeader: userData };
        }
        return null; // Skip teams without valid user data
      }).filter(item => item !== null); // Remove null entries

      console.log("All teams and user details fetched successfully");
      return res.json(teamsAndUsersData);
    })
    .catch(error => {
      console.error("Error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    });
};



// Upload a profile image for user
exports.uploadImage = (req, res) => {
    try{

    
const Busboy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
    const teamId = req.params.teamId;
    const blitzId = req.user.blitzId
    let imageUrl;
  
    const busboy = Busboy({ headers: req.headers });
  
    let imageToBeUploaded = {};
    let imageFileName;
    // String for image token
    let generatedToken = uuid();
  
    busboy.on("file", (fieldname, file, filename) => {
        let mimetype = filename.mimeType
        
        const encoding = filename.encoding
      console.log("--------log-----", filename);
    //   if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
    //     console.log("---------------errr--------------")
    //     return res.status(400).json({ error: "Wrong file type submitted" });
    //   }
      // my.image.png => ['my', 'image', 'png']
      const imageExtension = filename.filename.split(".")[filename.filename.split(".").length - 1];
      // 32756238461724837.png
      imageFileName = `${Math.round(
        Math.random() * 1000000000000
      ).toString()}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filepath, mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on("finish", () => {
      admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype,
              //Generate token to be appended to imageUrl
              firebaseStorageDownloadTokens: generatedToken,
            },
          },
        })
        .then(()=>{
return  db.doc(`/teams/${teamId}`).get()
        })

        .then((d) => {
            if(!d.exists){
                return res.status(402).json({general:"Team not found"})
            }
          imageUrl = `https://firebasestorage.googleapis.com/v0/b/blitzstarter-d367e.appspot.com/o/${imageFileName}?alt=media&token=${generatedToken}`;

            const data = d.data()
            let currentPayments = data.payments || []
            currentPayments.push({blitzId,imageUrl})
          return db.doc(`/teams/${teamId}`).update({payments:currentPayments});
        })
        .then(() => {
          return res.json({ message: "image uploaded successfully" });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: "something went wrong" });
        });
    });
    busboy.end(req.rawBody);
}
catch(err){
    console.log(err)
    
}
  };


exports.deleteTeam = (request,response)=>{
    const teamId = request.params.teamId
    
    db.collection("teams").doc(teamId).delete().then(doc =>
        response.json({messgae:`document  deleted successfully`})
    )
    .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})}


exports.verifyTeam = (request,response)=>{
  const teamId = request.params.teamId
  
  db.collection("teams").doc(teamId).update({teamStatus:"verified"}).then(doc =>
      response.json({messgae:`document  Verified successfully`})
  )
  .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})}