var cloudinary = require('cloudinary').v2;
var express = require('express');
var { body } = require('express-validator');
var { success, checkError, error } = require('../response.js');
const log = require('../logger');
var router = express.Router();
const multer = require('multer');
const path = require('path');
var upload = multer({ dest: './upload/' });
cloudinary.config({
    cloud_name: 'dhzouknuj',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
router.route('/upload').post(upload.single('image'), async function add(req, res) {
    try {
        // cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
        //     { public_id: "olympic_flag1", tags: 'cat' },
        //     function (error, result) {  return success(res,result,200); });
        // const filePath = `data:image/${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        // cloudinary.uploader.upload(req.file.destination + req.file.filename, {
        //     public_id: "coc",
        //     tags: 'cat111'
        // }, (error, result) => {
        //     if (error) {
        //         console.error(error);
        //         return error(res);
        //     } else {
        //         console.log(result);
        //         return success(res, result, 200);
        //     }
        // });
        cloudinary.search
            .expression('tags=cat111')
            .sort_by('public_id', 'desc')
            .max_results(1) // Set the maximum number of results you want to retrieve
            .execute()
            .then(result => {
                // Check if there are any results
                if (result.resources.length > 0) {
                    // Retrieve the URL of the first image
                    const imageUrl = cloudinary.url(result.resources[0].public_id, {
                        secure: true, // Use HTTPS
                        transformation: [
                            // Add any additional transformations if needed
                            { width: 500, height: 500, crop: 'fill' }
                        ]
                    });

                    console.log('Image URL:', imageUrl);
                } else {
                    console.log('No images found.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    } catch (err) {
        log.debug(err);
        return error(res);
    }
});
module.exports = router;
