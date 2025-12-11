require("dotenv").config();
const express = require('express')
const app = express();
const cors = require('cors');

const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000


app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jbskmxj.mongodb.net/?appName=Cluster0`;



// Create a MongoClient 
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const db = client.db('blood-donation-database');
        const usersCollections = db.collection('users');
        const donationReqCollections = db.collection('all-donation-req');

        app.get('/my-donation-requests', async (req, res) => {
            const query = {}
            const { email } = req.query;
            if (email) {
                query.requesterEmail = email;
            }
            const options = { sort: { donationDate: -1 } }
            const cursor = donationReqCollections.find(query, options);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.post('/my-donation-requests', async (req, res) => {
            const donationReq = req.body;
            donationReq.createdAt = new Date();
            donationReq.status = 'pending';
            const result = await donationReqCollections.insertOne(donationReq);
            res.send(result)
        })
        //users
        app.get('/all-users', async (req, res) => {
            const query = {}
            const options = { sort: { createdAt: -1 } }
            const cursor = usersCollections.find(query, options);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.post('/all-users', async (req, res) => {
            const users = req.body;
            users.createdAt = new Date();
            users.status = 'pending';
            users.role = 'donor';
            const result = await usersCollections.insertOne(users);
            res.send(result)
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
run().catch(console.dir);