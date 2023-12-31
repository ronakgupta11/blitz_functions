const {db,admin} = require("./admin")


module.exports  = (req,res,next)=>{
    let role;
    let idToken ;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")){
        idToken = req.headers.authorization.split("Bearer ")[1]
        // console.log(idToken)

    }
    else{
        console.log("Not authorised")
        return res.status(403).json({error: "unauthorized"})
    }

    admin.auth().verifyIdToken(idToken).then(
        decodedToken =>{
            // console.log()
            req.user = decodedToken
            return db.collection("users").where("userId" ,"==",req.user.uid ).limit(1).get()
        }
    )
    .then(
        data=>{
           role = data.docs[0].data().role
           if(role === "admin"){

               return next()
            }
            else{
                return res.status(403).json({error:"only admin access"})
            }
        }
    ).catch(
        err=>{
            console.log("error whike verifying toekn",err)
            return res.status(400).json({err})

        }
    )


}