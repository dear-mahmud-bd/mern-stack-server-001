const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// Middleware...
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u9huupb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const foodCollection = client.db("foodStock").collection("food");

    // Adding or Creating ...
    app.post('/food', async (req, res) => {
      const newItem = req.body;
      const result = await foodCollection.insertOne(newItem);
      res.send(result);
    })

    // Find Multiple Document (pagination)...
    app.get('/food', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = foodCollection.find(query);
      let foods;
      // Apply pagination ...
      if (page || size) {
        foods = await cursor.skip(page*size).limit(size).toArray();
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