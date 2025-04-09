/*********************************************************************************
WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Osman KAHRAMAN
Student ID: 172781221
Date: 08/04/2025
Cyclic Web App URL: https://replit.com/@okahraman2/web322-app
https://replit.com/@okahraman2/web322-app?v=1
GitHub Repository URL: https://github.com/Osman-Kahraman/web322-app
********************************************************************************/

const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));

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

app.use((req, res, next) => {
    res.locals.navLink = (url, text) => {
        const isActive = req.path === url;
        return `<li class="nav-item">
            <a class="nav-link${isActive ? ' active' : ''}" href="${url}">${text}</a>
        </li>`;
    };
    
    res.locals.equal = (lvalue, rvalue, options) => {
        if (lvalue === rvalue) {
            return options.fn(this);
        }
        return options.inverse(this);
    };
    
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    res.locals.pageTitle = "";
    res.locals.activeRoute = req.path;
    next();
});

app.get('/', (req, res) => {
    res.render('template');
});

app.get('/about', (req, res) => {
    res.locals.pageTitle = 'Add Item';
    res.render('about')
});

app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        // Sort items by date if they exist
        if (items.length > 0) {
            items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
            viewData.item = null;  // Get the latest item
        } else {
            viewData.message = "No results";
        }

        viewData.items = items;

    } catch (err) {
        viewData.message = "Error loading items";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories found";
    }

    // Render the shop view with viewData
    res.render("shop", {data: viewData });
});

app.get('/shop/:id', async (req, res) => {
    const itemId = parseInt(req.params.id);
    // Declare an object to store properties for the view
    let viewData = {};
  
    try{
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned items by category
        if(req.query.category){
            // Obtain the published "items" by category
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "items"
            items = await storeService.getPublishedItems();
        }
  
        // sort the published items by itemDate
        items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
  
    try{
        // Obtain the item by "id"
        viewData.item = await storeService.getItemById(itemId);
    }catch(err){
        viewData.message = "no results"; 
    }
  
    try{
        // Obtain the full list of "categories"
        let categories = await storeService.getCategories();
  
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
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
                res.render('items', {items: items});
            })
            .catch(err => {
                res.status(500).json({ message: err });
            });
    }
});

app.get('/items/add', (req, res) => {
    res.locals.pageTitle = 'Add Item';
    storeService.getCategories()
        .then(categories => {
            res.render('addItem', { 
                categories: categories,
                pageTitle: 'Add Item'
            });
        })
        .catch(err => {
            res.render('addItem', { 
                categories: [],
                pageTitle: 'Add Item'
            });
        });
});

app.post('/items/add', upload.single("featureImage"), async (req, res) => {
    try {
        let imageUrl = "";

        if (req.file) {
            const streamUpload = (req) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
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

            const uploaded = await streamUpload(req);
            imageUrl = uploaded.url;
        }

        req.body.featureImage = imageUrl || 'https://dummyimage.com/200x200/000/fff';
        req.body.postDate = new Date();
        
        await storeService.addItem(req.body);

        storeService.initialize(); //Updating the data in JS

        res.redirect('/shop');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding item' });
    }
});

app.get('/items/delete/:id', (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => {
            res.redirect('/items');
        })
        .catch(err => {
            res.status(500).send("Unable to Remove Post / Post not found");
        });
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
            res.render('categories', { 
                categories: categories, 
                message: categories.length ? null : "No categories found" 
            });
        })
        .catch(err => {
            res.render('categories', { 
                categories: [], 
                message: "Failed to load categories" 
            });
        });
});

app.get('/categories/add', (req, res) => {
    res.locals.pageTitle = 'Add Category';
    res.render('addCategory');
});

app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect('/categories');
        })
        .catch(err => {
            res.status(500).send("Unable to create category");
        });
});

app.get('/categories/delete/:id', (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect('/categories');
        })
        .catch(() => {
            res.status(500).send("Unable to remove category");
        })
})

app.use(express.static('public'));

app.use((req, res) => {
    res.status(404).render('err404');
});