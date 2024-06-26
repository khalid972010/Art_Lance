const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://khalid972010:khalid123@clusteriti.w66tmq7.mongodb.net/ArtLance"
);
const orderSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    from: { type: mongoose.Schema.Types.ObjectId, required: true },//Client
    to: { type: mongoose.Schema.Types.ObjectId, required: true },//Freelancer
    description: { type: String, required: true },
    price: { type: Number, required: true },
    paymentID : {type: Number ,default: -1},
    state: {
      type: String,
      enum: ["Pending", "InProgress", "Declined", "Completed"],
      required: true,
      default: "Pending",
    },
    FreelancerResponse:{
      type:String,
      default:""
    },
    deadline: {
      type: String,
      enum: ["Now", "Within 2 weeks", "in a month"],
      required: true,
    },
    isPaid: { type: Boolean, default: false },
    // product: { type: String }, 
  },
  { versionKey: false }
);
const Orders = mongoose.model("Orders", orderSchema);

module.exports = Orders;
