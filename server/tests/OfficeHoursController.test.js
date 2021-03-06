//import { OfficeHours } from '../models/OfficeHour';
//import { User } from '../models/user'

process.env.NODE_ENV = 'test';
base = process.env.PWD;
const request = require('supertest');
const expect = require('expect');
var app = require("./../server").app;
const { OfficeHours } = require('../models/OfficeHour');
const { User } = require('../models/user');
const { ObjectID } = require('mongodb');

var id = "";
var token = "";
var userr = "";
var expertt = "";
var OfficeHourss = "";

const mongoose = require('mongoose');

describe('Officehours Controller', () => {


    describe('#getOfficeHours', () => {

        var user1 = {
            email: 'omarelmoghazy@someCompany.com',
            password: 'omarelmoghazy',
            profile: {
                fullName: "Omar Elmoghazy"
            }
        };

        var exp1 = {
            email: 'mostafaamer@someCompany.com',
            password: 'mostafaamer',
            profile: {
                fullName: "Mostafa Amer"
            }
        };

        before((done) => {

            // Remove all users from the DB
            User.remove({})
                // Register expert1
                .then(() => {
                    return request(app).post("/register").send({ user: exp1 }).expect(200);
                })
                // Make him expert
                .then((res) => {
                    exp1 = res.body.user;
                    return User.findByIdAndUpdate(exp1._id, { $push: { roles: 'expert' } }, { new: true });
                })
                .then((newExpert) => {
                    exp1 = newExpert;
                })
                // Register the normal user to submit requests
                .then(() => {
                    return request(app).post("/register").send({ user: user1 }).expect(200);
                })
                .then((res) => {
                    user1 = res.body.user;
                })
                // end "before" block
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(err);
                });

        });


        beforeEach((done) => {
            // Remove all Office Hours from the DB before each test case
            OfficeHours.remove({}).then(() => {
                done();
            }).catch((reason) => {
                console.log(reason);
                done(reason);
            });
        });

        it('should get office hours of the calling user if he is really a user', (done) => {

            var off1 = {
                title: 'title',
                description: 'description',
                user: {
                    "_id": user1._id,
                    "name": "Omar Elmoghazy"
                },
                expert: {
                    "_id": exp1._id,
                    "name": "Mostafa Amer"
                }
            };


            off1 = new OfficeHours(off1);
            off1.save().then(() => {
                request(app)
                    .get('/officeHours')
                    .set({ 'x-auth': user1.tokens[0].token })
                    .send({ user1 })
                    .expect(200)
                    .expect((res) => {
                        OfficeHours.count({}, function (err, count) {
                            expect(count).toBe(1);
                        })
                    })
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        return done();
                    })

            });
        })

        it('should not get any office hours if he is a guest, not a user', (done) => {

            var user2 = {
                email: 'ahmedelmoghazy@someCompany.com',
                password: 'ahmedelmoghazy',
                profile: {
                    fullName: "Ahmed Elmoghazy"
                },
                roles: []
            };
            user2 = new User(user2);

            var off1 = {
                title: 'title',
                description: 'desc',
                user: {
                    "_id": user2._id,
                    "name": "Ahmed Elmoghazy"
                },
                expert: {
                    "_id": exp1._id,
                    "name": "Mostafa Amer"
                }
            };


            off1 = new OfficeHours(off1);
            off1.save().then(() => {
                request(app)
                    .get('/officeHours')
                    .send({ user1 })
                    .expect(401)
                    .expect((res) => {
                        expect(res.headers['x-auth']).toBeUndefined();
                    })
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        return done();
                    })
            });
        });








    })

    describe('#getOfficeHour', () => {

        beforeEach((done) => {
            User.remove({}).then((err, res) => {
                var user = {
                    email: 'nothing@something.com',
                    password: 'something',
                    profile: {
                        "fullName": "Nothing Something"
                    }
                };

                request(app)
                    .post("/register")
                    .send({ user })
                    .expect(200)
                    .then((res) => {
                        userr = res.body.user;
                        user = {
                            email: 'expert@something.com',
                            password: 'something',
                            profile: {
                                "fullName": "expert Something"
                            }
                        };

                        request(app)
                            .post("/register")
                            .send({ user })
                            .expect(200)
                            .then((res) => {
                                expertt = res.body.user;
                                OfficeHourss = new OfficeHours({
                                    user: {
                                        _id: userr._id,
                                        name: userr.profile.fullName
                                    },
                                    expert: {
                                        _id: expertt._id,
                                        name: expertt.profile.fullName
                                    },

                                    title: "ask expert",

                                    description: "about nothing",

                                });

                                OfficeHourss.save().then((doc) => {
                                    OfficeHourss = doc;
                                    done();
                                })
                                    .catch((err) => {
                                        console.log(err);
                                    });
                            });

                    });
            });
        });


        it('should officehour be found using user token ', (done) => {
            request(app)
                .get('/officeHour/' + OfficeHourss._id)
                .expect(200)
                .set({
                    'x-auth': userr.tokens[0].token
                })
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        expect(res.body.officeHour.title).toBe("ask expert");
                        done();
                    }
                });
        });
        it('should officehour be found using expert token ', (done) => {
            request(app)
                .get('/officeHour/' + OfficeHourss._id)
                .expect(200)
                .set({
                    'x-auth': expertt.tokens[0].token
                })
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        expect(res.body.officeHour.title).toBe("ask expert");
                        done();
                    }
                });
        });


        it(' Should be not found ', (done) => {
            request(app)
                .get('/officeHour/')
                .expect(404)
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        done();
                    }
                });
        });
        it(' Should be unauthorized', (done) => {
            request(app)
                .get('/officeHour/' + OfficeHourss._id)
                .expect(401)
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        done();
                    }
                });
        });
        it(' Should be incorrect as no office hour with that id', (done) => {
            request(app)
                .get('/officeHour/' + 35131)
                .set({
                    'x-auth': userr.tokens[0].token
                })
                .expect(500)
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        done();
                    }
                });
        });
        it(' should not be able to get the office hours as he/she not a user or an expert', (done) => {
            request(app)
                .get('/officeHour/' + OfficeHourss._id)
                .expect(401)
                .set({
                    'x-auth': 51351
                })
                .end((err, res) => {
                    if (err)
                        done(err);
                    else {
                        done();
                    }
                });
        });



        after((done) => {
            OfficeHours.remove({}).then((res) => {
                User.remove({}).then((res) => {
                    done();
                })

            }).catch((err) => {
                console.log(err);
            })
        });


    })

    describe('#getExperts', () => {

        var id;
        var token;

        beforeEach((done) => {
            User.remove({}).then(() => {
                var user = {
                    email: 'nothing@something.com',
                    password: 'something',
                    profile: {
                        "fullName": "Nothing Something"
                    }
                }

                var expert1 = {
                    email: 'daniel@gmail.com',
                    password: 'danielo',
                    profile: {
                        "fullName": "Daniel Achraf",
                        "expertIn": ["web"],
                    },
                    "roles": ["user", "expert"]
                }

                var expert2 = {
                    email: 'rony@gmail.com',
                    password: 'danielo',
                    profile: {
                        "fullName": "Rony Labib",
                        "expertIn": ["technology"]
                    },
                    "roles": ["user", "expert"]
                }

                var expert3 = {
                    email: 'fady@gmail.com',
                    password: 'danielo',
                    profile: {
                        "fullName": "Fady Sameh",
                        "expertIn": ["web", "technology"]
                    },
                    "roles": ["user", "expert"]
                }

                expert1 = new User(expert1);
                expert2 = new User(expert2);
                expert3 = new User(expert3);

                expert1.save().then(() => {
                    expert2.save().then(() => {
                        expert3.save().then(() => {
                            request(app)
                                .post("/register")
                                .send({ user })
                                .expect(200)
                                .end((err, res) => {
                                    id = res.body.user._id;
                                    token = res.headers['x-auth'];
                                    var user = {
                                        "profile": {
                                            "interests": ["web", "technology"]
                                        }
                                    };

                                    request(app)
                                        .post("/editProfile")
                                        .set('x-auth', token)
                                        .send({ user })
                                        .expect(200)
                                        .end((err, res) => {
                                            if (err) {
                                                return done(err);
                                            }
                                            expect(res.body.updatedUser.profile.interests[0]).toBe("web");
                                            expect(res.body.updatedUser.profile.interests[1]).toBe("technology");
                                            return done();
                                        })
                                })
                        })
                    })
                })

            })
        });

        it('should return bad request if no tags were passed', (done) => {
            request(app)
                .post("/searchExperts")
                .set('x-auth', token)
                .expect(400)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.err).toBe("tags not recieved");
                    return done();
                })
        });

        it('should return experts based on ANY of my interests if empty tags were passed', (done) => {

            var tags = [];
            request(app)
                .post("/searchExperts")
                .send({ tags })
                .set('x-auth', token)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.experts).toHaveLength(3);
                    return done();
                })
        });

        it('should return experts that HAS tags based on ALL tags passed if not empty tags were passed', (done) => {

            var tags = ["web", "technology"];
            request(app)
                .post("/searchExperts")
                .send({ tags })
                .set('x-auth', token)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.experts).toHaveLength(1);
                    var names = []
                    var i = 0;
                    for (let expert of res.body.experts) {
                        names[i] = expert.profile.fullName;
                        i++
                    }
                    expect(names).toContain("Fady Sameh");
                    return done();
                })
        });

        it('should return experts that HAS tags based on ALL tags passed if not empty tags were passed', (done) => {

            var tags = ["web"];
            request(app)
                .post("/searchExperts")
                .send({ tags })
                .set('x-auth', token)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body.experts).toHaveLength(2);
                    var names = []
                    var i = 0;
                    for (let expert of res.body.experts) {
                        names[i] = expert.profile.fullName;
                        i++
                    }
                    expect(names).toContain("Fady Sameh");
                    expect(names).toContain("Daniel Achraf");
                    return done();
                })
        });

        after((done) => {
            User.remove({}).then(() => {
                done()
            })
        });
    })

    describe('#saveOfficeHour', () => {

        // Prepare 3 users to deal with them as experts through out this tests group
        var expert1 = {
            email: 'expert1@hosting.net',
            password: 'creativePass',
            profile: {
                fullName: 'Expert One'
            }
        };

        var expert2 = {
            email: 'expert2@hosting.net',
            password: 'creativePass',
            profile: {
                fullName: 'Expert Two'
            }
        };

        var expert3 = {
            email: 'expert3@hosting.net',
            password: 'creativePass',
            profile: {
                fullName: 'Expert Three'
            }
        };

        // Prepare 1 more user to use for sending most saveOfficeHour requests
        var normalUser = {
            email: 'shadolio@shadolioware.net',
            password: 'creativePass!!',
            profile: {
                fullName: 'Shadi Barghash'
            }
        };

        before((done) => {

            // Remove all users from the DB
            User.remove({})
                // Register expert1
                .then(() => {
                    return request(app).post("/register").send({ user: expert1 }).expect(200);
                })
                // Make him expert
                .then((res) => {
                    expert1 = res.body.user;
                    return User.findByIdAndUpdate(expert1._id, { $push: { roles: 'expert' } }, { new: true });
                })
                .then((newExpert) => {
                    expert1 = newExpert;
                })
                // Register expert2
                .then(() => {
                    return request(app).post("/register").send({ user: expert2 }).expect(200);
                })
                // Make him expert
                .then((res) => {
                    expert2 = res.body.user;
                    return User.findByIdAndUpdate(expert2._id, { $push: { roles: 'expert' } }, { new: true });
                })
                .then((newExpert) => {
                    expert2 = newExpert;
                })
                // Register expert3
                .then(() => {
                    return request(app).post("/register").send({ user: expert3 }).expect(200);
                })
                // Make him expert
                .then((res) => {
                    expert3 = res.body.user;
                    return User.findByIdAndUpdate(expert3._id, { $push: { roles: 'expert' } }, { new: true });
                })
                .then((newExpert) => {
                    expert3 = newExpert;
                })
                // Register the normal user to submit requests
                .then(() => {
                    return request(app).post("/register").send({ user: normalUser }).expect(200);
                })
                .then((res) => {
                    normalUser = res.body.user;
                })
                // end "before" block
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(err);
                });

        });

        beforeEach((done) => {
            // Remove all Office Hours from the DB before each test case
            OfficeHours.remove({}).then(() => {
                done();
            }).catch((reason) => {
                done(reason);
            });
        });

        it('should not allow guests to submit officeHour requests', (done) => {
            //not sending authentication headers, to avoind signing in using a specific user, expect error 401
            var body = {
                title: 'office hour request by an expert',
                description: 'testing that guests (not logged-in users) should not be allowed to make officeHour requests',
                experts: [expert1]
            };

            request(app)
                .post("/officeHour")
                .send(body)
                .expect(401, (err, res) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    else done();
                });
        });

        it('should not allow requests targeting with no experts field', (done) => {
            //passing title and description only, no experts array, expect error 400
            var body = {
                title: 'office hour request by an expert',
                description: 'testing that guests (not logged-in users) should not be allowed to make officeHour requests'

            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(400, (err, res) => {
                    if (err) {
                        done(err);
                    }
                    else done();
                });
        });

        it('should not allow requests targeting 0 experts', (done) => {
            //passing zero experts, expect error 400
            var body = {
                title: 'office hour request by an expert',
                description: 'testing that guests (not logged-in users) should not be allowed to make officeHour requests',
                experts: []
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(400, (err, res) => {
                    if (err) {
                        done(err);
                    }
                    else done();
                });
        });

        it('should not allow requests targeting any number of experts > 3', (done) => {
            //passing 6 experts, expect error 400
            var body = {
                title: 'office hour request by an expert',
                description: 'testing that guests (not logged-in users) should not be allowed to make officeHour requests',
                experts: [expert1, expert2, expert3, expert1, expert2, expert3]
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(400, (err, res) => {
                    if (err) {
                        done(err);
                    }
                    else done();
                });
        });

        it('should not allow requests with no title', (done) => {
            //passing no title, expect error 400
            var body = {
                description: 'testing that guests (not logged-in users) should not be allowed to make officeHour requests',
                experts: [expert1, expert3]
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(400, (err, res) => {
                    if (err) {
                        done(err);
                    }
                    else done();
                });
        });

        it('should not allow requests with no description', (done) => {
            //passing no desscription, expect error 400
            var body = {
                title: 'office hour request by an expert',
                experts: [expert1, expert3]
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(400, (err, res) => {
                    if (err) {
                        done(err);
                    }
                    else done();
                });
        });

        it('should not allow requests with no title and no description', (done) => {
            //passing no desscription and no title, expect error 400
            var body = {
                experts: [expert1, expert3]
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(400, (err, res) => {
                    if (err) {
                        done(err);
                    }
                    else done();
                });
        });

        it('should save in the DB one officeHour request for each targeted expert (3 experts)', (done) => {
            //passing 3 experts, and expecting 3 officehours corresponding to those experts
            var body = {
                title: 'office hour request by an expert',
                description: 'testing that number of officeHours corresponds to the number of experts',
                experts: [expert1, expert2, expert3]
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(200, (err, res) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    else {
                        OfficeHours.find({}).then((officeHours)=>{
                            expect(officeHours.length).toBe(3);
                            expect(officeHours[0].user.name).toBe('Shadi Barghash');
                            expect(officeHours[0].expert.name).toBe('Expert One');
                            expect(officeHours[0].title).toBe("office hour request by an expert");
                            expect(officeHours[0].description).toBe("testing that number of officeHours corresponds to the number of experts");
                            expect(officeHours[0].status).toBe("pending");
                            expect(officeHours[0].isUserReviewed).toBe(false);
                            expect(officeHours[0].isExpertReviewed).toBe(false);

                            expect(officeHours[1].user.name).toBe('Shadi Barghash');
                            expect(officeHours[1].expert.name).toBe('Expert Two');
                            expect(officeHours[1].title).toBe("office hour request by an expert");
                            expect(officeHours[1].description).toBe("testing that number of officeHours corresponds to the number of experts");
                            expect(officeHours[1].status).toBe("pending");
                            expect(officeHours[1].isUserReviewed).toBe(false);
                            expect(officeHours[1].isExpertReviewed).toBe(false);

                            expect(officeHours[2].user.name).toBe('Shadi Barghash');
                            expect(officeHours[2].expert.name).toBe('Expert Three');
                            expect(officeHours[2].title).toBe("office hour request by an expert");
                            expect(officeHours[2].description).toBe("testing that number of officeHours corresponds to the number of experts");
                            expect(officeHours[2].status).toBe("pending");
                            expect(officeHours[2].isUserReviewed).toBe(false);
                            expect(officeHours[2].isExpertReviewed).toBe(false);
                            done();
                        });
                    }
                })
        });

        it('should save in the DB one officeHour request for each targeted expert (2 experts)', (done) => {
            //passing 2 experts, and expecting 3 officehours corresponding to those experts
            var body = {
                title: 'office hour request by an expert',
                description: 'testing that number of officeHours corresponds to the number of experts',
                experts: [expert1, expert2]
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(200, (err, res) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    else {
                        OfficeHours.find({}).then((officeHours)=>{

                            expect(officeHours.length).toBe(2);
                            expect(officeHours[0].user.name).toBe('Shadi Barghash');
                            expect(officeHours[0].expert.name).toBe('Expert One');
                            expect(officeHours[0].title).toBe("office hour request by an expert");
                            expect(officeHours[0].description).toBe("testing that number of officeHours corresponds to the number of experts");
                            expect(officeHours[0].status).toBe("pending");
                            expect(officeHours[0].isUserReviewed).toBe(false);
                            expect(officeHours[0].isExpertReviewed).toBe(false);

                            expect(officeHours[1].user.name).toBe('Shadi Barghash');
                            expect(officeHours[1].expert.name).toBe('Expert Two');
                            expect(officeHours[1].title).toBe("office hour request by an expert");
                            expect(officeHours[1].description).toBe("testing that number of officeHours corresponds to the number of experts");
                            expect(officeHours[1].status).toBe("pending");
                            expect(officeHours[1].isUserReviewed).toBe(false);
                            expect(officeHours[1].isExpertReviewed).toBe(false);
                            done();
                        });
                    }
                })
        });

        it('should save only one request for each expert (no duplicates)', (done) => {
            //Only one officehour request is sonctructed per expert with no duplicates
            //test with one expert and checn that count of officeHour requests is also 1
            var body = {
                title: 'office hour request by an expert',
                description: 'testing that number of officeHours corresponds to the number of experts',
                experts: [expert1]
            };

            request(app)
                .post("/officeHour")
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(200, (err, res) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    else {
                        OfficeHours.find({}).then((officeHours)=>{

                            expect(officeHours.length).toBe(1);
                            expect(officeHours[0].user.name).toBe('Shadi Barghash');
                            expect(officeHours[0].expert.name).toBe('Expert One');
                            expect(officeHours[0].title).toBe("office hour request by an expert");
                            expect(officeHours[0].description).toBe("testing that number of officeHours corresponds to the number of experts");
                            expect(officeHours[0].status).toBe("pending");
                            expect(officeHours[0].isUserReviewed).toBe(false);
                            expect(officeHours[0].isExpertReviewed).toBe(false);
                            done();
                        });
                    }
                })
        });

        after((done) => {
            // Remove all users and office hours from the DB
            User.remove({}).then(() => {
                OfficeHours.remove({});
            })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                })
        });
    })

    describe('#acceptOfficeHour', () => {

        // Prepare two expert users and one normal user to be used in this test group
        var expert1 = {
            email: 'expert1@hosting.net',
            password: 'creativePass',
            profile: {
                fullName: 'Expert One'
            }
        };

        var expert2 = {
            email: 'expert2@hosting.net',
            password: 'creativePass',
            profile: {
                fullName: 'Expert Two'
            }
        };

        var normalUser = {
            email: 'shadolio@shadolioware.net',
            password: 'creativePass!!:D',
            profile: {
                fullName: 'Shadi Barghash'
            }
        };

        // Prepare a pending officeHour that the DB will start with to use for tests
        var officeHourWithExp1 = null;

        before((done) => {
            // Remove all users from the DB
            User.remove({})
                // Register expert 1
                .then(() => {
                    return request(app).post("/register").send({ user: expert1 }).expect(200);
                })
                // Make him expert
                .then((res) => {
                    expert1 = res.body.user;
                    return User.findByIdAndUpdate(expert1._id, { $push: { roles: 'expert' } }, { new: true });
                })
                .then((newExpert) => {
                    expert1 = newExpert;
                })
                // Register expert 2
                .then(() => {
                    return request(app).post("/register").send({ user: expert2 }).expect(200);
                })
                // Make him expert
                .then((res) => {
                    expert2 = res.body.user;
                    return User.findByIdAndUpdate(expert2._id, { $push: { roles: 'expert' } }, { new: true });
                })
                .then((newExpert) => {
                    expert2 = newExpert;
                })
                // TODO: Register normalUser
                .then(() => {
                    return request(app).post("/register").send({ user: normalUser }).expect(200);
                })
                .then((res) => {
                    normalUser = res.body.user;
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        beforeEach((done) => {
            // Remove any OfficeHours from the DB
            OfficeHours.remove({})
                // Create a new officeHour and save to DB to use for testing
                .then(() => {

                    var newOfficeHour = {
                        title: 'Embedded Systems',
                        description: 'I wish to work in IoT and Embedded Systems of cars and other vehicles',
                        status: 'pending',
                        user: {
                            _id: normalUser._id,
                            name: normalUser.profile.fullName
                        },
                        expert: {
                            _id: expert1._id,
                            name: expert1.profile.fullName
                        },
                        createdOn: new Date(),
                        lastModified: new Date()
                    };

                    return new OfficeHours(newOfficeHour).save();
                })
                .then((newOfficeHour) => {
                    officeHourWithExp1 = newOfficeHour;
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow a non-logged in user to accept officeHour request', (done) => {

            var body = {
                officeHour: {
                    suggestedSlots: {
                        slots: [new Date(2018, 4, 28), new Date(2018, 5, 5), new Date(2018, 6, 17)]
                    }
                }
            };

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .send(body)
                .expect(401)
                // Make sure our officeHour doc is still the on in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('pending');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow a non-expert user to accept officeHour request', (done) => {
            var body = {
                officeHour: {
                    suggestedSlots: {
                        slots: [new Date(2018, 4, 28), new Date(2018, 5, 5), new Date(2018, 6, 17)]
                    }
                }
            };

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .set({
                    'x-auth': normalUser.tokens[0].token
                })
                .send(body)
                .expect(403)
                // Make sure our officeHour doc is still the on in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('pending');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow an expert user to accept officeHours not targeting him/her', (done) => {
            var body = {
                officeHour: {
                    suggestedSlots: {
                        slots: [new Date(2018, 4, 28), new Date(2018, 5, 5), new Date(2018, 6, 17)]
                    }
                }
            };

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .set({
                    'x-auth': expert2.tokens[0].token
                })
                .send(body)
                .expect(400)
                // Make sure our officeHour doc is still the one in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('pending');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow accepts with no "officeHours" in the body', (done) => {
            var body = {};

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .set({
                    'x-auth': expert1.tokens[0].token
                })
                .send(body)
                .expect(400)
                // Make sure our officeHour doc is still the one in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('pending');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow accepts with no "suggestedSlots.slots" in body.officeHours', (done) => {
            var body = { officeHour: {} };

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .set({
                    'x-auth': expert1.tokens[0].token
                })
                .send(body)
                .expect(400)
                // Make sure our officeHour doc is still the one in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('pending');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow accepts with empty suggestedSlots.slots', (done) => {
            var body = {
                officeHour: {
                    suggestedSlots: {
                        slots: []
                    }
                }
            };

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .set({
                    'x-auth': expert1.tokens[0].token
                })
                .send(body)
                .expect(400)
                // Make sure our officeHour doc is still the one in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('pending');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow accepts with more than 3 suggested slots', (done) => {
            var body = {
                officeHour: {
                    suggestedSlots: {
                        slots: [new Date(2018, 4, 28), new Date(2018, 5, 5), new Date(2018, 5, 17), new Date(2018, 6, 17)]
                    }
                }
            };

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .set({
                    'x-auth': expert1.tokens[0].token
                })
                .send(body)
                .expect(400)
                // Make sure our officeHour doc is still the one in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('pending');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                });
        });

        it('should not allow accepts for an officeHour that is not originally "pending"', (done) => {
            var body = {
                officeHour: {
                    suggestedSlots: {
                        slots: [new Date(2018, 4, 28), new Date(2018, 5, 5), new Date(2018, 6, 17)]
                    }
                }
            };

            // First, update the status of the officeHour we saved to be 'accepted'
            OfficeHours.findByIdAndUpdate(officeHourWithExp1._id,
                { $set: { status: 'accepted' } }, { new: true })
                .then((acceptedOfficeHour) => {
                    officeHourWithExp1 = acceptedOfficeHour;
                })
                // Now, test the request
                .then(() => {
                    return request(app)
                        .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                        .set({
                            'x-auth': expert1.tokens[0].token
                        })
                        .send(body)
                        .expect(400);
                })
                // Make sure our officeHour doc is still the one in DB with status unchanged
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('accepted');
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log('error');
                    done(reason);
                });
        });

        it('should update the officeHour in the DB correctly if the accept request is OK.', (done) => {
            var body = {
                officeHour: {
                    suggestedSlots: {
                        slots: [new Date(2018, 4, 28), new Date(2018, 5, 5), new Date(2018, 6, 17)]
                    }
                }
            };

            request(app)
                .post("/acceptOfficeHour/" + officeHourWithExp1._id)
                .set({
                    'x-auth': expert1.tokens[0].token
                })
                .send(body)
                .expect(200)
                // Make sure our officeHour doc is still the one in DB but with status changed and fields updated
                .then(() => {
                    return OfficeHours.find({});
                })
                .then((results) => {
                    expect(results).toBeTruthy();
                    expect(results.length).toEqual(1);

                    var officeHour = results[0];

                    expect(officeHour._id).toEqual(officeHourWithExp1._id);
                    expect(officeHour.status).toEqual('accepted');

                    expect(officeHour.suggestedSlots).toBeTruthy();
                    expect(officeHour.suggestedSlots.slots).toBeTruthy();
                    expect(officeHour.suggestedSlots.slots.length).toEqual(3);

                    expect(officeHour.suggestedSlots.slots[0]).toEqual(body.officeHour.suggestedSlots.slots[0]);
                    expect(officeHour.suggestedSlots.slots[1]).toEqual(body.officeHour.suggestedSlots.slots[1]);
                    expect(officeHour.suggestedSlots.slots[2]).toEqual(body.officeHour.suggestedSlots.slots[2]);
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log('error');
                    done(reason);
                });
        });

        after((done) => {
            // At the end of this test group, remove all office hours from the DB..
            OfficeHours.remove({})
                // then remove as well all users we created.
                .then(() => {
                    return User.remove({});
                })
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(reason);
                })
        });

    })

    describe('#rejectOfficeHour', () => {

        //Creating all the users needed for the test cases
        var user = {
            email: 'user@something.com',
            password: 'user1234',
            profile: {
                "fullName": "Amr Saadi"
            }
        };

        var expert = {
            email: 'expert@something.com',
            password: 'expert',
            profile: {
                "fullName": "Mohamed Salah"
            }
        };

        var expert2 = {
            email: 'expert2@something.com',
            password: 'expert2',
            profile: {
                "fullName": "Ahmed Hassan"
            }
        };

        var RUser = {
            email: 'user@something.com',
            password: 'user1234',
            profile: {
                "fullName": "Amr Saadi"
            }
        };

        var RExpert = {
            email: 'expert@something.com',
            password: 'expert',
            profile: {
                "fullName": "Mohamed Salah"
            }
        };

        var RExpert2 = {
            email: 'expert2@something.com',
            password: 'expert2',
            profile: {
                "fullName": "Ahmed Hassan"
            }
        };

        //Before Block, clearing all users and registering the users and experts created above
        before((done) => {

            User.remove({}).then(() => {
                return request(app).post("/register").send({ user: user }).expect(200);
            }).then((res) => {
                RUser = res.body.user;
            }).then(() => {
                return request(app).post("/register").send({ user: expert }).expect(200);
            }).then((res) => {
                RExpert = res.body.user;
                return User.findByIdAndUpdate(RExpert._id, { $push: { roles: 'expert' } }, { new: true });
            }).then(() => {
                return request(app).post("/register").send({ user: expert2 }).expect(200);
            }).then((res) => {
                RExpert2 = res.body.user;
                return User.findByIdAndUpdate(RExpert2._id, { $push: { roles: 'expert' } }, { new: true });
            }).then(() => {
                done();
            })
                .catch((reason) => {
                    console.log(reason);
                    done(err);
                });
        });

        //Removing all office hours before each test
        beforeEach((done) => {
            OfficeHours.remove({}).then(() => {
                done();
            }).catch((reason) => {
                console.log(reason);
                done(reason);
            });
        });


        /*Testing if an expert can reject an office hours request sent to him*/
        it('should reject Office Hour request', (done) => {

            var officehour = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },
                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'pending',
                lastModified: new Date("2018-01-01")
            }

            body = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },

                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'pending',
                lastModified: new Date("2018-01-01")

            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save().then(() => {
            body._id = officehour._id;
                request(app).post('/rejectOfficeHour/' + body._id + '')
                    .set({ 'x-auth': RExpert.tokens[0].token }).send({ officeHour: body }).expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        OfficeHours.find({}).then((officeHours)=>{
                            expect(officeHours[0].status).toBe("rejected");
                            done();
                        });
                    });
            });

        });


        /*Testing expert should not reject a request that has already been rejected by having an
        expert try to reject a request with status 'rejected'*/
        it('should not reject an already rejected Office Hour request', (done) => {
            var officehour = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },
                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'rejected',
                lastModified: new Date("2018-01-01")
            }

            body = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },

                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'rejected',
                lastModified: new Date("2018-01-01")

            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save().then(() => {
            body._id = officehour._id;
                request(app).post('/rejectOfficeHour/' + body._id + '')
                    .set({ 'x-auth': RExpert.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                        expect(res.res.text).toBe("{\"err\":\"This office hour has already been replied to\"}")
                    })
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        OfficeHours.find({}).then((officeHours)=>{
                            expect(officeHours[0].status).toBe("rejected");
                            done();
                        });                    
                    });
            });

        });


        /*Testing expert should not reject a request that has already been rejected by having an
        expert try to reject a request with status 'accepted'*/
        it('should not reject an accepted Office Hour request', (done) => {
            var officehour = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },
                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'accepted',
                lastModified: new Date("2018-01-01")
            }

            body = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },

                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'accepted',
                lastModified: new Date("2018-01-01")

            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save().then(() => {
            body._id = officehour._id;
                request(app).post('/rejectOfficeHour/' + body._id + '')
                    .set({ 'x-auth': RExpert.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                        expect(res.res.text).toBe("{\"err\":\"This office hour has already been replied to\"}")
                    })
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        OfficeHours.find({}).then((officeHours)=>{
                            expect(officeHours[0].status).toBe("accepted");
                            done();
                        });                    
                    });
            });

        });


        /*Testing expert should not reject a request sent to another expert by creating an office hour request
        between a user and ann expert and then trying to reject it by a different expert*/
        it('should not reject an Office Hour request sent to another expert', (done) => {
            var officehour = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },
                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                /*expert2: {
                  //  _id: RExpert2._id,
                  //  name: 'Ahmed Hassan'
                },
                */
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'pending',
                lastModified: new Date("2018-01-01")
            }

            body = {
                user: {
                    _id: RUser._id,
                    name: 'Amr Saadi'
                },

                expert: {
                    _id: RExpert._id,
                    name: 'Mohamed Salah'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2018-01-01"),
                suggestedSlots: {
                    slots: null,
                    createdOn: null
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'Office hours 1',
                description: 'first office hours',
                status: 'pending',
                lastModified: new Date("2018-01-01")

            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save().then(() => {
            body._id = officehour._id;
                request(app).post('/rejectOfficeHour/' + body._id + '')
                    .set({ 'x-auth': RExpert2.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                        expect(res.res.text).toBe("{\"err\":\"This request has not been sent to you\"}")
                    })
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        OfficeHours.find({}).then((officeHours)=>{
                            expect(officeHours[0].status).toBe("pending");
                            done();
                        }); 
                    });
            });
        });

        //Removing everything
        after((done) => {
            User.remove({}).then(() => {
                OfficeHours.remove({})
            }).then(() => {
                done();
            })
        });

    })


    describe('#confirmOfficeHour', () => {
        //-----------Declarations--------------
        var user = {
            email: 'mostafa@something.com',
            password: 'something',
            profile: {
                "fullName": "Mostafa Amer"
            }
        };
        var expert = {
            email: 'Joe@something.com',
            password: 'something',
            profile: {
                "fullName": "Joe salah"
            }
        }
        var Resuser = {
            email: 'mostafa@something.com',
            password: 'something',
            profile: {
                "fullName": "Mostafa Amer"
            }
        };
        var ResExpert = {
            email: 'Joe@something.com',
            password: 'something',
            profile: {
                "fullName": "Joe salah"
            }
        };



        //----------------Before Each Execution-------------------
        before((done) => {

            // Remove all users from the DB
            User.remove({})
                // Register the normal user to submit requests
                .then(() => {
                    return request(app).post("/register").send({ user: user }).expect(200);
                })
                .then((res) => {
                    Resuser = res.body.user;

                })
                // Register expert
                .then(() => {
                    return request(app).post("/register").send({ user: expert }).expect(200);
                })
                // Make him expert
                .then((res) => {
                    ResExpert = res.body.user;
                    return User.findByIdAndUpdate(ResExpert._id, { $push: { roles: 'expert' } }, { new: true });
                })

                // end "before" block
                .then(() => {
                    done();
                })
                .catch((reason) => {
                    console.log(reason);
                    done(err);
                });
        });
        //begore each section
        beforeEach((done) => {
            // Remove all Office Hours from the DB before each test case
            OfficeHours.remove({}).then(() => {
                done();
            }).catch((reason) => {
                console.log(reason);
                done(reason);
            });
        });

        // user should be able to confirm an officehour with a chosen time slot from the suggested by the expert

        it('should confirm officehour', (done) => {
            var officehour = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: 'accepted'
                ,
                lastModified: new Date("2015-03-25")
            }
            body = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: new Date("2015-03-25"),
                    createdOn: new Date("2015-03-25")
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: ''
                ,
                lastModified: new Date("2015-03-25")
            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save()
                .then(() => {
                body._id = officehour._id;
                    request(app).post('/confirmOfficeHour/' + body._id + '')
                        .set({ 'x-auth': Resuser.tokens[0].token }).send({ officeHour: body }).expect(200)
                        .end((err, res) => {
                            if (err) {
                                return done(err);
                            }
                            OfficeHours.findOne({_id:officehour._id}).then((o)=>{
                                expect((o.chosenSlot.slot).toString()).toBe(new Date("2015-03-25").toString());
                                return done();
                        }).catch((err)=>{
                            return done(err);
                        })
                    });
                });

        });

        //user should not confirm an officehour with a chosen time slot that was not suggested by the expert

        it('should not confirm officehour which has a chosen slot that was not suggested by the expert', (done) => {
            var officehour = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: 'accepted'
                ,
                lastModified: new Date("2015-03-25")
            }
            body = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: new Date("2015-04-29"),
                    createdOn: new Date("2015-03-25")
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: ''
                ,
                lastModified: new Date("2015-03-25")
            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save()
                .then(() => {
                body._id = officehour._id;
                    request(app).post('/confirmOfficeHour/' + body._id + '')
                        .set({ 'x-auth': Resuser.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                            expect(res.res.text).toBe("{\"err\":\"This slot was not suggested by the expert\"}")
                        })
                        .end((err, res) => {
                            if (err) {
                                return done(err);
                            }
                            OfficeHours.findOne({_id:officehour._id}).then((o)=>{
                                expect(o.chosenSlot.slot).toBe(null);
                                            return done();
                                        }).catch((err)=>{
                                            return done(err);
                                        })
                                    });
                                });
                
                        });
        //user should not confirm an office hour which has a status already confirmed

        it('shouldnot confirm an already confirmed officehour', (done) => {
            var officehour = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: 'confirmed'
                ,
                lastModified: new Date("2015-03-25")
            }
            body = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: new Date("2015-03-25"),
                    createdOn: new Date("2015-03-25")
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: ''
                ,
                lastModified: new Date("2015-03-25")
            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save()
                .then(() => {
                body._id = officehour._id;
                    request(app).post('/confirmOfficeHour/' + body._id + '')
                        .set({ 'x-auth': Resuser.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                            expect(res.res.text).toBe("{\"err\":\"You have already confirmed this office hour\"}")
                        })
                        .end((err, res) => {
                            if (err) {
                                return done(err);
                            }
                            OfficeHours.findOne({_id:officehour._id}).then((o)=>{
                                expect(o.chosenSlot.slot).toBe(null);
                                            return done();
                                        }).catch((err)=>{
                                            return done(err);
                                        })
                                    });
                                });
                
                        });

        //user should not confirm an office hour which has a status not accepted

        it('shouldnot confirm an officehour that is not accepted', (done) => {
            var officehour = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: 'rejected'
                ,
                lastModified: new Date("2015-03-25")
            }
            body = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: new Date("2015-03-25"),
                    createdOn: new Date("2015-03-25")
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: ''
                ,
                lastModified: new Date("2015-03-25")
            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save()
                .then(() => {
                body._id = officehour._id;
                    request(app).post('/confirmOfficeHour/' + body._id + '')
                        .set({ 'x-auth': Resuser.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                            expect(res.res.text).toBe("{\"err\":\"This office has not been accepted\"}")
                        })
                        .end((err, res) => {
                            if (err) {
                                return done(err);
                            }
                            OfficeHours.findOne({_id:officehour._id}).then((o)=>{
                                expect(o.chosenSlot.slot).toBe(null);
                                            return done();
                                        }).catch((err)=>{
                                            return done(err);
                                        })
                                    });
                                });
                
                        });

        //user should not confirm an office hour with out chosing the time slot

        it('shouldnot confirm officehour with no chosen slots', (done) => {
            var officehour = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: 'accepted'
                ,
                lastModified: new Date("2015-03-25")
            }
            body = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: ''
                ,
                lastModified: new Date("2015-03-25")
            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save()
                .then(() => {
                body._id = officehour._id;
                    request(app).post('/confirmOfficeHour/' + body._id + '')
                        .set({ 'x-auth': Resuser.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                            expect(res.res.text).toBe("{\"err\":\"Chosen slot was not recieved\"}")
                        })
                        .end((err, res) => {
                            if (err) {
                                return done(err);
                            }
                            OfficeHours.findOne({_id:officehour._id}).then((o)=>{
                                expect(o.chosenSlot.slot).toBe(null);
                                            return done();
                                        }).catch((err)=>{
                                            return done(err);
                                        })
                                    });
                                });
                
                        });
        //user should not confirm an office hour with a body that is not of type office hour

        it('should not confirm officehour with body not officehour', (done) => {
            var officehour = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: 'accepted'
                ,
                lastModified: new Date("2015-03-25")
            }
            body = {

            }
            officehour = new OfficeHours(officehour);
            var officehourId = officehour.save()
                .then(request(app).post('/confirmOfficeHour/' + body._id + '')
                    .set({ 'x-auth': ResExpert.tokens[0].token }).send({ body }).expect(400).expect((res) => {
                        expect(res.res.text).toBe("{\"err\":\"Office Hour wasn't recieved\"}")
                    })
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        OfficeHours.findOne({_id:officehour._id}).then((o)=>{
                            expect(o.chosenSlot.slot).toBe(null);
                            return done();
                        }).catch((err)=>{
                            return done(err);
                        })
                    })
        );

        });
        //user should not confirm an office hour that doesnot belong to him
        it('should not confirm an office hour that does not belog to this user ', (done) => {
            var officehour = {
                user: {
                    _id: Resuser._id,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: null,
                    createdOn: null
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: 'accepted'
                ,
                lastModified: new Date("2015-03-25")
            }
            body = {
                user: {
                    _id: null,
                    name: 'Nothing Something'
                },
                expert: {
                    _id: ResExpert._id,
                    name: 'expert Something'
                },
                isUserReviewed: true,
                isExpertReviewed: true,
                createdOn: new Date("2015-03-25"),
                suggestedSlots: {
                    slots: [new Date("2015-03-25"), new Date("2015-03-27"), new Date("2015-03-26")],
                    createdOn: new Date("2015-03-25")
                },
                chosenSlot: {
                    slot: new Date("2015-03-25"),
                    createdOn: new Date("2015-03-25")
                },
                title: 'hi hi ihihihi',
                description: 'hihihihi hih hi hi hihi hihi',
                status: ''
                ,
                lastModified: new Date("2015-03-25")
            }
            body = new OfficeHours(body);
            officehour = new OfficeHours(officehour);
            officehour.save()
                .then(() => {
                    request(app).post('/confirmOfficeHour/' + body._id + '')
                    .set({ 'x-auth': Resuser.tokens[0].token }).send({ officeHour: body }).expect(400).expect((res) => {
                        expect(res.res.text).toBe("{\"err\":\"This request is not yours\"}")
                    })
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        OfficeHours.findOne({_id:officehour._id}).then((o)=>{
                            expect(o.chosenSlot.slot).toBe(null);
                                        return done();
                                    }).catch((err)=>{
                                        return done(err);
                                    })
                                });
                            });
            
                    });
    })
});