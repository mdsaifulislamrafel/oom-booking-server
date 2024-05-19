const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cookieParser())
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://lambent-heliotrope-241ad2.netlify.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8bqmuq9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2lraink.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middileware

const logger = (req, res, next) => {
  console.log(`logInfo ${req.method} ${req.url}`);
  next();
}

const varifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("token in middile ware" , token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKON_SECRET, (err, user) => {
    if (err) {
      return res.Status(403).send({ message: 'unauthorized access' });
    } else {
      req.user = user;
      next();
    }
  })
}

async function run() {
  try {
    // data insert 

    const roomCollection = client.db('hotelRoom').collection('rooms');
    const bookingCollection = client.db('hotelRoom').collection('bookings');
    const reviewCollection = client.db('hotelRoom').collection('reviews');


    // jwt 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('user token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
        .send({ success: true });
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res
        .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
        .send({ success: true })
    })




    app.get('/rooms', async (req, res) => {
      const cursor = await roomCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/bookings', async (req, res) => {
      const bookings = req.body;

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

    // review

  

    app.post('/reviews', async (req, res) => {
      const reviews = req.body;
      const result = await reviewCollection.insertOne(reviews);
      res.send(result);
    })

    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().sort({ timestamp: -1 }).toArray();
      res.send(result);
    });


    // unable to update the booking
    app.patch('/rooms/:id', async (req, res) => {
      const id = req.params.id;
      const updateDoc = req.body;
      const query = { _id: new ObjectId(id) }
      const update = {
        $set: {
          availability: updateDoc.availability
        }
      }
      const result = await roomCollection.updateOne(query, update);
      res.json(result);
    })

    app.get('/unavailable/:availability', async (req, res) => {
      const email = req.params.availability;
      const query = { availability: email }
      const result = await roomCollection.find(query).toArray();
      res.send(result);
    })





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

