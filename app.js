require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const saltRounds = 10;
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { error, log } = require('console');
const app = express();

app.use (express.static("public"))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())  
app.use(passport.session())

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

//schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done)=> {
      done(null, user.id);
  });
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("profile = "+JSON.stringify(profile));
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        console.log("profile "+profile.id)
      return cb(err, user);
    });
  }
));

//home route
app.get("/",(req,res)=>{
    res.render('home' )
})

//google authentication route
app.get('/auth/google',
    passport.authenticate("google",{scope: ["profile"]})
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });



//register routes
app.route ('/register')

    .get((req,res)=>{
        res.render('register' )
    })

    .post(async (req,res)=>{

        User.register({username: req.body.username}, req.body.password, (err, user)=>{
            if(err){
                console.log(err);
                res.redirect("/register")
            }else{
                passport.authenticate("local")(req, res , ()=>{
                    res.redirect("/secrets")
                })
            }
        })
    })


//login routes
app.route ('/login')

    .get((req,res)=>{
        res.render('login' )
    })

    .post(async (req,res)=>{
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, (err)=>{
            if(err){
                console.log(err);
            }else{
                passport.authenticate("local")(req, res, () => {
                    res.redirect("secrets");
                  });
                // res.redirect("/secrets")
            }       
        })
    })



//submit routes 
app.route('submit')

    .get((req,res)=>{
        if(req.isAuthenticated()){
            res.render("submit")
        }else{
            res.redirect("/login")
        }
    })

    .post( async(req,res)=>{ // when we initiate a new login session it will save that user in request variable
        const secretSubmitted = req.body.secret
        console.log('req-------------------------------------',req.body,req.user);
        console.log(req.user);
        
        console.log("user id ="+ req.user )
        console.log("secret ="+ secretSubmitted)
        
        const foundUserById = await User.findById(req.user)
        console.log("found user ="+ foundUserById )
        if(!foundUserById){
            console.log("user not found");
        }else{
            if(foundUserById){
                foundUserById.secret = secretSubmitted
                foundUserById.save()
                res.redirect("/secrets")
            }
        }
        
        console.log(req.user.id) ;
    })

    //logout route
app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
           console.log(err);
        }
        res.redirect('/')
    });
      
})

//secrets route
app.get("/secrets",async(req, res)=>{

    try{
        const findSecret = await User.find({"secret": { $ne: null }})
        res.render("secrets", {usersWithSecret: findSecret})
    }catch(error){
        throw Error (err)
    }
})



app.listen(3000, ()=>{
    console.log("server listening on port 3000");
})


// User.findById(req.user).then((foundUser)=>{
//     if(!foundUser){
//         console.log("not found");
//     }else{
//         if(foundUser){
//             foundUser.secret = secretSubmitted
//             foundUser.save()
//             res.redirect("/secrets")
//         }
//     }
// }).catch((err)=>{
//     throw err
// })
// if(req.isAuthenticated()){
//     res.render("secrets")
// }else{
//     res.redirect("/login")
// }

//my logic 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// passport.serializeUser(function(user, done) {
//     console.log(user.id);
//     done(null, user);
//   });
// passport.deserializeUser(async (id, cb) => {
//     const foundUser = await User.findById(id)
//     console.log("FOund user ="+foundUser);
//     if(!foundUser){
//         return cb(err)
//     }
//     return cb (err, foundUser)
// });

// 07298c23c9e3db3e4c92ddb640fd554a
