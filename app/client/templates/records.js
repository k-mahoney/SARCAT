var mapDrawn;
var drawn;
Template.records.onCreated(function (a) {
    aa = a;
    b = this
})
Template.records.onRendered(function () {
    a = this;
    drawn = false;
    /*console.log(this.data.records.fetch().map(function(d){
        return d.recordInfo;
    }));
    var tableData=this.data.records.fetch().map(function(d){
        return d.recordInfo;
    });*/
    if (Records.find()
        .count()) {
        $('.recordTable')
            .bootstrapTable();
    }



    Session.set('userView', 'records');
    var config = Config.findOne();
    var agencyProfile = config.agencyProfile;

  

        Session.set('logo', 'uploads/logo/' + config.agencyLogo);
    


    var bounds = agencyProfile.bounds;
    var newBounds = boundsString2Array(bounds);

    mapDrawn = newProjectSetMap('recordMap', newBounds, {
        "name": "coords.ippCoordinates",
        "text": "Incident Location"
    });

    $('#createRecordModal')
        .on('shown.bs.modal', function (e) {
            var lastRecord = Records.find({}, {
                    sort: {
                        created: -1
                    },
                })
                .fetch();
            lastRecord.shift();
            console.log(lastRecord);

            if (lastRecord.length) {
                var lastIncidentnum = _.find(lastRecord, function (d) {
                        if (d.recordInfo && d.recordInfo.incidentnum) {
                            return d.recordInfo.incidentnum;
                        }
                    })
                    .recordInfo.incidentnum;
                var lastMissionnum = _.find(lastRecord, function (d) {
                        if (d.recordInfo && d.recordInfo.missionnum) {
                            return d.recordInfo.missionnum;
                        }
                    })
                    .recordInfo.missionnum;

                var lastleadagency = _.find(lastRecord, function (d) {
                    if (d.recordInfo && d.recordInfo.leadagency) {
                        return d.recordInfo.leadagency;
                    }
                });

                lastleadagency = (lastleadagency) ? lastleadagency.recordInfo.leadagency : null;

                $('[name="recordInfo.incidentnum"]')
                    .attr('placeholder', 'Last Assigned Incident #: ' + lastIncidentnum);

                $('[name="recordInfo.missionnum"]')
                    .attr('placeholder', 'Last Assigned Mission #: ' + lastMissionnum);

                $('[name="recordInfo.leadagency"]')
                    .attr('value', lastleadagency)
                    .trigger('change');

            } else {
                $('[name="recordInfo.incidentnum"]')
                    .attr('value', Records.defaultNum())
                    .trigger('change');

                $('[name="recordInfo.missionnum"]')
                    .attr('value', Records.defaultNum())
                    .trigger('change');

                $('[name="recordInfo.leadagency"]')
                    .attr('value', lastleadagency)
                    .trigger('change');
            }

            mapDrawn.reset();
        });

});
Template.records.helpers({
    isAdmin: function () {
        return Roles.userIsInRole(Meteor.userId(), ['admin']);
    },
    /*lists: function () {
        return Records.find({}, {
            sort: {
                name: 1
            }
        });
    },*/
    noRecords: function () {
        return !Records.find({}, {
                sort: {
                    name: 1
                }
            })
            .fetch()
            .length;
    },
    newRecord: function () {
        return Records.findOne(Session.get('newRecord'));
    },
    createNewBtn: function () {
        var profile = Config.findOne()
            .agencyProfileComplete;
        var agencyMapComplete = Config.findOne()
            .agencyMapComplete;
        var role = Roles.userIsInRole(Meteor.userId(), ['admin', 'editor']);
        return profile && agencyMapComplete && role;
    },

});
Template.records.events({
    'click #createRecordModal button': function () {
        // $('#createRecordModal').modal('hide')
    },
    'click .js-deleteRecord': function () {
        var record = Records.findOne(Session.get('newRecord'));
        Meteor.call('removeRecord', record, function (error, d) {

        });
    },

    'click .modal-backdrop': function () {
        var record = Records.findOne(Session.get('newRecord'));
        Meteor.call('removeRecord', record, function (error, d) {
            console.log(error, d)
        })
    },
    'click .recordStats': function (event, template) {
        console.log(drawn)
        if (drawn) {
            return;
        }
        drawn = true;
        template.$('a[data-toggle="tab"][href="#recordStats"]')
            .on('shown.bs.tab', function (e) {

                var records = Records.find()
                    .fetch();

                data = recordStats(records);

                var coords = records.map(function (d) {
                    return d.coords
                });
                console.log(records, coords);
                if (!records.length) {
                    return;
                }
                var mapBounds = coords[0].bounds;
                mapBounds = boundsString2Array(mapBounds);

                map = statsSetMap('statsMap', mapBounds);

                var mapPoints = {
                    "ippCoordinates": {
                        "val": "ippCoordinates",
                        "name": "coords.ippCoordinates",
                        "text": "IPP Location. <br>Direction of Travel (hover to edit): <div class=\"fa fa-arrow-circle-up fa-2x fa-fw travelDirection\"></div>",
                        "icon": "fa-times-circle-o text-black"
                    },
                    "decisionPointCoord": {
                        "val": "decisionPointCoord",
                        "name": "coords.decisionPointCoord",
                        "text": "Decision Point",
                        "icon": "fa-code-fork text-danger"
                    },
                    "destinationCoord": {
                        "val": "destinationCoord",
                        "name": "coords.destinationCoord",
                        "text": "Intended Destination",
                        "icon": "fa-bullseye text-default"
                    },
                    "revisedLKP-PLS": {
                        "val": "revisedLKP-PLS",
                        "name": "coords.revisedLKP-PLS",
                        "text": "Revised IPP",
                        "icon": "fa-times-circle-o 4x text-success"
                    },
                    "findCoord": {
                        "val": "findCoord",
                        "name": "coords.findCoord",
                        "text": "Find Location",
                        "icon": "fa-male text-success"
                    },
                    "intendedRoute": {
                        "val": "intendedRoute",
                        "name": "coords.intendedRoute",
                        "text": "Intended Route",
                        "path": {
                            "stroke": "#018996"
                        }
                    },
                    "actualRoute": {
                        "val": "actualRoute",
                        "name": "coords.actualRoute",
                        "text": "Actual Route",
                        "path": {
                            "stroke": "#3C763D",
                            "weight": 8
                        }
                    }
                };
                _.each(mapPoints, function (d) {
                    coords.forEach(function (e) {
                        if (!e) {
                            return;
                        }
                        var latlng = e[d.val];
                        if (!latlng) {
                            return
                        };
                        d.coords = latlng;
                        map.add(d);
                    });

                })

                map.fitBounds();
            });

    },
    'click .openRecord': function (event, template) {
        if (event.target.className === 'bs-checkbox') {
            return;
        }
        Router.go('form', {
            _id: event.currentTarget.id
        });
    },
    'click .deleteRecord': function (event, template) {
        var toDelete = $('.bs-checkbox [name="btSelectItem"]:checked')
            .parent()
            .parent()
            .map(function (d) {
                return {
                    id: this.id,
                    name: Records.findOne(this.id)
                        .recordInfo.name
                };
            });
        if (!toDelete.length) {
            return;
        }
        var message = 'Are you sure you want to delete the following records: ' + _.map(toDelete, function (d) {
                return d.name;
            })
            .join(', ');

        if (confirm(message)) {
            toDelete.each(function (e, d) {
                console.log(d)
                Meteor.call('removeRecord', d.id, function (error, d) {

                });
            });
            Meteor._reload.reload();
            return true;
        } else {
            return false;
        }

    },

    'click .js-newRecord': function (event, template) {
        var list = {
            userId: Meteor.userId()
        };
        Meteor.call('addRecord', list, function (error, d) {
            if (error) {
                return console.log(error);
            }

            Session.set('newRecord', d);
        });

    }
});
