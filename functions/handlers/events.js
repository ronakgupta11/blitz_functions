const {db} = require("../util/admin")


exports.getAllEvents = (request,response)=>{
    db.collection("events").get().then(
        data=>{
            let events = []
            data.forEach(doc=>{
                events.push({
                    id:doc.id,

                    ...doc.data()})
            })

            return response.json(events)
        }
    )
    .catch(err=>{
        console.error(err);
        res.status(500).json({ error: err.code });
    })

}
exports.getOneEvent = (request,response)=>{
let eventData = {}
    db.doc(`/events/${request.params.eventId}`).get().then(
        
        doc=>{
            if (!doc.exists) {
                return res.status(404).json({ error: 'event  not found' });
            }
            eventData = doc.data();
      eventData.eventId = doc.id;
            return response.json(eventData)
        }
    )
    .catch(err=>{
        console.error(err);
        response.status(500).json({ error: err.code });
    })

}

exports.postEvent = (request,response)=>{
    
    const newEvent = {
        date:request.body.date,
        cat:request.body.cat,
        name:request.body.name
    }
    db.collection("events").add(newEvent).then(doc =>
        response.json({messgae:`document wit ${doc.id} created successfully`})
    )
    .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})

}

exports.registerEvent = (req,res)=>{

}

exports.getRegisteredTeams = (req,res)=>{

}