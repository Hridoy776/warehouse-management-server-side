const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authUser = req.headers.authorization;
  if (!authUser) {
    return res.status(401).send({ message: "unauthorised access" });
  }
  const token = authUser.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "forbiden" });
    }
    console.log(decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uenij.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const itemCollection = client.db("PristinePerfumes").collection("items");
    // login api
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send(accessToken);
    });
    // add item
    app.post("/add", async (req, res) => {
      const newItem = req.body;
      const result = await itemCollection.insertOne(newItem);
      res.send(result);
    });
    //   items api
    app.get("/items", async (req, res) => {
      const query = {};
      const cursor = itemCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // item api with specific item
    app.get("/user/items", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req?.query?.email;
      if (email === decodedEmail) {
        const query = { email };
        const cursor = itemCollection.find(query);
        const result = await cursor.toArray();
       return res.send(result);
      }
      res.status(403).send({ message: "forbiden access" });
    });
    //  item with specific id

    app.get("/item/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const item = await itemCollection.findOne(query);
      res.send(item);
    });

    app.put("/item/:id", async (req, res) => {
      const id = req.params.id;
      const newQuantity = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedItem = {
        $set: {
          quantity: newQuantity.quantity,
        },
      };
      const result = await itemCollection.updateOne(
        filter,
        updatedItem,
        options
      );

      res.send(result);
    });

    app.get("/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const item = await itemCollection.findOne(query);
      res.send(item);
    });
    app.delete("/item/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await itemCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/user/items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await itemCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("pirsnit perfumes is runnig");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
