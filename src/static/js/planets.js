// determine the layout based on the screen size
var cellSize = 250;
var size = rowsAndColumns();
var width = size.columns * cellSize;
var height = size.rows * cellSize;
var margin = 25;
var svg = d3.select('.content svg')
    .attr('width', width + margin*2)
    .attr('height', height + margin*2);
        
var controls = d3.select('.controls');

var infoHolder = d3.select('.specs');
var planetName = infoHolder.select('h2');
var planetRadius = infoHolder.select('.radius');
var planetDistance = infoHolder.select('.distance');
var planetInfo = infoHolder.select('.info')

var defs = svg.append('svg:defs');
var solarSystem = svg.append('g')
    .classed({
        'solar-system': true
    })
    .attr('transform', 'translate(' + margin + ',' + margin + ')');

// calculate the number of columns that can fit in the window,
// and calculate the number of rows based on that
function rowsAndColumns(){
    var viewerWidth = window.innerWidth;
    var maxWidth = viewerWidth > 1000 ? 1000 : viewerWidth;
    var columnCount = Math.floor(maxWidth / 250);
    // hard coded for 8 planets
    var rowCount = Math.ceil(8/columnCount);
    return {
        columns: columnCount,
        rows: rowCount
    };
}

d3.json('/static/data/planets.json', function(error, planetData) {
    var patternWidth = 618
    var patternHeight = 200;

    // useful for drawing planets relative to one another's sizes
    var biggest = d3.max(planetData, function(d){
        return d.radius;
    });
    planetData.forEach(function(planet){
        planet.scale = (planet.radius / biggest)/2;
    });

    /*
     * useful for drawing based on their distance from the sun
    var longest = d3.max(planetData, function(d){
        return d.distance;
    });
    var xScale = d3.scale.linear()
        .domain([0, longest])
        .range([0, 1400]);
    */

    function getPosition(index){
        var row = Math.floor(index / size.columns);
        var column = index % size.columns;
        return 'translate(' + (100 + column * 250) + ',' + (100 + row * 250) + ')';
    }

    // restrict how often the resize event listener does something 
    var last = new Date();
    window.addEventListener('resize', function(event){
        var now = new Date();
        if ( now - last > 100 ) {
            resize();
            last = now;
        }
    })

    function resize(){
        var newSize = rowsAndColumns();
        // hard coded for 8 planets
        if ( newSize.columns !== size.columns ) {
            size = newSize;
            width = size.columns * cellSize;
            height = size.rows * cellSize;
            svg
                .attr('width', width + margin*2)
                .attr('height', height + margin*2);
            planetHolders.attr('transform', function(d, i){
                return getPosition(i);
            })
            
        }
    }

    var patterns = defs.selectAll('pattern')
            .data(planetData)
        .enter().append('svg:pattern')
            .attr('id', function(d){ return d.name; })
            .attr('width', patternWidth)
            .attr('height', patternHeight)
            .attr('y', patternHeight/2)
            .attr('x', Math.random()*patternWidth)
            .attr('patternUnits', 'userSpaceOnUse');

    patterns.append('image')
        .attr('xlink:href', function(d){ return d.texture; })
        .attr('width', patternWidth)
        .attr('height', patternHeight);

    var planetHolders = solarSystem.selectAll('g.planet')
            .data(planetData)
        .enter().append('g')
            .classed({
                'planet': true
            })
            .attr('transform', function(d, i){
                return getPosition(i);
            })
            .style('fill', function(d){
                return 'url(#' + d.name + ')';
            });
    var planets = planetHolders.append('circle')
        .attr('r', 100)
        .attr('transform', 'scale(0.5)');

    planetHolders.append('text')
        .text(function(d){ return d.name; })
        .attr('x', 0)
        .attr('y', 75)
        .style('text-anchor', 'middle')
        .style('fill', 'rgb(228, 213, 106)');

    var selectedPlanet;
    var highlights = planetHolders.append('rect')
        .classed({
            'selected': false
        })
        .attr('x', -100)
        .attr('y', -100)
        .attr('width', 200)
        .attr('height', 200)
        .on('click', function(d, i){
            if ( this.classList.contains('selected') ) {
                this.classList.remove('selected');
                selectedPlanet = undefined;
                clearInfo();
            } else {
                if ( selectedPlanet ) {
                    selectedPlanet.classList.remove('selected');
                }
                this.classList.add('selected');
                selectedPlanet = this;
                showInfo(d);
            }
        });

    var commas = d3.format(',');
    function showInfo(planet) {
        planetName.text(planet.name);
        planetRadius.text(commas(planet.radius) + ' KM');
        planetDistance.text(commas(planet.distance * 1000000) + ' KM');
        planetInfo.text(planet.info);
        infoHolder.classed('active', true);
    }

    function clearInfo() {
        infoHolder.classed('active', false);
    }

    /*
     * control elements
     */
    var byRadius = false;
    var radiusToggle = controls.append('label')
        .classed({
            'toggleable': true,
            'active': byRadius
        })
        .text('By Radius');
    radiusToggle.append('input')
        .attr('type', 'checkbox')
        .property('checked', false)
        .on('change', function(d){
            byRadius = this.checked;
            redrawPlanets();        
        });

    var toRotate = false;
    var rotateToggle = controls.append('label')
        .classed({
            'toggleable': true,
            'active': toRotate
        })
        .text('Rotate Planets');
    rotateToggle.append('input')
        .attr('type', 'checkbox')
        .property('checked', false)
        .on('change', function(d){
            toRotate = this.checked;
            rotatePlanets();
        })

    /*
     * control logic
     */
    function redrawPlanets(){
        radiusToggle.classed({
            'active': byRadius
        });

        planets.transition()
            .duration(1000)
            .attr('transform', function(d){
                if ( byRadius ) {
                    return 'scale(' + d.scale + ')';
                } else {
                    return 'scale(0.5)';
                }
            });
    }

    function rotatePlanets(){
        rotateToggle.classed({
            'active': toRotate
        });
        if ( toRotate ) {
            recursiveRotate();
        } else {
            patterns.transition();
        }
    }

    function recursiveRotate(){
        patterns.transition()
            .duration(5000)
            .ease('linear')
            .attr('x', function(d){
                return d3.select(this).attr('x') -640;
            })
            .each('end', recursiveRotate);
    }

});