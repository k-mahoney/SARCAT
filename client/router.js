
        Tracker.autorun(function () {
            var config = Config.findOne();
            if (config) {
                Session.set('records', Records.find().fetch())
                Session.set('config', config);
                Session.set('agencyProfile', config.agencyProfile);
                Session.set('bounds', config.bounds);
                Session.set('bounds', config.bounds);
                Session.set('logo', config.agencyLogo);
                if (config.agencyLogo) {
                    Session.set('logoSrc', 'uploads/logo/' + config.agencyLogo);
                }
                Session.set('measureUnits', config.measureUnits);
            }
        });
        settings = Meteor.settings.public;
        //config = Meteor.settings.public.config;
        //insertSampleRecords()

Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context);
});
Handlebars.registerHelper('isEqual', function (a, b) {
    return a === b;
});
Router.configure({
    layoutTemplate: 'appBody',
    notFoundTemplate: 'appNotFound',
    loadingTemplate: 'appLoading',
    waitOn: function () {
        return [
            //Meteor.subscribe('records'),
            Meteor.subscribe('userData'),
            Meteor.subscribe('config'),
            Meteor.subscribe('roles'),
            Meteor.subscribe('audit'),
        ];
    },
    onBeforeAction: function () {
        if (Config.findOne()
            .initSetup) {
            Router.go('adminSetup');
        }
        this.next();
    },
    action: function () {
        if (this.ready()) {
            this.render();
        } else {
            this.render('appLoading');
        }
    }
});
Router.route('home', {
    path: '/',
    action: function () {
        if (Meteor.user()) {
            if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
                Router.go('admin');
            } else {
                //Router.go('records', Meteor.user());
                Router.go('userhome', Meteor.user());
            }
        } else {
            Router.go('signin');
        }
    }
});
Router.route('adminSetup', {
    path: '/adminSetup',
    //layoutTemplate: null,
    onBeforeAction: function () {
        if (!Config.findOne()
            .initSetup) {
            Router.go('home');
        }
        this.next();
    },
    action: function () {
        if (this.ready()) {
            this.render();
        }
    }
});
Router.route('join');
Router.route('signin');
Router.route('appLoading');
Router.route('profiles');
Router.route('about');
//Router.route('userhome');
//Router.route('forgot-password');
Router.route('userhome', {
    path: '/userhome',
    waitOn: function () {
        return this.subscribe('records');
    },
    action: function () {
        if (!Meteor.userId()) {
            Router.go('home');
        }
        if (this.ready()) {
            this.render();
        }
    }
});
Router.route('records', {
    path: '/records',
    waitOn: function () {
        return this.subscribe('records');
    },
    action: function () {
        if (!Meteor.userId()) {
            Router.go('home');
        }
        if (this.ready()) {
            this.render();
        }
    }
});
Router.route('stats', {
    path: '/stats',
    waitOn: function () {
        return this.subscribe('records');
    },
    action: function () {
        if (!Meteor.userId()) {
            Router.go('home');
        }
        if (this.ready()) {
            this.render();
        }
    }
});
Router.route('admin', {
    path: '/admin',
    waitOn: function () {
        return this.subscribe('userData');
    },
    data: function () {
        var obj = {};
        obj.users = Meteor.users.find();
        obj.records = Records.find();
        obj.title = 'ddd'
        return obj;
    },
    action: function () {
        if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ['admin'])) {
            Router.go('home');
        }
        if (this.ready()) {
            this.render();
        }
    }
});
Router.route('form', {
    path: '/form/:_id',
    waitOn: function () {
        return this.subscribe('item', this.params._id);
    },
    data: function () {
        var params = this.params;
        //console.log(params)
        //var obj = {};
        //obj.record = Records.find({_id:this.params._id});
        //console.log(obj.record)
        //return obj;
        return Records.findOne({
            _id: params._id
        })
    },
    action: function () {
        if (!Meteor.userId()) {
            Router.go('home');
        }
        if (this.ready()) {
            this.render();
        }
    }
});
/*
meteor add insecure
meteor add autopublish
meteor remove insecure
meteor remove autopublish
Resource Responses
*/