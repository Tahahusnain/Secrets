require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();


app.use (express.static("public"))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User",userSchema);

app.get("/",(req,res)=>{
    res.render('home' )
})


app.get("/login",(req,res)=>{
    res.render('login' )
})

app.get("/register",(req,res)=>{
    res.render('register' )
})

app.post("/register",async (req,res)=>{

    const newUser = new User ({
        email: req.body.username,
        password: req.body.password
    })
    
   const result = await newUser.save()
   console.log('result', result);
   res.render('secrets')
})

app.post("/login",async (req,res)=>{
    const username = req.body.username
    const password = req.body.password

    const query = await User.findOne({email: username})
    console.log("query "+query);
    if (!query){
        console.log("username not found");
    }else{
        if(query){
            
            if(query.password === password){
                res.render("secrets")
            }
        }
    }
})

app.listen(3000, ()=>{
    console.log("server listening on port 3000");
})