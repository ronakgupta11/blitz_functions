const { db, admin } = require("../util/admin");

const { uuid } = require("uuidv4");

exports.getAllPasses = (request, response) => {
  db.collection("passes")
    .get()
    .then((data) => {
      let passes = [];
      data.forEach((doc) => {
        passes.push({
          id: doc.id,

          ...doc.data(),
        });
      });

      return response.json(passes);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.getOnePass = (request, response) => {
  let passData = {};
  db.doc(`/passes/${request.params.passId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "pass  not found" });
      }
      passData = doc.data();
      passData.passId = doc.id;
      return response.json(passData);
    })
    .catch((err) => {
      console.error(err);
      response.status(500).json({ error: err.code });
    });
};

exports.postPass = (request, response) => {
  const newPass = {
    date: request.body.date,
    cat: request.body.cat,
    name: request.body.name,
  };
  db.collection("passes")
    .add(newPass)
    .then((doc) =>
      response.json({ messgae: `document with ${doc.id} created successfully` })
    )
    .catch((err) => {
      response.status(500).json({ error: "something went wrong" });
      console.log(err);
    });
};

// Upload a profile image for user
exports.purchasePass = (req, res) => {
  try {
    const Busboy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
    const passId = req.params.passId;
    const blitzId = req.user.blitzId;
    let imageUrl;

    const busboy = Busboy({ headers: req.headers });

    let imageToBeUploaded = {};
    let imageFileName;
    // String for image token
    let generatedToken = uuid();

    busboy.on("file", (fieldname, file, filename) => {
      let mimetype = filename.mimeType;

      //   if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      //     console.log("---------------errr--------------")
      //     return res.status(400).json({ error: "Wrong file type submitted" });
      //   }
      // my.image.png => ['my', 'image', 'png']
      const imageExtension =
        filename.filename.split(".")[filename.filename.split(".").length - 1];
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
        .then(() => {
          imageUrl = `https://firebasestorage.googleapis.com/v0/b/blitzstarter-d367e.appspot.com/o/${imageFileName}?alt=media&token=${generatedToken}`;

          return db.collection(`/pasess`).add({
            passId,
            blitzId,
            imageUrl,
            status: "unVerified",
          });
        })
        .then(() => {
          return db.doc(`/users/${blitzId}`).get();
        })
        .then((d) => {
          const data = d.data();
          let passes = data.passes || [];
          passes.push({ passId, status: "unVerified" });
          return db.doc(`/users/${blitzId}`).update({ passes });
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
  } catch (err) {
    console.log(err);
  }
};
