const Clients = require("../Models/ClientModel");
const Orders = require("../Models/orderModel");
const Freelancers = require("../Models/FreelancerModel"); ///////////////////// UPDATE
const ClientValidator = require("../Validators/clientValidator");
const UserController = require("../Controllers/UserController");
const Portfolios = require("../Models/portfolioModel");

const { isValidObjectId } = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let getAllClients = async (request, response) => {
  let allClients = await Clients.find({});
  return response.status(200).json({ data: allClients });
};

let getClient = async (request, response) => {
  let ID = request.params.id;
  let client = await Clients.findById(ID);

  return response.status(200).json({ data: client });
};
//login
let createClient = async (request, response) => {
  let client = request.body;
  if (client.isGoogle) {
    if (!(await Clients.findOne({ email: client.email }))) {
      client.password = await bcrypt.hash(client.password, 10);
      let newClient = await Clients.create(client);
      return response.json(newClient);
    } else {
      return response.json({ message: "Logged successfully!" });
    }
  }
  if (await Clients.findOne({ email: client.email })) {
    return response.status(400).json({ message: "Mail already exists!" });
  }

  if (await Clients.findOne({ userName: client.userName })) {
    return response.status(400).json({ message: "user name already exists!" });
  }

  if (ClientValidator(client)) {
    client.password = await bcrypt.hash(client.password, 10);
    client.isVerified = false;
    let newClient = await Clients.create(client);
    await UserController.sendVerification(request, response);
  } else {
    response.status(400).json({
      message:
        ClientValidator.errors[0].instancePath.substring(1) +
        " " +
        ClientValidator.errors[0].message,
    });
  }
};

let searchFreelancers = async (request, response) => {
  const query = request.query.query;

  if (!isNaN(query) || !query || query.length == 0)
    return response.status(400).json({ message: "Invalid query!" });

  const regex = new RegExp(".*" + query + ".*", "i");

  const results = await Freelancers.find({
    $or: [{ userName: { $regex: regex } }, { fullName: { $regex: regex } }],
  });

  return response.status(200).json(results);
};

let requestOrder = async (request, response) => {
  const clientID = request.body.client._id;
  const orderDescription = request.body.description;
  const orderPrice = request.body.price;
  const freelancerID = request.params.id;

  try {
    let order = await Orders.findOne({
      from: clientID,
      to: freelancerID,
      description: orderDescription,
    });
    if (order) {
      return response.status(400).json({ message: "Duplicate order!" });
    }
    await Orders.create({
      from: clientID,
      to: freelancerID,
      description: orderDescription,
      price: orderPrice,
      state: "Pending",
    });
    return response
      .status(201)
      .json({ message: "Order Created Successfully!" });
  } catch (error) {
    return response.status(500).json({ error });
  }
};

let getMyOrders = async (request, response) => {
  const clientID = request.body.client._id;
  try {
    let myOrders = await Orders.find({
      from: clientID,
    });

    return response.status(200).json(myOrders);
  } catch (error) {
    return response.status(500).json({ error });
  }
};

let reviewActivation = async (req, res) => {
  try {
    let freelancerID = req.body.freelancerID;
    let clientID = req.body.clientID;

    let client = await Clients.findById(clientID);

    console.log(freelancerID);
    console.log(clientID);
    if (!client.previousFreelancers.includes(freelancerID)) {
      client.previousFreelancers.push(freelancerID);
      await client.save();

      return res
        .status(200)
        .json({ data: client, message: "Review activation successful" });
    } else {
      return res.status(200).json({
        message: "Freelancer already exists in previousFreelancers array",
      });
    }
  } catch (error) {
    // console.error("Error in reviewActivation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

let completeOrder = async (request, response) => {
  /// !!!!!!!!! Just a placeholder, should be in admin controller !!!!!!!!!
  const client = request.body.client;
  const clientID = request.body.client._id.toString();
  const freelancerID = request.body.freelancerID;

  let order = await Orders.findOne({
    from: clientID,
    to: freelancerID,
  });

  if (!order) {
    return response.status(401).json({
      message: "You haven't requested anything from this freelancer!",
    });
  }

  if (order.state == "Completed") {
    return response.status(401).json({
      message: "Order has been already marked as completed before!",
    });
  }

  try {
    await Orders.findByIdAndUpdate(order._id, {
      state: "Completed",
    });
    if (!client.previousFreelancers.includes(freelancerID)) {
      client.previousFreelancers.push(freelancerID);
      await Clients.findByIdAndUpdate(client._id, {
        previousFreelancers: client.previousFreelancers,
      });
    }

    return response.status(200).json({
      message: "Request marked as completed succesfully!",
    });
  } catch (err) {
    return response.status(500).json({
      err,
    });
  }
};

let followFreelancer = async (request, response) => {
  const client = request.body.client;
  const freelancerID = request.params.id;

  if (client.following.includes(freelancerID)) {
    return response
      .status(400)
      .json({ message: "You already follow this freelancer!" });
  }

  try {
    client.following.push(freelancerID);
    await Clients.findByIdAndUpdate(client._id, {
      following: client.following,
    });

    await Freelancers.findByIdAndUpdate(freelancerID, {
      $push: { followers: client._id },
    });
    return response.status(200).json({ message: "Freelancer followed!" });
  } catch (error) {
    return response.status(500).json({ error });
  }
};

let unfollowFreelancer = async (request, response) => {
  const client = request.body.client;
  const freelancerID = request.params.id;

  if (!client.following.includes(freelancerID)) {
    return response
      .status(400)
      .json({ message: "You don't follow this freelancer!" });
  }
  try {
    await Clients.findByIdAndUpdate(client._id, {
      $pull: { following: freelancerID },
    });
    await Freelancers.findByIdAndUpdate(freelancerID, {
      $pull: { followers: client._id },
    });
    return response.status(200).json({ message: "Freelancer unfollowed!" });
  } catch (error) {
    return response.status(500).json({ error });
  }
};

const likePortfolioPost = async (request, response) => {
  let client = request.body.client;
  const postID = request.params.id;
  if (!postID) {
    return response.status(400).json({ message: "Invalid post ID!" });
  }

  let post = await Portfolios.findById(postID);
  if (post.likes.includes(client._id)) {
    return response
      .status(400)
      .json({ message: "You already like this post!" });
  }
  post.likes.push(client._id);
  post.likesCount += 1;
  await post.save();
  return response.status(200).json({ message: "Post liked!" });
};

const unlikePortfolioPost = async (request, response) => {
  let client = request.body.client;
  const postID = request.params.id;
  if (!postID) {
    return response.status(400).json({ message: "Invalid post ID!" });
  }

  let post = await Portfolios.findById(postID);
  if (!post.likes.includes(client._id)) {
    return response.status(400).json({ message: "You don't like this post!" });
  }
  let index = post.likes.indexOf(client._id);
  post.likes.splice(index, 1);
  post.likesCount -= 1;
  await post.save();
  return response.status(200).json({ message: "Post unliked!" });
};

module.exports = {
  getAllClients,
  getClient,
  createClient,
  searchFreelancers,
  followFreelancer,
  unfollowFreelancer,
  getMyOrders,
  requestOrder,
  completeOrder,
  likePortfolioPost,
  unlikePortfolioPost,
  reviewActivation,
};
