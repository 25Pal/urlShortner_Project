const express = require("express");
const router = express.Router();
const urlController = require("../controllers/urlController");

router.post("/url/shorten", urlController.createUrl);

router.get("/:urlCode", urlController.getUrl);

router.all('/*',function (req ,res){
    res.status(400).send({status :false ,msg:"Please send correct url"})
})


module.exports = router;
