const {db} = require("../util/admin")


exports.getAllPasses = (request,response)=>{
    db.collection("passes").get().then(
        data=>{
            let passes = []
            data.forEach(doc=>{
                passes.push({
                    id:doc.id,

                    ...doc.data()})
            })

            return response.json(passes)
        }
    )
    .catch(err=>{
        console.error(err);
        res.status(500).json({ error: err.code });
    })

}


exports.getOnePass = (request,response)=>{
let passData = {}
    db.doc(`/passes/${request.params.passId}`).get().then(
        
        doc=>{
            if (!doc.exists) {
                return res.status(404).json({ error: 'pass  not found' });
            }
            passData = doc.data();
      passData.passId = doc.id;
            return response.json(passData)
        }
    )
    .catch(err=>{
        console.error(err);
        response.status(500).json({ error: err.code });
    })

}

exports.postPass = (request,response)=>{
    
    const newPass = {
        date:request.body.date,
        cat:request.body.cat,
        name:request.body.name
    }
    db.collection("passes").add(newPass).then(doc =>
        response.json({messgae:`document with ${doc.id} created successfully`})
    )
    .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})

}

exports.purchasePass = (req,res)=>{
    
    
}

