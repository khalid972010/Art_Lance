const mongoose = require("mongoose");
const Users =require("./UserModel")
mongoose.connect(
  "mongodb+srv://khalid972010:khalid123@clusteriti.w66tmq7.mongodb.net/ArtLance"
);
const FreelancerSchema = new mongoose.Schema(
  {
    fullName: String,
    userName: String,
    email: String,
    password: String,
    profilePicture: String,
    coverPicture: String ,
    headLine:String,
    location:String,
    about:String,
    bookingOrder:[{clientID:Number,status:String}],
    followers:[String],// Number-> for user id 
    following:[String],//Number-> for user id 
    links:[{tilte:String,url:String}],// for social media accounts
    joinDate:Date,
    services:[{picture:String,
               title:String,
               price:Number,
               description:String,
               duration:Date
                }]
    

  },
  { versionKey: false }
);
const Freelancers = mongoose.model("Freelancers", FreelancerSchema);

module.exports = Freelancers;