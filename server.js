const express = require("express");
const cors = require("cors")
const axios = require("axios")

const redis = require('redis');
const redisClient = redis.createClient({
    host : 'eu1-modest-frog-32302.upstash.io',
    port : '32302',
    password: '63fbc50f63cf49cca0bfa4d334cad63d',
    tls:  {}
});

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const DEFAULT_EXPRATION = 3600;

app.get("/comments", async (req, res) =>{
    try {
        const comments = await getOrSetCache("comments", async () =>{
            const results = await axios.get("https://jsonplaceholder.typicode.com/comments");
            return results.data
        })

        res.json(comments)
    } catch (error) {
        res.json({ message: error.message })
    }
})


function getOrSetCache(key, cb){
    return new Promise((resolve, reject) =>{
        redisClient.get(key, async (error, data) =>{
            if(error) return reject(error)
            if(data != null){
                return resolve(JSON.parse(data))
            }
            const getFromDb = await cb();
            redisClient.setex(key, DEFAULT_EXPRATION, JSON.stringify(getFromDb));
            resolve(getFromDb)
        })
    })
}

app.get("/", (req, res, err) =>{
    res.json({
        message: "Everything is ok!"
    })
})

app.listen(5000, () => console.log("Server is running!"))
