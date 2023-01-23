const urlModel = require("../models/urlModel");
const isValidUrl = require("valid-url");
const shortId = require("shortid");
const validator = require('validator')
const {promisify} = require('util')
const redis = require('redis');
const axios=require('axios')

const validUrl = /^[a-zA-Z_-]{1}[a-zA-Z0-9_-]*$/


const redisClient = redis.createClient(
  18590, "redis-18590.c305.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("DmLZvRPIlZnh2GoSj5ygnzDdhxoDgzDT", (err)=>{
  if (err) console.log(err);
});

redisClient.on("connect", async ()=>{
  console.log("Redis is Connected");
})

const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient)
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)

exports.createUrl = async (req, res) => {
  try {
    let longUrl = req.body.longUrl;

   

    if (Object.keys(req.body).length == 0 || longUrl == "") {
        return res.status(400).send({ status: false, message: "Please enter mendatory url" });
      }

      if(longUrl.indexOf("https")==-1) longUrl=longUrl.replace("http","https")

      longUrl = longUrl.trim()

    if (!isValidUrl.isUri(longUrl) || !longUrl.includes("//")) {
        return res.status(400).send({ status: false, message: "Url is not valid" });
    }

        let urlfound = false;
        await axios.get(longUrl)
        .then((result) => {
        if ( result.status == 201 || result.status == 200 )
            urlfound = true;
        })
        .catch((err) => {console.log(err.message)});
      
        if (urlfound == false) return res.status(400).send({status: false, message: "Link is not valid"})

    let isUrlExistInCache = await GET_ASYNC(`${longUrl}`)

    if (isUrlExistInCache) {
      isUrlExistInCache=JSON.parse(isUrlExistInCache)

      return res.status(200).send({status:true,data:isUrlExistInCache})
    }

    let  isUrlExistInDB= await urlModel.findOne({longUrl:longUrl})
if(isUrlExistInDB){
     await SET_ASYNC(`${longUrl}`,24*3600,JSON.stringify(isUrlExistInDB))
     return res.status(200).send({status:true,data:isUrlExistInDB})
}
    let urlCode = shortId.generate().toLowerCase();
    
    let shortUrl = "http://localhost:3000/" + urlCode;

    let newObj = {};

    newObj.urlCode = urlCode;
    newObj.longUrl = longUrl;
    newObj.shortUrl = shortUrl;

    await urlModel.create(newObj);


    
    return res.status(201).send({ status: true, data: newObj });
    
  } catch (err) {
    return res.status(500).send({ status: false, Error: err.message });
  }
};

exports.getUrl = async (req, res) => {
  try {
    let urlCode = req.params.urlCode;

    if (!urlCode)
      return res.status(400).send({ status: false, message: "Please provide urlCode" });

    if(!validUrl.test(urlCode) || urlCode.length !==9 || !validator.isAlphanumeric(urlCode, "en-US", {ignore:"-,_"} )) return res.status(400).send({ status: false, message: "invalid urlCode" });

    let isUrlExistInCache = await GET_ASYNC(`${urlCode}`)

    if (isUrlExistInCache) {
      isUrlExistInCache = JSON.parse(isUrlExistInCache)
    
      return res.status(302).redirect(isUrlExistInCache);
    }

    let urlDetails = await urlModel.findOne({ urlCode: urlCode });
    
    if (!urlDetails)
      return res.status(404).send({ status: false, message: "url Not Found" });

    let longUrl = urlDetails.longUrl;

    await SET_ASYNC(`${urlCode}`, 86400, JSON.stringify(longUrl))

    return res.status(302).redirect(longUrl);
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};





