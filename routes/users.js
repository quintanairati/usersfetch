var express = require('express');
var router = express.Router();
const multer  = require('multer')
const path = require('path');
const mongojs = require('mongojs');

const { rawListeners } = require('../app');
const db = mongojs('bezeroakdb', ['bezeroak'])

const ruta = path.join(__dirname, '../public/uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ruta)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname)
  },
  fileSize: function (req, file, cb) {
    cb(null, file.size)
  }
})

const fileFilter = (req, file, cb) => {
const fitx = file.originalname.split('.');
const mota = fitx[fitx.length - 1];
if ( mota === 'jpg' || mota === 'png' || mota === 'PNG' || mota === 'JPG') {
  cb(null, true);
} else {
  cb(new Error('Ez da PNG edo JPG motako fitxategia'), false);
}
};

const upload = multer({ storage: storage,
                      limits: {
                        fileSize: 2 * 1024 *1024,
                      },
                      fileFilter: fileFilter
                    })

let users = [];

db.bezeroak.find( function (err, userdocs) {
  if (err) {
    console.log(err)
  } else {
    users = userdocs
  }
})

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render("users", {
    title: "Users", 
    users: users
  });
});

router.get('/list', function(req, res, next) {
  res.json(users)
  });

router.post('/fitx', upload.single('avatar'), function (req, res, next) {
  const fitxUrl = req.protocol + '://' + req.get('host') + '/uploads/' + req.body.avatar;
  res.send(`Zure izena: ${req.body.izena}. Fitxategia: ${fitxUrl}`);
})

router.post("/new", upload.single('avatar'), (req, res) => {
  let user = {
    izena: req.body.izena,
    abizena: req.body.abizena,
    id: Date.now(),
    email: req.body.email
  };

  if (req.file) {
    user.avatar = req.file.originalname;
  } else {
    user.avatar = "NoImage.PNG";
  }

  users.push(user);
  db.bezeroak.insert(user, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      console.log(user);
      res.json(user);
    }
  });
});

router.delete("/delete/:id", (req, res) => {
  users = users.filter(user => user.id != req.params.id);

  // remove user from mongo
  db.bezeroak.remove({ id: parseInt(req.params.id)}, function (err, user) {
    if (err) {
      console.log(err)
    } else{
      console.log(user)
    }
  })
  res.json(users);
});

router.put("/update/:id", (req, res) => {
  let user = users.find(user => user.id == req.params.id);
  user.izena = req.body.izena;
  user.abizena = req.body.abizena;
  user.avatar = req.body.avatar;
  user.email = req.body.email;

  if (!user.avatar) {
    user.avatar = "NoImage.PNG";
  }

  // update user in mongo
  db.bezeroak.update({ id: parseInt(req.params.id) },
    { $set: { izena: req.body.izena, abizena: req.body.abizena, avatar: user.avatar, email: req.body.email }},
    function (err, user) {
      if (err) {
        console.log(err)
      } else{
        console.log(user)
      }
    })
    res.json(users);
})

module.exports = router;
