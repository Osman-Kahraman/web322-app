const fs = require('fs').promises;
const { raw } = require('express');
const path = require('path');
const Sequelize = require('sequelize');

var sequelize = new Sequelize({
    database: "neondb",
    username: "neondb_owner", 
    password: "npg_Lpd7hTlAt6kz",
    host: "ep-wild-morning-a51zxru8-pooler.us-east-2.aws.neon.tech",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    query: {raw: true}
});

const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});
const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});
Item.belongsTo(Category, {foreignKey: 'category'});

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => {
                resolve();
            })
            .catch(err => {
                reject("unable to sync the database");
            });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(items => {
                resolve(items);
            })
            .catch(err => {
                reject("no results returned");
            });
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true
            }
        })
        .then(items => {
            if (items.length > 0) {
                resolve(items);
            } else {
                reject("no results returned");
            }
        })
        .catch(err => {
            reject("no results returned");
        });
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(categories => {
                if (categories.length > 0) {
                    resolve(categories);
                } else {
                    reject("no results returned");
                }
            })
            .catch(err => {
                reject("no results returned");
            });
    });
}

function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                category: category
            }
        })
        .then(items => {
            if (items.length > 0) {
                resolve(items);
            } else {
                resolve([]);
            }
        })
        .catch(err => {
            reject("no results returned");
        });
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = (itemData.published) ? true : false;
        
        for (const key in itemData) {
            if (itemData[key] === "") {
                itemData[key] = null;
            }
        }
        
        itemData.postDate = new Date();
        
        Item.create(itemData)
            .then(() => {
                resolve();
            })
            .catch(err => {
                reject("unable to create post");
            });
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                category: category
            }
        })
        .then(items => {
            if (items.length > 0) {
                resolve(items);
            } else {
                reject("no results returned");
            }
        })
        .catch(err => {
            reject("no results returned");
        });
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
        const { gte } = Sequelize.Op;
        
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
        .then(items => {
            if (items.length > 0) {
                resolve(items);
            } else {
                reject("no results returned");
            }
        })
        .catch(err => {
            reject("no results returned");
        });
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                id: id
            }
        })
        .then(items => {
            if (items.length > 0) {
                resolve(items[0]);
            } else {
                reject("no results returned");
            }
        })
        .catch(err => {
            reject("no results returned");
        });
    });
}

function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        // Replace empty values with null
        for (const key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }
        
        Category.create(categoryData)
            .then(() => {
                resolve();
            })
            .catch(err => {
                reject("unable to create category");
            });
    });
}

function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id
            }
        })
        .then(() => {
            resolve();
        })
        .catch(err => {
            reject("unable to remove category");
        });
    });
}

function deletePostById(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: {
                id: id
            }
        })
        .then(() => {
            resolve();
        })
        .catch(err => {
            reject("unable to remove post");
        });
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    getPublishedItemsByCategory,
    addItem,
    getItemsByCategory, 
    isValidDate,
    getItemsByMinDate, 
    getItemById,
    addCategory,
    deleteCategoryById,
    deletePostById
};