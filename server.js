/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Osman KAHRAMAN
Student ID: 172781221
Date: 026/02/2025
Cyclic Web App URL: https://replit.com/@okahraman2/web322-app
https://replit.com/@okahraman2/web322-app?v=1
GitHub Repository URL: https://github.com/Osman-Kahraman/web322-app
********************************************************************************/

const express = require('express');
const path = require('path');
const storeService = require('./store-service')
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: 'dobubznlp',
    api_key: '882644984493314',
    api_secret: 'q3AZgF6MBSphr237rUvwBhIeSaY',
    secure: true
});

const upload = multer(); 

storeService.initialize()
    .then(() => {
        //start the server 
        app.listen(HTTP_PORT, () => console.log(`Express http server listening on ${HTTP_PORT}`));
    })
    .catch(err => {
        /*output the error to the console */
        console.error("Initialization failed:", err);
        process.exit(1);
    });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/template.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then(items => {
            /* send data to the client */
            res.json(items);
        })
        .catch(err => {
            /* return err message in the format: {message: err} */
            res.status(500).json({ message: err });
        });
});

app.get('/items', (req, res) => {
    if (req.query.category) {
        const category = parseInt(req.query.category);
        if (isNaN(category) || category < 1 || category > 5) {
            return res.status(400).json({ message: "Invalid category value" });
        }
        storeService.getItemsByCategory(category)
            .then(items => res.json(items))
            .catch(err => res.status(404).json({ message: err }));
    } 
    else if (req.query.minDate) {
        if (!storeService.isValidDate(req.query.minDate)) {
            return res.status(400).json({ message: "Invalid date format (Use YYYY-MM-DD)" });
        }
        storeService.getItemsByMinDate(req.query.minDate)
            .then(items => res.json(items))
            .catch(err => res.status(404).json({ message: err }));
    } 
    else {
        storeService.getAllItems()
            .then(items => {
                /* send data to the client */
                res.json(items);
            })
            .catch(err => {
                /* return err message in the format: {message: err} */
                res.status(500).json({ message: err });
            });
    }
});

app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/addItem.html'));
});

app.post('/items/add', upload.single("featureImage"), function (req, res, next) {
    if(req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
    
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processItem(uploaded.url);
        });
    }
    else {
        processItem("");
    }
     
    function processItem(imageUrl){
        req.body.featureImage = imageUrl;
    
        // TODO: Process the req.body and add it as a new Item before redirecting to /items
        req.body.published = req.body.published ? true : false;
            
        storeService.addItem(req.body)
            .then(() => resolve())
            .catch(err => res.status(500).json({ message: err }));
    } 
});

app.get('/item/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    
    if (isNaN(itemId) || itemId < 1) {
        return res.status(400).json({ message: "Invalid item ID" });
    }

    storeService.getItemById(itemId)
        .then(item => res.json(item))
        .catch(err => {
            if (err === "no results returned") {
                res.status(404).json({ message: err });
            }
        });
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(categories => {
            /* send data to the client */
            res.json(categories);
        })
        .catch(err => {
            /* return err message in the format: {message: err} */
            res.status(500).json({ message: err });
        });
});

app.use(express.static('public'));

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '/views/err404.html'));
});