const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8bqmuq9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // data insert 

    const roomCollection = client.db('hotelRoom').collection('rooms');
    const bookingCollection = client.db('hotelRoom').collection('bookings');



    app.get('/rooms', async (req, res) => {
      const cursor = await roomCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/bookings', async (req, res) => {
      const bookings = req.body;
      console.log(bookings)
      const result = await bookingCollection.insertOne(bookings);
      res.send(result);
    })

    app.get('/bookings', async (req, res) => {
      let query = {};
      if (req.query?.email) {
          query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/rooms/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await roomCollection.findOne(query);
      res.send(result);
    })

    app.get('/bookings/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.findOne(query);
      res.send(result);
    })
     
    // delete 
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })




    app.patch('/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedItem = req.body;
        const updateDoc = {
          $set: {
            date: updatedItem.date
          }
        };
        const result = await bookingCollection.updateOne(filter, updateDoc);
        
        // Check if the update operation was successful
        if (result.modifiedCount === 1) {
          res.status(200).json({ message: 'Booking updated successfully' });
        } else {
          res.status(404).json({ message: 'Booking not found or no changes were made' });
        }
      } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hotel Room is Runing');
});

app.listen(port, () => {
  console.log(`Hotel Room server is running on port ${port}`);
});

