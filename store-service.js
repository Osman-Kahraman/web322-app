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

function addItem(itemData) {
    return new Promise((resolve) => {
        itemData.published = itemData.published !== undefined ? true : false;
        
        itemData.id = items.length + 1;
        
        items.push(itemData);
        
        resolve(itemData);
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const filtered = items.filter(item => item.category == category);
        filtered.length > 0 
            ? resolve(filtered)
            : reject("no results returned");
    });
}

function isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    const dNum = d.getTime();
    if (!dNum && dNum !== 0) return false;
    return d.toISOString().slice(0,10) === dateString;
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        const filtered = items.filter(item => new Date(item.postDate) >= minDate);
        filtered.length > 0 
            ? resolve(filtered)
            : reject("no results returned");
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === id);
        item ? resolve(item) : reject("no results returned");
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    addItem,
    getItemsByCategory, 
    isValidDate,
    getItemsByMinDate, 
    getItemById
};