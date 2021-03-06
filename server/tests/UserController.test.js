process.env.NODE_ENV = 'test';
base = process.env.PWD;
const request = require('supertest');
const expect = require('expect');
var app = require("./../server").app;

const mongoose = require('mongoose');
User = mongoose.model('User');


var id = "";
var token = "";

describe('User Controller',()=>{

    describe('#createUser',()=>{

        beforeEach((done)=>{
            User.remove({}).then(()=>{
                var user = {
                    email : 'nothing@something.com',
                    password : 'something',
                    profile : {
                        "fullName" : "Nothing Something"
                    }
                }

                user = new User(user);
                user.save().then(()=>{
                    done();
                })
            })
        });

        it('should create user with valid data and login automatically',(done)=>{
            var user = {
                email : 'something@something.com',
                password : 'something',
                profile : {
                    "fullName" : "Something Something"
                }
            }

            request(app)
            .post("/register")
            .send({user})
            .expect(200)
            .expect((res)=>{
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end((err,res)=>{
                if(err){
                    return done(err);
                }

                User.find().then((users)=>{
                    expect(users.length).toBe(2);
                    expect(users[1].tokens).toHaveLength(1);
                    expect(users[1].email).toBe("something@something.com");
                    expect(users[1].profile.fullName).toBe("Something Something");
                    User.findByCredentials("something@something.com","something").then((user)=>{
                        return done();
                    }).catch((err)=>{
                        return done(err);
                    })
                }).catch((err)=>{
                    return done(err);
                });
            })
        });

        it('should not create user with used email',(done)=>{
            var user = {
                email : 'nothing@something.com',
                password : 'something',
                profile : {
                    "fullName" : "Something Something"
                }
            }

            request(app)
            .post("/register")
            .send({user})
            .expect(400)
            .expect((res)=>{
                expect(res.res.text).toBe("Email is already taken")
            })
            .end((err,res)=>{
                if(err){
                    return done(err);
                }

                User.find().then((users)=>{
                    expect(users.length).toBe(1);
                    return done();
                }).catch((err)=>{
                    return done(err);
                });
            })
        });

        it('should not create a user with an invalid email format',(done)=>{
            var user = {
                email : 'something.com',
                password : 'something',
                profile : {
                    "fullName" : "Something Something"
                }
            }

            request(app)
            .post("/register")
            .send({user})
            .expect(400)
            .end((err,res)=>{
                if(err){
                    return done(err);
                }

                User.find().then((users)=>{
                    expect(users.length).toBe(1);
                    return done();
                }).catch((err)=>{
                    return done(err);
                });
            })
        })

        it('should not create a user with a password shorter than 6 characters',(done)=>{
            var user = {
                email : 'something@something.com',
                password : 'some',
                profile : {
                    "fullName" : "Something Something"
                }
            }

            request(app)
            .post("/register")
            .send({user})
            .expect(400)
            .end((err,res)=>{
                if(err){
                    return done(err);
                }

                User.find().then((users)=>{
                    expect(users.length).toBe(1);
                    return done();
                }).catch((err)=>{
                    return done(err);
                });
            })
        })

        it('should not create a user with a full name of 1 Character',(done)=>{
            var user = {
                email : 'something@something.com',
                password : 'some',
                profile : {
                    "fullName" : "S"
                }
            }

            request(app)
            .post("/register")
            .send({user})
            .expect(400)
            .end((err,res)=>{
                if(err){
                    return done(err);
                }

                User.find().then((users)=>{
                    expect(users.length).toBe(1);
                    return done();
                }).catch((err)=>{
                    return done(err);
                });
            })
        });


        after((done)=>{
            User.remove({}).then(()=>{
                done()
            })
        });



    })

    describe('#loginUser',()=>{

        beforeEach((done)=>{
            User.remove({}).then(()=>{
                var user = {
                    email : 'nothing@something.com',
                    password : 'something',
                    profile : {
                        "fullName" : "Nothing Something"
                    }
                }
                // POST /register will make the user start with 1 token already because
                // he is already automatically logged in
                request(app)
                .post("/register")
                .send({user})
                .expect(200)
                .end((err,res)=>{
                    id = res.body.user._id;
                    return done();
                })

            })
        });

        it('should login user with correct email and password and return token in header',(done)=>{
            var email = "nothing@something.com";
            var password = "something";
            request(app)
            .post("/login")
            .send({email,password})
            .expect(200)
            .expect((res)=>{
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end((err,res)=>{
                if(err){
                    return done(err);
                }
                User.findOne({_id : res.body.user._id}).then((user)=>{
                    expect(user.tokens).toHaveLength(2);
                    return done();
                })

            })
        });

        it('should not login user with a wrong email',(done)=>{
            var email = "nothing@nothing.com";
            var password = "something";
            request(app)
            .post("/login")
            .send({email,password})
            .expect(400)
            .expect((res)=>{
                expect(res.body.msg).toBe('email not found');
                expect(res.headers['x-auth']).toBeUndefined();
            })
            .end((err,res)=>{
                if(err){
                    return done(err);
                }
                User.findOne({_id : id}).then((user)=>{
                    expect(user.tokens).toHaveLength(1);
                    return done();
                })
            })
        });

        it('should not login user with a wrong password',(done)=>{
            var email = "nothing@something.com";
            var password = "wrong password";
            request(app)
            .post("/login")
            .send({email,password})
            .expect(400)
            .expect((res)=>{
                expect(res.body.msg).toBe('password not correct');
                expect(res.headers['x-auth']).toBeUndefined();
            })
            .end((err,res)=>{
                if(err){
                    return done(err);
                }
                User.findOne({_id : id}).then((user)=>{
                    expect(user.tokens).toHaveLength(1);
                    return done();
                })
            })
        });

        it('should not login user with missing email or password',(done)=>{
            var email = "nothing@something.com";
            request(app)
            .post("/login")
            .send({email})
            .expect(400)
            .expect((res)=>{
                expect(res.headers['x-auth']).toBeUndefined();
            })
            .end((err,res)=>{
                if(err){
                    return done(err);
                }
                User.findOne({_id : id}).then((user)=>{
                    expect(user.tokens).toHaveLength(1);
                    return done();
                })
            })
        });

        after((done)=>{
            User.remove({}).then(()=>{
                done()
            })
        });

    })

    describe('#logout',()=>{

        beforeEach((done)=>{
            User.remove({}).then(()=>{
                var user = {
                    email : 'nothing@something.com',
                    password : 'something',
                    profile : {
                        "fullName" : "Nothing Something"
                    }
                }

                request(app)
                .post("/register")
                .send({user})
                .expect(200)
                .end((err,res)=>{
                    id = res.body.user._id;
                    token = res.headers['x-auth'];
                    return done();
                })
            })
        });

        it('user should logout with correct token',(done)=>{

            request(app)
            .post("/logout")
            .set('x-auth',token)
            .expect(200)
            .end((err,res)=>{
                if(err){
                    return done();
                }
                User.findOne({_id: id}).then((user)=>{
                    expect(user.tokens).toHaveLength(0);
                    return done();
                })
            })
        });

        after((done)=>{
            User.remove({}).then(()=>{
                done()
            })
        });
    })

    describe('#ChangePassword',()=>{
        var ResUser = {
            email: '',
            password: '',
            profile: {
                "fullName": ""
            }
        }
        var user = {
            email: 'nothing@something.com',
            password: 'something',
            profile: {
                "fullName": "Nothing Something"
            }
        }
        var changePass = {
            oldPassword: 'something',
            newPassword: 'mariz'
        }
        beforeEach((done)=>{
            User.remove({}).then(()=>{
                request(app)
                .post("/register")
                .send({user})
                .expect(200)
                .end((err,res)=>{
                    ResUser = res.body.user;
                    return done();
                })

            })
        });
        it('user can change his password',(done)=>{
            request(app).post('/changePassword').set({ 'x-auth': ResUser.tokens[0].token })
            .send({ user: { oldPassword:'something',newPassword:'marizmariz'}})
            .expect(200)
            .end((err,res)=>{
                if(err){
                    return done();
                }
                User.findByCredentials(ResUser.email,"marizmariz").then((userss)=>{
                    return done();
                })
            })
        });
    });

    describe('#editProfile',()=>{

      beforeEach( (done) => {
          User.remove({}).then( () => {

              var user = {
                  email : 'something@something.com',
                  password : 'something',
                  profile : {
                      "fullName" : "Something Something",
                      "description" : "Some Description",
                      "achievements" : "Some Achievements",
                       interests : ['interest1', 'interest2', 'interest3'],
                       expertIn : ['field1', 'field2', 'field3']
                  }
              }

              user = new User(user);

              request(app)
              .post("/register")
              .send({user})
              .expect(200)
              .end((err,res)=>{
                  id = res.body.user._id;
                  token = res.headers['x-auth'];
                  return done();
              })

          })
      });

      it('should update the full name in the database', (done) => {

        var user = {
            email : 'something@something.com',
            password : 'something',
            profile : {
                "fullName" : "SomethingElse SomethingElse",
            }
        }

        request(app)
          .post("/editProfile")
          .set('x-auth',token)
          .send({user})
          .expect(200)
          .end( (err, res) => {
            if(err) {
                  return done(err);
              }
              User.find().then( (users) => {
                  expect(users.length).toBe(1);
                  expect(users[0].profile.fullName).toBe('SomethingElse SomethingElse');
                  return done();
              }).catch( (err) => {
                  return done(err);
              });
          });

      });


      it('should update the description in the database', (done) => {

        var user = {
            email : 'something@something.com',
            password : 'something',
            profile : {
                "description" : "Updated Description"
            }
        }

        request(app)
          .post("/editProfile")
          .set('x-auth',token)
          .send({user})
          .expect(200)
          .end( (err, res) => {
            if(err) {
                  return done(err);
              }
              User.find().then( (users) => {
                  expect(users.length).toBe(1);
                  expect(users[0].profile.description).toBe('Updated Description');
                  return done();
              }).catch( (err) => {
                  return done(err);
              });
          });

      });

      it('should update the achievements in the database', (done) => {

        var user = {
            email : 'something@something.com',
            password : 'something',
            profile : {
                "achievements" : "Updated Achievements"
            }
        }

        request(app)
          .post("/editProfile")
          .set('x-auth',token)
          .send({user})
          .expect(200)
          .end( (err, res) => {
            if(err) {
                  return done(err);
              }
              User.find().then( (users) => {
                  expect(users.length).toBe(1);
                  expect(users[0].profile.achievements).toBe('Updated Achievements');
                  return done();
              }).catch( (err) => {
                  return done(err);
              });
          });

      });

      it('should update the interests in the database', (done) => {

        var user = {
            email : 'something@something.com',
            password : 'something',
            profile : {
                 interests : ['UpdatedInterest1', 'UpdatedInterest2', 'UpdatedInterest3', 'UpdatedInterest4']
            }
        }

        request(app)
          .post("/editProfile")
          .set('x-auth',token)
          .send({user})
          .expect(200)
          .end( (err, res) => {
            if(err) {
                  return done(err);
              }
              User.find().then( (users) => {
                  expect(users.length).toBe(1);
                  expect(users[0].profile.interests[0]).toBe('UpdatedInterest1');
                  expect(users[0].profile.interests[1]).toBe('UpdatedInterest2');
                  expect(users[0].profile.interests[2]).toBe('UpdatedInterest3');
                  expect(users[0].profile.interests[3]).toBe('UpdatedInterest4');
                  return done();
              }).catch( (err) => {
                  return done(err);
              });
          });

      });

      it('should update the expert tags in the database', (done) => {

        var user = {
            email : 'something@something.com',
            password : 'something',
            profile : {
                 expertIn : ['UpdatedField1', 'UpdatedField2', 'UpdatedField3']
            }
        }

        request(app)
          .post("/editProfile")
          .set('x-auth',token)
          .send({user})
          .expect(200)
          .end( (err, res) => {
            if(err) {
                  return done(err);
              }
              User.find().then( (users) => {
                  expect(users.length).toBe(1);
                  expect(users[0].profile.expertIn[0]).toBe('UpdatedField1');
                  expect(users[0].profile.expertIn[1]).toBe('UpdatedField2');
                  expect(users[0].profile.expertIn[2]).toBe('UpdatedField3');
                  return done();
              }).catch( (err) => {
                  return done(err);
              });
          });

      });

      it('should not update the full name with length less than 6', (done) => {

        var user = {
            email : 'something@something.com',
            password : 'something',
            profile : {
                 "fullName" : "Hi"
            }
        }

        request(app)
          .post("/editProfile")
          .set('x-auth',token)
          .send({user})
          .expect(400)
          .end( (err, res) => {
            if(err) {
                  return done(err);
              }
              User.find().then( (users) => {
                  expect(users.length).toBe(1);
                  expect(users[0].profile.fullName).toBe('Something Something');
                  return done();
              }).catch( (err) => {
                  return done(err);
              });
          });

      });


      after( (done) => {
        User.remove({}).then( () => {
               done()
           })
      });

    })


    describe('#searchByName',()=>{
        var ResUser = {
            email: '',
            password: '',
            profile: {
                "fullName": ""
            }
        }
        beforeEach((done)=>{
            User.remove({}).then(()=>{
                var user = {
                    email : 'nothing@something.com',
                    password : 'something',
                    profile : {
                        "fullName" : "Nothing Something"
                    }
                } 
                var user1 = {
                    email: 'mariz@gmail.com',
                    password: 'pizzaaaa',
                    profile: {
                        "fullName": "Maz Samir",
                        }
                }

                var user2 = {
                    email: 'mariz2@gmail.com',
                    password: 'jelly cola',
                    profile: {
                        "fullName": "Maz Sam",
                        }
                }

                var user3 = {
                    email: 'mariz3@gmail.com',
                    password: 'sandra bullock',
                    profile: {
                        "fullName": "Maz SamSam",
                        }
                }
                user1 = new User(user1);
                user2 = new User(user2);
                user3 = new User(user3);
                user1.save().then(() => {
                    user2.save().then(() => {
                        user3.save().then(() => {
                            request(app)
                                .post("/register")
                                .send({ user })
                                .expect(200)
                                .end((err, res) => {
                                    //console.log(res.res.text);
                                    if(err){
                                        return done(err);
                                    }
                                    ResUser = res.body.user;
                                    return done();
                            })
                        })
                    })
                })

            })
        });
        it('Should return Internal error if no name is entered to be searched on',(done)=>{
            
           request(app)
           .post("/searchByName")
           .set({ 'x-auth': ResUser.tokens[0].token })
           .expect(500)
           .end((err,res)=>{
                if(err){
                    return done(err);
                }
                else{
                    return done();
                }
            });
        });
        it('Should accept if there is a user with same name ',(done)=>{
        var name ="Maz";
        request(app)
        .post("/searchByName")
        .send({name}) 
        .set({'x-auth':ResUser.tokens[0].token})
        .expect(200)
        .end((err,res)=>{
                if(err){
                    return done(err);
                }
                else{
                    expect(res.body.result.length).toBe(3);
                    return done();

                }
            });
        });
    
})

    describe('#getUserByID',()=>{
        var id = "";
        var token = "";
        before((done) => {
          User.remove().then(() => {
            var user = {
              email: 'sth@sth.com',
              password: 'abc123',
              fullName: 'nobody'
            }
            var email = 'sth@sth.com';
            var password = 'abc123';
            user = new User(user);
            user.save().then((User) => {
              id = User._id;

              request(app)
              .post('/login')
              .send({email, password})
              .end((err, res) => {
                token = res.headers['x-auth'];
                return done();
              })
            })
          })
        })

        it('no user with such id',(done)=>{
            request(app)
            .get('/user/' + id + 'a')
            .expect(404)
            done();
        });

        it('should find the user', (done) => {
          request(app)
          .get('/user/' + id)
          .set('x-auth', token)
          .expect(200)
          .end((err, res) => {
            if(err) {
              return done(err);
            }

            User.find({_id: id}).then((users)=>{
                expect(users.length).toBe(1);
                return done();
            }).catch((err)=>{
                return done(err);
            });
          })
        })
    })

});
