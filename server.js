const express = require("express");
const cors = require("cors")
const axios = require("axios")

const redis = require('redis');
const redisClient = redis.createClient();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const DEFAULT_EXPRATION = 3600;

app.get("/comments", async (req, res) =>{
    try {
        redisClient.get("comments", async (err, comments)=>{
            if(err){
                console.log("redis error: ", err.message)
            }

            if(comments != null){
                res.json(JSON.parse(comments))
            }else{
                const results = await axios.get("https://jsonplaceholder.typicode.com/comments");
                redisClient.setex("comments", DEFAULT_EXPRATION, JSON.stringify(results.data));
                res.json(results.data)
            }
        })
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
            redisClient.setex(key, DEFAULT_EXPRATION, JSON.stringify(data));
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
