require("dotenv").config();
const express = require('express')
const app = express();
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000


app.use(express.json());
app.use(cors());

const admin = require("firebase-admin");

const serviceAccount = require("./blood-donation-center-b0020-firebase-adminsdk-fbsvc-9724785245.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const verifyFBToken = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: 'unautorized access' })
    }
    try {
        const idToken = token.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.decoded_email = decoded.email;
        next();
    }
    catch (err) {
        return res.status(401).send({ message: 'unauthorized access!' })

    }
}

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

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded_email;
            const query = { email }
            const user = await usersCollections.findOne(query);
            if (!user || user.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access!' })
            }
            next();
        }

        //users
        app.get('/all-users', async (req, res) => {
            const query = {}
            const options = { sort: { createdAt: -1 } }
            const cursor = usersCollections.find(query, options);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/all-users/:id', async (req, res) => {

        })
        app.get('/all-users/:email/role', async (req, res) => {

            const email = req.params.email;
            const query = { email }
            const user = await usersCollections.findOne(query);
            res.send({ role: user?.role || 'donor' })
        })
        app.post('/all-users', async (req, res) => {
            const users = req.body;
            users.createdAt = new Date();
            users.status = 'active';
            users.role = 'donor';
            const result = await usersCollections.insertOne(users);
            res.send(result)
        })
        app.patch('/all-users/:id/role', verifyFBToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const statusInfo = req.body;
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: statusInfo.status
                }
            }
            const result = await usersCollections.updateOne(query, updatedDoc);
            res.send(result);
        })
        //donor
        app.get('/my-donation-requests', verifyFBToken, async (req, res) => {
            const query = {}
            const { email } = req.query;
            if (email) {
                query.requesterEmail = email;
                if (email !== req.decoded_email) {
                    return res.status(403).send({ message: 'forbidden access!' })
                }
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

        //all req for admin
        app.get('/all-blood-donation-request', async (req, res) => {
            const query = {}
            if (req.query.status) {
                query.status = req.query.status;
            }
            const cursor = donationReqCollections.find(query)
            const result = await cursor.toArray();
            res.send(result);
        })
        app.patch('/all-blood-donation-request/:id', verifyFBToken, verifyAdmin, async (req, res) => {
            const { status } = req.body;
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await donationReqCollections.updateOne(query, updatedDoc);
            res.send(result);
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