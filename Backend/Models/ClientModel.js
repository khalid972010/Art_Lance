const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://khalid972010:khalid123@clusteriti.w66tmq7.mongodb.net/ArtLance"
);
const clientSchema = new mongoose.Schema(
  {
    fullName: String,
    userName: String,
    email: String,
    password: String,
    userType: String,
    profilePicture: String,
    coverPicture: String,
    joinDate: String,
    favTopics: String,
    following: [String],
    previousFreelancers: [String],
    verificationToken: String,
    isVerified: Boolean,
    resetToken: String,
    isGoogle: Boolean,
  },
  { versionKey: false }
);
const Clients = mongoose.model("Clients", clientSchema);

module.exports = Clients;

// history
