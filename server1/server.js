const axios=require('axios')
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const UserModule = require("./Models/User"); 
const { MongoClient } = require('mongodb');
const app = express();

app.use(express.json());
app.use(cors({
  origin:"http://localhost:5173",
  methods:["GET","POST"],
  credentials:true
})); 
app.use(cookieParser()); 
const verifyUser=(res,req,next)=>{
  const token=req.cookies.token;
  if(!token){
    return res.json("Token is missing")
  }
  else{
    jwt.verify(token,"jwt-secret-key",(err,decoded)=>{
      if (err){
        return  res.json("error with token")
      }else{
        if(decoded.role==="admin"){
          next()
        }
        else{
          return res.json("not admin")
        }
      }
    })
  }
}




const connectDb = async () => {
  try {
    await mongoose.connect("mongodb://0.0.0.0:27017/UserP"); 
    console.log("Connected to database successfully!");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;


  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }

  try {
    
    const hashedPassword = await bcrypt.hash(password, 10);

   
    const user = await UserModule.create({ name, email, password: hashedPassword });

   
    res.status(201).json({ message: "User created successfully!" }); 
  } catch (err) {
    console.error("Error creating user:", err);
  }

});


app.post('/Login',(req,res)=>{
  const {email,password}=req.body;
  UserModule.findOne({email:email})
  .then(user=>{
    if(user){
      bcrypt.compare(password,user.password,(err,response)=>{
        if(response){
           const token=jwt.sign({email:user.email,role:user.role},
                  "jwt-secret-key",{expiresIn:'1d'})
           res.cookie('token',token)
           return res.json({Status:"Success",role:user.role})
        }
        else{
          return res.json("password is incorect get out")
        }
      }
      )

    }
    else{
      return res.json("Get The Fuck OUT of Hear")
    }
  })
})
const uri = 'mongodb://0.0.0.0:27017';

// MongoDB client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

// Call the connect function
connectToMongoDB();

// Endpoint to receive location data from frontend and store in MongoDB
app.post('/api/send-location', async (req, res) => {
    const { latitude, longitude } = req.body;
    console.log(`Received location from user: ${latitude}, ${longitude}`);

    try {
        // Accessing the database
        const database = client.db('ulocation'); // Replace with your database name
        const collection = database.collection('locations'); // Replace with your collection name

        // Insert location data into MongoDB
        const result = await collection.insertOne({
            latitude: latitude,
            longitude: longitude,
            timestamp: new Date() // Example timestamp
        });

        console.log('Location stored in MongoDB:', result.insertedId);
        res.json({ message: 'Location stored successfully' });
    } catch (err) {
        console.error('Error storing location in MongoDB:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Endpoint to fetch all stored locations from MongoDB
// Endpoint to fetch the latest stored location from MongoDB
app.get('/api/get-latest-location', async (req, res) => {
    try {
        // Accessing the database
        const database = client.db('ulocation'); // Replace with your database name
        const collection = database.collection('locations'); // Replace with your collection name

        // Fetch the latest location data from MongoDB
        const latestLocation = await collection.findOne({}, { sort: { timestamp: -1 } });
        // const latestLocation = await collection.find({},{ sort: { timestamp: -1 } }).limit(5);

        if (latestLocation) {
            res.json(latestLocation);
        } else {
            res.json({ message: 'No locations found' });
        }
    } catch (err) {
        console.error('Error fetching latest location from MongoDB:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/admin',(req,res)=>{
  UserModule.find()
  .then(auths=>res.json(auths))
  .catch(err=>res.json(err))
})
app.get('/Ecall',(req,res)=>{
  UserModule.find()
  .then(locations=>res.json(locations))
  .catch(err=>res.json(err))
})


const PORT = 3000;
connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
