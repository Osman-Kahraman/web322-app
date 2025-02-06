/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Osman KAHRAMAN
Student ID: 172781221
Date: 04/02/2025
Cyclic Web App URL: https://replit.com/@okahraman2/web322-app
GitHub Repository URL: https://github.com/Osman-Kahraman/web322-app
********************************************************************************/

const express = require('express');
const path = require('path');
const storeService = require('./store-service')

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

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
    storeService.getAllItems()
        .then(items => {
            /* send data to the client */
            res.json(items);
        })
        .catch(err => {
            /* return err message in the format: {message: err} */
            res.status(500).json({ message: err });
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