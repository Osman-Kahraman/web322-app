const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: String,
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }],
});

let User;

function initialize() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection('mongodb+srv://osmankahraman:GysxN2mttwKHq93V@seneca.2hqdh.mongodb.net/?retryWrites=true&w=majority&appName=Seneca');

        db.on('error', (err) => {
            console.error('Database connection error:', err);
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        }
        else {
            bcrypt.hash(userData.password, 10)
                .then(hash => {
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser.save()
                        .then(() => resolve())
                        .catch(err => {
                            if (err.code === 11000) {
                                reject("User Name already taken");
                            } else {
                                reject(`There was an error creating the user: ${err}`);
                            }
                        });
            })
        }
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({userName: userData.userName})
            .then(users => {
                if (users.length === 0) {
                    reject(`Unable to find user: ${userData.userName}`);
                }
                else {
                    console.log(users);
                    if (userData.password == users[0].password) {
                        users[0].loginHistory.push({
                            dateTime: new Date(),
                            userAgent: userData.userAgent
                        });

                        User.updateOne(
                            { userName: users[0].userName },
                            { $set: { loginHistory: users[0].loginHistory } }
                        )
                        .then(() => resolve(users[0]))
                        .catch(err => reject(`There was an error verifying the user: ${err}`));
                    }
                    else {
                        reject(`Incorrect Password for user: ${userData.userName}`);
                    }
                }
            })
            .catch(err => {
                reject(`There was an error creating the user: ${err}`);
            })
    })
}

module.exports = {
    initialize,
    registerUser,
    checkUser
};