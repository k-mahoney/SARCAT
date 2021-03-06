Template.stats.onCreated(function() {
    Session.set('userView', 'stats');
    Session.set('activeRecord', null);
    Session.set('currentRecords', []);
});
Template.stats.onRendered(function() {
    var records = Records.find()
        .fetch();
    var stats = chartStats(records);
    dateChart(records, stats);
    recordsSetMap('recordsMap', records);
});
Template.stats.helpers({
    currentRecords: function() {
        return Session.get('currentRecords')
            .length;
    },
    stats: function() {
        var data = Records.find(Session.get('activeRecord'))
            .fetch();
        var stats = genList(data);
        return stats;
    },
});
var chartStats = function(records) {
    var statDiv = d3.select('#recordss');
    var context = {};
    var height;
    var width;
    var margin;
    context.countRecords = function(data) {
        var makeFlat = function(records) {
            var flatten = function(x, result, prefix) {
                if (_.isObject(x)) {
                    _.each(x, function(v, k) {
                        flatten(v, result, prefix ? prefix + '.' + k : k);
                    });
                } else {
                    result[prefix] = x;
                }
                return result;
            };
            var toGraph = _.chain(allInputs)
                .map(function(d) {
                    if (d.stats) {
                        return d;
                    }
                })
                .compact()
                .value();
            return _.chain(records)
                .map(function(d) {
                    var flat = flatten(d, {});
                    return _.pick(flat, toGraph.map(function(key) {
                        return key.field;
                    }));
                })
                .value();
        };
        var pluckDeepLinear = function(records, first, second, obj) {
            var data = _.chain(records)
                .map(function(d) {
                    return _.pluckDeep(d[first][second], obj);
                })
                .flatten()
                .value();
            data = d3.layout.histogram()
                .bins(5)
                (data)
                .map(function(a) {
                    return {
                        data: a.length,
                        name: d3.extent(a)
                            .join('-')
                    };
                });
            return data.filter(function(d) {
                return d.data;
            });
        };
        var pluckDeepOrdinal = function(records, first, second, obj) {
            var data = _.chain(records)
                .map(function(d) {
                    var vals = _.pluckDeep(d[first][second], obj);
                    return vals;
                    // vals = Array(vals.length).join('a').split('');
                })
                .flatten()
                .value();
            return _.chain(data)
                .countBy(_.identity)
                .map(function(d, e) {
                    return {
                        data: d,
                        name: e
                    };
                })
                .value();
        };
        ages = {
            options: {
                label: 'Subject - Age Range Distribution',
                number: true,
                xLabel: 'Value Ranges',
                field: 'subject.age'
            },
            'count': pluckDeepLinear(data, 'subjects', 'subject', 'age'),
        };
        sexes = {
            options: {
                label: 'Subject - Sex',
                number: true,
                field: 'subject.sex',
                xLabel: 'Values',
            },
            'count': pluckDeepOrdinal(data, 'subjects', 'subject', 'sex'),
        };
        resType = {
            options: {
                'field': 'resourcesUsed.type',
                'label': 'Individual Resources Used Total',
                'tableList': true,
                'parent': 'ResourcesUsed',
                'xLabel': 'Values',
            },
            'count': pluckDeepOrdinal(data, 'resourcesUsed', 'resource', 'type'),
        };
        resHours = {
            options: {
                'field': 'resourcesUsed.hours',
                'label': 'Resource Hours Distribution',
                'tableList': true,
                'parent': 'Resources Used',
                xLabel: 'Values Ranges',
            },
            'count': pluckDeepLinear(data, 'resourcesUsed', 'resource', 'hours'),
        };
        var etc = [ages, sexes, resType, resHours].filter(function(d) {
            return d.count.length;
        });
        var flattenedRecords = makeFlat(data);
        var grouped = _.chain(flattenedRecords)
            .reduce(function(acc, obj) {
                _.each(obj, function(value, key) {
                    if (!_.isArray(acc[key])) {
                        acc[key] = [];
                    }
                    acc[key].push(value);
                });
                return acc;
            }, {})
            .value();
        var count = _.chain(grouped)
            .map(function(d, e) {
                var options1 = _.findWhere(allInputs, {
                    field: e
                });
                var options = _.clone(options1);
                var vals;
                if (options.number) {
                    vals = d3.layout.histogram()
                        .bins(5)
                        (d)
                        .map(function(a) {
                            return {
                                data: a.length,
                                name: d3.extent(a)
                                    .join('-')
                            };
                        });
                    vals = vals.filter(function(d) {
                        return d.data;
                    });
                    options.xLabel = ' Value Ranges';
                    options.label += ' (Avg Distribution)';
                } else {
                    vals = _.chain(d)
                        .countBy(_.identity)
                        .map(function(d, e) {
                            return {
                                data: d,
                                name: e
                            };
                        })
                        .value();
                    vals = _.chain(vals)
                        .sortBy('data')
                        .reverse()
                        .value();
                    options.xLabel = ' Values';
                }
                return {
                    options: options,
                    count: vals,
                };
            })
            .sortBy(function(d) {
                return d.options.number;
            })
            .reverse()
            .sortBy(function(d) {
                return d.options.number + d.count.length;
            })
            .reverse()
            .value();
        var result = _.flatten([etc, count]);
        return result;
    };
    context.chartsObj = {};
    context.drawGraph = function(d, cont) {
        var options = d.options || {};
        var title = options.label || '';
        var klass = 'col-md-6 pad00';
        margin = {
            top: 40,
            right: 5,
            bottom: 50,
            left: 20
        };
        var container = cont
            .append('div')
            .attr('class', klass)
            .append('div')
            .attr('class', 'mar0x mar1y text-center');
        var width1 = parseInt(container.style('width'));
        width = width1 - margin.left - margin.right;
        height = 300 - margin.top - margin.bottom;
        var svg1 = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', '1px solid #e4e6e7')
        svg1.append('text')
            .attr('transform', 'translate(' + (width1) / 2 + ',' + margin.top / 2 + ')')
            .attr('class', 'title')
            .attr('text-anchor', 'middle')
            .text(title);
        var svg = svg1.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .attr('class', 'svgRecord');
        context.chartsObj[options.field] = svg;
        return svg;
    };
    context.drawBars = function(record, svg) {
        var data = record.count;
        var options = record.options || {};
        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.4);
        var y = d3.scale.linear()
            .rangeRound([height, 0]);
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(4)
            .tickSize(-width, 0, 0)
            .tickFormat('');
        x.domain(data.map(function(d) {
            return d.name;
        }));
        y.domain([0, d3.max(data, function(d) {
            return d.data;
        })]);
        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('class', 'y_label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left / 2)
            .attr('dy', '.2em')
            .attr('x', -height / 2)
            .style('text-anchor', 'middle')
            .text('Frequency');
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .append('text')
            .attr('class', 'x_label')
            .attr('fill', '#fff')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', margin.bottom * 0.75)
            .text(options.xLabel);
        var barColorIndex = 0;
        var barColors = function() {
            var colors = ['#b46928', '#cb812a'];
            barColorIndex++;
            return colors[barColorIndex % 2];
        };
        var maxBarWidth = 50;
        var bar = svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', function(d) {
                return 'translate(' + (((x.rangeBand() / 2) + x(d.name)) - (maxBarWidth / 2)) + ',' + y(d.data) + ')';
            });
        bar.append('rect')
            .attr('class', '_bar')
            .attr('fill', function() {
                return barColors();
            })
            .attr('width', Math.min.apply(null, [x.rangeBand(), maxBarWidth]))
            .attr('height', function(d) {
                return height - y(d.data);
            });
        bar.append('text')
            .attr('class', 'barText')
            //.attr('dy', '1.75em')
            .attr('y', -2)
            .attr('x', maxBarWidth / 2)
            .attr('text-anchor', 'middle')
            .text(function(d) {
                return d.data;
            });
        var allXText = svg.selectAll('.x.axis .tick text');
        var w = _.reduce(allXText[0], function(sum, el) {
            return sum + el.getBoundingClientRect()
                .width;
        }, 0);
        if (w > width * 0.8) {
            svg.selectAll('.x.axis .tick text')
                .style('text-anchor', 'middle')
                .attr('dx', '-1em')
                .attr('transform', function() {
                    return 'rotate(-10)';
                });
        }
    };
    context.drawRecords = function(records) {
        records.forEach(function(d) {
            var svg = context.drawGraph(d, statDiv);
            context.drawBars(d, svg);
        });
    };
    context.redrawRecords = function(records) {
        Session.set('currentRecords', records);
        $('.svgRecord')
            .children()
            .remove();
        if (records.length) {
            countedRecords = context.countRecords(records);
            countedRecords.forEach(function(e) {
                context.drawBars(e, context.chartsObj[e.options.field]);
            });
        }
    };
    Session.set('currentRecords', records);
    var initRecords = context.countRecords(records);
    context.drawRecords(initRecords);
    context.initRecords = initRecords;
    return context;
};
var recordsSetMap = function(context, data) {
    var geojson;
    var obj = {};
    var map = L.map(context)
    obj.map = map;
    map.scrollWheelZoom.disable();
    var defaultLayers = Meteor.settings.public.layers;
    var layers = _.object(_.map(defaultLayers, function(x, e) {
        return [e, L.tileLayer(x)];
    }));
    var firstLayer = Object.keys(layers)[0];
    layers[firstLayer].addTo(map);
    var layerControl = L.control.layers(layers)
        .addTo(map);
    var bounds = boundsString2Array(Session.get('bounds'));
    map.fitBounds(bounds);
    var mapPoints = [{
        val: 'ippCoordinates',
        sib: ['ippCoordinates2FindCoord', 'findCoord'],
        text: 'Incident Location',
        icon: 'fa-times-circle-o',
        color: '#C9302C',
        bg: 'bg-red',
        style: {
            fillColor: '#ba5552',
            color: '#931111',
            fillOpacity: 0.8,
            opacity: 0.8,
            weight: 1,
            radius: 6,
            fillOpacity: 0.7
        }
    }, {
        type: 'path',
        val: 'ippCoordinates2FindCoord',
        sib: ['ippCoordinates', 'findCoord'],
        text: '-----',
        bg: 'bg-black-line',
        style: {
            color: '#000',
            weight: 3,
            opacity: 0.4,
            dashArray: '5,5',
        }
    }, {
        val: 'findCoord',
        sib: ['ippCoordinates2FindCoord', 'ippCoordinates'],
        text: 'Find Location',
        icon: 'fa-flag-checkered',
        color: '#449D44',
        bg: 'bg-green',
        style: {
            fillColor: '#449D44',
            color: '#449D44',
            opacity: 0.8,
            weight: 1,
            radius: 6,
            fillOpacity: 0.7
        }
    }];
    activeFeatures = [];
    Session.set('activeFeatures', activeFeatures);

    function highlightFeature(e) {
        resetHighlight();
        Session.set('activeRecord', this.feature.properties.record._id);
        var properties = this.feature.properties;
        var id = properties.id;
        var sib = properties.field.sib;
        var layer = e.target;
        activeFeatures.push({
            layer: layer,
            style: properties.field.style
        });
        layer.setStyle({
            color: '#2CC5D2',
            radius: 12,
            weight: 4,
            opacity: 1,
            dashArray: '1',
            fillOpacity: 1
        });
        sib.forEach(function(d) {
            layerGroups[d].eachLayer(function(e) {
                if (e.feature.properties.id === id) {
                    activeFeatures.push({
                        layer: e,
                        style: e.feature.properties.field.style
                    });
                    e.setStyle({
                        color: '#2CC5D2',
                        radius: 12,
                        weight: 4,
                        opacity: 1,
                        dashArray: '1',
                        fillOpacity: 1
                    });
                    e.bringToFront();
                }
            });
        });
        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }
        var bounds;
        activeFeatures.forEach(function(d) {
            if (!bounds) {
                bounds = d.layer.getBounds();
                return;
            }
            bounds.extend(d.layer.getBounds());
        });
        map.fitBounds(bounds);
    }

    function resetHighlight() {
        if (activeFeatures && activeFeatures.length) {
            activeFeatures.forEach(function(e) {
                e.layer.setStyle(e.style);
            });
        }
        activeFeatures = [];
    }
    map.on('click', function() {
        resetHighlight();
        Session.set('activeRecord', false);
    });
    layerGroup = L.featureGroup();
    layerGroups = mapPoints.map(function(d) {
        var geojson = L.geoJson(null, {
            style: function() {
                return d.style;
            },
            pointToLayer: function(feature, latlng) {
                if (feature.properties.field.type === 'path') {
                    return;
                } else {
                    return L.circleMarker(latlng, d.style);
                }
            },
            onEachFeature: function(feature, layer) {
                layer.on({
                    click: highlightFeature,
                    //mouseout: resetHighlight,
                    //click: zoomToFeature
                });
            }
        });
        //geojson.addTo(map);
        layerGroup.addLayer(geojson);
        layerControl.addOverlay(geojson, d.text);
        return {
            name: d.val,
            layer: geojson
        };
    });
    layerGroups = _.object(_.map(layerGroups, function(x) {
        return [x.name, x.layer];
    }));
    //map.scrollWheelZoom.disable();
    map.on('mousedown', function() {
        if (activeFeatures.length) {
            resetHighlight(activeFeatures);
        }
    });
    var legend = L.control({
        position: 'bottomleft'
    });
    legend.onAdd = function() {
        var div = L.DomUtil.create('div', 'info legend');
        mapPoints.forEach(function(d) {
            div.innerHTML += '<div class="statLegend"><div class="small">' + d.text + '</div><div class="fa-marker ' + d.bg + '"></div></div>';
        });
        return div;
    };
    legend.addTo(map);

    function ipp2find(d, feature) {
        var ipp = d.coords.ippCoordinates;
        var find = d.coords.findCoord;
        if (!ipp || !find) {
            return;
        }
        var latlngs = [
            [ipp.lng, ipp.lat],
            [find.lng, find.lat]
        ];
        layerGroups[feature.val].addData({
            'type': 'Feature',
            'properties': {
                record: d,
                field: feature,
                id: d._id
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': latlngs
            }
        });
    }
    data.forEach(function(d) {
        mapPoints.forEach(function(feature) {
            var coords = d.coords[feature.val];
            if (coords && coords.lng && coords.lat) {
                layerGroups[feature.val].addData({
                    'type': 'Feature',
                    'properties': {
                        record: d,
                        field: feature,
                        id: d._id
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [coords.lng, coords.lat]
                    }
                });
            } else if (feature.type === 'path') {
                ipp2find(d, feature)
            }
        });
    });
    var layerGroupBounds = layerGroup.getBounds();
    if (Object.keys(layerGroupBounds)
        .length) {
        map.fitBounds(layerGroupBounds);
    }
    layerGroup.addTo(map);
    return obj;
};
