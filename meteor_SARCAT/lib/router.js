Router.configure({
    // we use the  appBody template to define the layout for the entire app
    layoutTemplate: 'appBody',
    // the appNotFound template is used for unknown routes and missing lists
    notFoundTemplate: 'appNotFound',
    // show the appLoading template whilst the subscriptions below load their data
    loadingTemplate: 'appLoading',
    // wait on the following subscriptions before rendering the page to ensure
    // the data it's expecting is present
    waitOn: function() {
        return [
            Meteor.subscribe('publicLists'),
            Meteor.subscribe('privateLists'),
            Meteor.subscribe('userData'),
            Meteor.subscribe('config'),
            //Meteor.subscribe('Records'),
            //Meteor.subscribe('clientState')
        ];
    }
});
//dataReadyHold = null;
if (Meteor.isClient) {
    //AutoForm.setDefaultTemplateForType('afQuickField', 'addOptions');
    //console.log(Session.get('defaultAdmin'));
    // Keep showing the launch screen on mobile devices until we have loaded
    // the app's data
    //dataReadyHold = LaunchScreen.hold();
    // Show the loading screen on desktop
    Router.onBeforeAction('loading', {
        except: ['join', 'signin']
    });
    Router.onBeforeAction('dataNotFound', {
        except: ['join', 'signin']
    });
    //Router.onBeforeAction('loading');
}
var IR_Filters = {
    initSetup: function() {
        if (Config.findOne({
                initSetup: true
            })) {
            Router.go('adminSetup', Config.findOne());
        }
        this.next();
        //if (Meteor.users.find().count()) {
        //this.render('adminSetup');
        //Router.go('adminSetup');
        //}
        /*else {
                        _this.render('signin');
                    }*/
    },
    // All standard subscriptions you need before anything works
    // the .wait() makes sure that it continues only if the subscription
    // is ready and the data available
    // Use: global
    baseSubscriptions: function() {
        this.subscribe('userData').wait();
    },
    // show login if a guest wants to access private areas
    // Use: {only: [privateAreas] }
    isLoggedIn: function(pause) {
        if (!(Meteor.loggingIn() || Meteor.user())) {
            Notify.setError(__('Please login.')); // some custom packages
            this.render('login');
            pause();
        }
    },
    // make sure to scroll to the top of the page on a new route
    // Use: global
    scrollUp: function() {
        $('body,html').scrollTop(0);
    },
    // if this route depends on data, show the NProgess loading indicator
    // http://ricostacruz.com/nprogress/
    // Use: global
    startNProgress: function() {
        if (_.isFunction(this.data)) {
            NProgress.start();
        }
    },
    // only show route if you are an admin
    // using https://github.com/alanning/meteor-roles
    // Use: {only: [adminAreas]}
    isAdmin: function(pause) {
        if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) {
            this.render();
            pause();
        }
    },
};
Router.map(function() {
    //this.onBeforeAction(IR_BeforeHooks.noAdmin);
    this.onBeforeAction(IR_Filters.initSetup);
    this.route('home', {
        path: '/',
        /*onBeforeAction: function() {
            //var _this = this;
            routeDefaults.noAdmin(this);
            //Router.go('join');
            //Router.go('signin');
            /*var defaultAdmin = Meteor.users.find().count();
            if (Meteor.users.find().count()) {
                _this.render('adminSetup');
            } else {
                _this.render('signin');
            }*/
        //this.render('join');
        /* if (Meteor.user()) {
                 Router.go('form', Records.findOne());
             } else {
                 Router.go('signin');
                // this.render('adminSetup')
             }
        },*/
        action: function() {
            //Router.go('signin');
            if (Meteor.user()) {
                Router.go('user-home', Meteor.user());
            } else {
                Router.go('signin');
            }
        }
    });
    this.route('adminSetup', {
        path: '/adminSetup/:_id',
        layoutTemplate: null,
        onBeforeAction: function() {
            //this.onBeforeAction(IR_Filters.initSetup;
            this.next();
            //}
        },
        data: function() {
            return Config.findOne();
        },
        action: function() {
            this.render();
        }
    });
    this.route('appLoading');
    this.route('join');
    this.route('signin');
    this.route('user-home', {
        path: '/user/:_id',
        onBeforeAction: function() {
            //this.todosHandle = Meteor.subscribe('Records', this.params._id);
            //if (this.ready()) {
            //    dataReadyHold.release();
            this.next();
            //}
        },
        /*waitOn: function() {
            console.log('WAIT');
            return Meteor.subscribe('privateLists');
        },*/
        data: function() {
            return Meteor.user();
        },
        action: function() {
            this.render();
        }
    });
    this.route('form', {
        path: '/form/:_id',

        /*onBeforeAction: function() {
            console.log('BEFORE')
            this.next();
            this.todosHandle = Meteor.subscribe('privateLists', this.params._id);
            if (this.ready()) {
                console.log('READY');
                console.log(this.params._id)
                    // Handle for launch screen defined in app-body.js
                console.log(this.params._id)
                dataReadyHold.release();
                this.next();
            }
        },*/

        /*waitOn: function() {
            console.log('WAIT');
            return Meteor.subscribe('privateLists');
        },*/
        data: function() {
            var obj = {};
            obj.record = Records.findOne(this.params._id);
            return obj;
            /*if (!this.ready()) {
                return;
            }*/
            /*var obj = {};
            obj.posts = [{
                title: 'Did you know that...',
                text: 'If you yelled for 8 years, 7 months and 6 days, you would have produced enough sound energy to heat up one cup of coffee.'
            }, {
                title: 'Hello World',
                text: 'Hi, i am new here!'
            }];
            obj.record=Records.findOne(this.params._id);
            obj.test=['aaa','bbbb','ccc'];
            return obj;*/
            //var obj = {};
            //obj.currentData=Records.findOne(this.params._id);
            //return obj;
            /*console.log('DATA');
            console.log(this.params._id);
            var record = Records.findOne(this.params._id);
            console.log(record);
            return record;*/

        },
        action: function() {
            this.render();
        }
    });
});

/*
meteor add insecure
meteor add autopublish


meteor remove insecure
meteor remove autopublish


*/