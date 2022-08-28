const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// Middleware...
app.use(cors());
app.use(express.json());


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' });
    }
    // console.log('Decoded token', decoded);
    req.decoded = decoded;
    next();
  })
  // console.log('Inside JWT verify', authHeader);
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u9huupb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const foodCollection = client.db("foodStock").collection("food");
    const messageCollection = client.db("userMessages").collection("message");

    // Adding or Creating ...
    app.post('/food', async (req, res) => {
      const newItem = req.body;
      const result = await foodCollection.insertOne(newItem);
      res.send(result);
    })

    // Find Multiple Document (pagination)...
    app.get('/food', async (req, res) => {
      const { email } = req.query;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      let query;
      if (email) {
        query = { email };
      } else {
        query = {};
      }
      const cursor = foodCollection.find(query);
      let foods;
      // Apply pagination ...
      if (page || size) {
        foods = await cursor.skip(page * size).limit(size).toArray();
      } else {
        foods = await cursor.toArray();
      }
      res.send(foods);
    });

    // Find a document ...
    app.get('/food/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const food = await foodCollection.findOne(query);
      res.send(food);
    })

    // UPDATE or PUT a document ...
    app.put('/food/:id', async (req, res) => {
      const id = req.params.id;
      const updateItem = req.body;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: updateItem.quantity
        }
      };
      const result = await foodCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    })

    // DELETE a item ...
    app.delete('/food/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    })

    // Using pagination ...
    app.get('/foodCount', async (req, res) => {
      const query = {};
      const cursor = foodCollection.find(query);
      // const count = await cursor.countDocuments();
      const count = await cursor.count();
      res.send({ count })
    })


    // AUTH / jwt ...
    app.post('/login', async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d'
      });
      res.send({ accessToken });
    })


    // User Feedback DATA ...
    app.post('/feedback-message', async (req, res) => {
      const order = req.body;
      const result = await messageCollection.insertOne(order);
      res.send(result);
    })

    // Secrate API using token...
    app.get('/feedback-message', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = messageCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      }
      else {
        res.status(403).send({ message: 'forbidden access' })
      }
    })


  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello Server');
});
app.listen(port, () => {
  console.log("Listening on port");
});