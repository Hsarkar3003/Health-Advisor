const mongoose=require('mongoose')
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role:{
        type:String,
        default:"visitor"
    }
})
const UserModule= mongoose.model("auth",UserSchema)
module.exports=UserModule