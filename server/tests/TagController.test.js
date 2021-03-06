/*H

FILENAME: TagController.test.js

DESCRIPTION: This is the javascript file for the predefined tag tests.

TESTS:
           #addTag
           #getAllTags
           #removeTag

AUTHOR: Zeyad Zaky

START DATE: 15 April 2018.

H*/

process.env.NODE_ENV = 'test';
base = process.env.PWD;
const request = require('supertest');
const expect = require('expect');
var app = require("./../server").app;
const { Tags } = require('../models/tag');

var tagg = "";
var uerr = "";
var uer2 = "";
const mongoose = require('mongoose');
Tag = mongoose.model('Tag');
User = mongoose.model('User');

describe('Tag Controller', () => {

    describe('#addTag', () => {
        var user2;
        var user1;
        var adminToken
        before((done) => {
            Tag.remove({}).then(()=>{
                User.remove({}).then((err, res) => {
                    var user = {
                        email: 'admin@something.com',
                        password: 'something',
                        profile: {
                            "fullName": "admin Something"
                        },
                        roles: ["admin"]
                    };
    
                    user = User(user);
    
                    user.save().then((res) => {
                        res.generateAuthToken().then((token) => {
                            adminToken = token;
                            user = {
                                email: 'user@something.com',
                                password: 'something',
                                profile: {
                                    "fullName": "user Something"
                                }
                            };
    
                            request(app)
                                .post("/register")
                                .send({ user })
                                .expect(200)
                                .then((res) => {
                                    user2 = res.body.user;
                                    done();
                                });
                        })
                    })
                        .catch((err) => {
                            console.log(err);
                        });
                });
            })
        });

        it('An admin should add a tag', ((done) => {
            var tag = {
                tag: 'web'
            }
            request(app)
                .post('/tag')
                .set({
                    'x-auth': adminToken
                })
                .send({ tag })
                .expect(200)
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        Tag.find({}).then((tags)=>{
                            expect(tags.length).toBe(1);
                            expect(tags[0].tag).toBe("web");
                            done();
                        })
                    }
                });
        }))

        it('Should not add tag when no tag is given ', (done) => {
            request(app)
                .post('/tag')
                .set({
                    'x-auth': adminToken
                })
                .send()
                .expect(400)
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        Tag.find({}).then((tags)=>{
                            expect(tags.length).toBe(1);
                            done();
                        })
                    }
                });
        });
        it('A non-admin cant add a tag', (done) => {
            request(app)
                .post('/tag')
                .set({
                    'x-auth': user2.tokens[0].token
                })
                .expect(403)
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        Tag.find({}).then((tags)=>{
                            expect(tags.length).toBe(1);
                            done();
                        })
                    }
                });
        });

        after((done) => {

            User.remove({}).then((res) => {
                done();
            })

                .catch((err) => {
                    console.log(err);
                })
        });
    })

    describe('#getAllTags', () => {
        beforeEach((done) => {
            User.remove({}).then((err, res) => {
                var user = {
                    email: 'admin@something.com',
                    password: 'something',
                    profile: {
                        "fullName": "admin Something"
                    },
                    role: "admin"
                };

                request(app)
                    .post("/register")
                    .send({ user })
                    .expect(200)
                    .then((res) => {
                        userr = res.body.user;
                        user = {
                            email: 'user@something.com',
                            password: 'something',
                            profile: {
                                "fullName": "user Something"
                            }
                        };

                        request(app)
                            .post("/register")
                            .send({ user })
                            .expect(200)
                            .then((res) => {
                                user2 = res.body.user;
                                done();
                            });
                    })
                    .catch((err) => {
                        console.log(err);
                    });



            });
        });

        it('should get all tags with no token given', (done) => {
            request(app)
                .get('/tags')
                .expect(200)
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        done();
                    }
                });
        });

        after((done) => {

            User.remove({}).then((res) => {
                done();
            })

                .catch((err) => {
                    console.log(err);
                })
        });
    })

    describe('#removeTag', () => {
        var tags = [];
        var users = [];
        var testUsers = [
            {
                email: 'test@test.com',
                password: '123456',
                roles: ["user"],
                profile: {
                    interests: ["testing"]
                }
            },
            {
                email: 'tests@test.com',
                password: '123456',
                roles: ["user", "admin"],
                profile: {
                    expertIn: ["testing"]
                }
            }
        ];
        var testTokens = [];
        var tagID = "";

        beforeEach((done) => {

            Tag.find().then((tag) => {
                var i;
                for (i = 0; i < tag.length; i++) {
                    tags.push(tag[i]);
                }

                User.find().then((user) => {
                    var j;
                    for (j = 0; j < user.length; j++) {
                        users.push(user[j]);
                    }

                    Tag.remove().then(() => {
                        var tag = {
                            tag: "testing"
                        }

                        tag = new Tag(tag);

                        tag.save().then((savedTag) => {
                            tagID = savedTag._id;

                            User.remove().then(() => {
                                var testUser1 = new User(testUsers[0]);

                                testUser1.save().then(() => {

                                    testUser1.generateAuthToken().then((Token1) => {
                                        testTokens.push(Token1);
                                        var testUser2 = new User(testUsers[1]);

                                        testUser2.save().then(() => {

                                            testUser2.generateAuthToken().then((Token2) => {
                                                testTokens.push(Token2);
                                                done();
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })

        it('should not find tag with wrong id', (done) => {
            request(app)
                .delete('/tag/5ad513fb0246774bdcb9286f')
                .set('x-auth', testTokens[1])
                .expect(404)
                .expect((res) => {
                    expect(res.text).toBe('There is no tag with such id')
                })
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    return done();
                })
        })

        it('must be an admin', (done) => {
            request(app)
                .delete(`/tag/${tagID}`)
                .set('x-auth', testTokens[0])
                .expect(403)
                .expect((res) => {
                    expect(JSON.parse(res.text).msg).toBe('You are not an Admin.')
                })
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    return done();
                })
        })

        it('should delete the tag and remove it from interests and expertIn', (done) => {
            request(app)
                .delete(`/tag/${tagID}`)
                .set('x-auth', testTokens[1])
                .expect(200)
                .expect((res) => {
                    expect(res.body.removedTag.tag).toBe('testing');
                })
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    User.find().then((users) => {
                        expect(users[0].profile.interests).toHaveLength(0);
                        expect(users[1].profile.expertIn).toHaveLength(0);
                        Tag.find({}).then((tags)=>{
                            expect(tags.length).toBe(0);
                            return done();
                        })
                    }).catch((err) => {
                        return done(err);
                    });
                })
        })

        afterEach((done) => {
            Tag.remove().then(() => {
                Tag.insertMany(tags).then(() => {
                    tags = [];
                    tagID = "";
                    User.remove().then(() => {
                        User.insertMany(users).then(() => {
                            users = [];
                            testTokens = [];
                            done();
                        })
                    })
                })
            })
        })
    })
})
