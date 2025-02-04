const fs = require('fs').promises;
const path = require('path');

let items = [];
let categories = [];

function initialize() {
    return fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8')
        .then(itemsData => {
            items = JSON.parse(itemsData);
            return fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8');
        })
        .then(categoriesData => {
            categories = JSON.parse(categoriesData);
        })
        .catch(() => {
            return Promise.reject("unable to read file");
        });
}

function getAllItems() {
    return items.length > 0 
        ? Promise.resolve(items) 
        : Promise.reject("no results returned");
}

function getPublishedItems() {
    const publishedItems = items.filter(item => item.published === true);
    return publishedItems.length > 0 
        ? Promise.resolve(publishedItems) 
        : Promise.reject("no results returned");
}

function getCategories() {
    return categories.length > 0 
        ? Promise.resolve(categories) 
        : Promise.reject("no results returned");
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};