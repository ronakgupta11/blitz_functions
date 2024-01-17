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
        category:request.body.category,
        name:request.body.name,
        time:request.body.time,
        venue:request.body.venue,
        image:request.body.image,
        rulebook:request.body.rulebook,
        banner:request.body.banner,
        desc:request.body.desc,
        oneliner:request.body.oneliner,
        prize:request.body.prize,
        maxParticipants:request.body.maxParticipants,
        clubName:request.body.clubName
    }
    db.collection("events").add(newEvent).then(doc =>
        response.json({messgae:`document with ${doc.id} created successfully`})
    )
    .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})

}

exports.updateEvent = (request,response)=>{
    const eventId = request.params.eventId
    console.log(request.body)
    
    db.collection("events").doc(eventId).update(request.body).then(doc =>
        response.json({messgae:`document with updated successfully`})
    )
    .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})

}
exports.deleteEvent = (request,response)=>{
    const eventId = request.params.eventId
    console.log(request.body)
    
    db.collection("events").doc(eventId).delete().then(doc =>
        response.json({messgae:`document  deleted successfully`})
    )
    .catch(err=>{response.status(500).json({error:"something went wrong"})
console.log(err)
})}