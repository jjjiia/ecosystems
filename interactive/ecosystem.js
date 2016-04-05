//TODO:
//get bike paths data, calculate
//get business categories, calculate and color
//get building height data and draw 
//get park data and draw 
//get park data and draw 
//explainer text for each
//overview graph for each
//rankings
//
$(function() {
	queue()
		.defer(d3.json,outline)
        .defer(d3.json,streets)
		.defer(d3.json,coffeeDistances)
		.defer(d3.json,busDistances)
        .defer(d3.json,bikeShareDistances)
		.defer(d3.json,bikeShareTraffic)
        .defer(d3.json,businesses)
        .defer(d3.json,businessTypes)
        .defer(d3.json,trees)
        .defer(d3.json,buildingsDistances)
        .await(dataDidLoad);
})
var w = window
x = w.innerWidth || e.clientWidth || g.clientWidth;
y = w.innerHeight|| e.clientHeight|| g.clientHeight;
var util = {
    scale:3000000,
    center:[-71.116580,42.374059],
    translate:[x/3,y/2]
}
var treeColors = ["#91E3A5","#76E837","#6B865D","#5ACC47","#547C35","#5EDF81","#ADDC57","#53A76E","#599A30","#B9D989"] 
var businessColors = ["#3F60BD","#6D9DBA","#708FEC","#3F4A65","#6AA3E1","#314E82","#979AC0","#3D6D8C","#517CBB","#71749B"]
var bikeColors =["#8C3E57","#B02994","#705951","#892570","#421E28","#B12967","#754752","#53143D","#8B416E","#6B1535"]
var projection = d3.geo.mercator().scale(util.scale).center(util.center).translate(util.translate)
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([-10, 10])
    .on("zoom", zoomed);

function dataDidLoad(error,outline,streets,coffeeDistances,busDistances,bikeShareDistances,bikeShareTraffic,businesses,businessTypes,trees,buildingsDistances) {
    var mapSvg = d3.select("#map").append("svg").attr("width",x*.9).attr("height",y*.9)
    drawBuildings(outline,mapSvg)
    drawBuildings(streets,mapSvg)
    
    var mapSvg = d3.select("#map svg").call(zoom)
    var dataArray = jsonToArray(coffeeDistances)    
    for(var l in dataArray){
        var locationName = dataArray[l].name
        var locationClass = cleanString(locationName)
        drawBike(bikeShareDistances[locationName].routes,locationClass)
        
        drawBuildingsByCoffee(buildingsDistances[locationName].buildings,locationClass)
        drawBusByLocation(trees[locationName].trees,locationClass,treeColors,4,0,null)
        drawBusByLocation(businesses[locationName].businesses,locationClass,businessColors,4,0,2)
        drawBusByLocation(busDistances[locationName].stops,locationClass,["red"],5,0,3)
    }
    drawLocations(dataArray,"blue")
    
    //drawBuses(busDistances)
    //drawBike(bikeShareDistances)
    //drawDiversity(businesses)
    //drawCoffee(coffeeDistances,busDistances,bikeShareDistances,bikeShareTraffic,businesses,businessTypes,trees,buildingsDistances,mapSvg)
}
function drawLocations(locationData,color){
    
    var mapSvg = d3.select("#map svg")
    mapSvg.selectAll(".circle")
        .data(locationData)
        .enter()
        .append("svg:image")
        .attr("xlink:href","x.png")
        .attr("width",15)
        .attr("height",15)
        //.attr("opacity",.5)
        .attr("class",function(d){return "locations "+cleanString(d.name)})
        .attr("x",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            //to get projected dot position, use this basic formula
            var projectedLng = projection([lng,lat])[0]
            return projectedLng
        })
        .attr("y",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            var projectedLat = projection([lng,lat])[1]
            return projectedLat
        })
        .on("click",function(d){
            d3.selectAll("#map circle").transition().style("opacity",0)
            d3.selectAll("#map ."+cleanString(d.name)).transition().duration(500).delay(function(d,i){return i}).attr("opacity",.3)
            d3.selectAll("path").attr("opacity",0)
            d3.selectAll("path ."+cleanString(d.name)).transition().duration(500).delay(function(d,i){return i*5}).attr("opacity",.5)
            
            d3.selectAll("#map .locations").transition().duration(500).attr("opacity",.3)
            d3.select(this).transition().duration(500).style("opacity",1)
            //d3.selectAll("."+cleanString(d.name)).transition().duration(500).attr("width",15)
        })
        .attr("cursor","pointer")
}
function drawBuildingsByCoffee(buildings,className){
    var buildingsArray = jsonToArray(buildings)
    for(var b in buildingsArray){
        var coordinates = buildingsArray[b].coordinates
        var distance = buildingsArray[b].distance
        var height = buildingsArray[b].height
        drawEachBuilding(coordinates,height,className)
    }
}
function drawEachBuilding(coordinates,height,className){
    var dScale = d3.scale.linear().domain([0,.20]).range([.7,0])
    var w = window
    var opacityScale = d3.scale.linear().domain([10,100]).range(["#888","#000"])
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
	var projection = d3.geo.mercator().scale(util.scale).center(util.center).translate(util.translate)
    var mapSvg = d3.select("#map svg")
    var line = d3.svg.line()
//          .interpolate("cardinal")
          .x(function(d) {
            var lat = parseFloat(d[1])
            var lng = parseFloat(d[0])
            var projectedLng = projection([lng,lat])[0]
              return projectedLng
          })
          .y(function(d) {
            var lat = parseFloat(d[1])
            var lng = parseFloat(d[0])
            var projectedLat = projection([lng,lat])[1]
              return projectedLat
          })
    mapSvg.append("path")
          .attr("d", line(coordinates))
          .attr("fill","none")
          .attr("stroke-width",.5)
          .attr("fill", opacityScale(height))
          .attr("class",className)
          .attr("opacity",0)
}

function drawBike(data,className){
    var totalTraffic = 0
    var routeIndex = 0
    for(var route in data){
       // var color = bikeColors[routeIndex%9]
        //totalTraffic+=bikeShareTraffic[route].traffic
        drawPath(data[route],className)
    }
}
function drawPath(data,className){
    var trafficScale = d3.scale.linear().domain([500,4000]).range([.5,5])
    var mapSvg = d3.select("#map svg")
    var line = d3.svg.line()
//          .interpolate("cardinal")
          .x(function(d) {
            var lat = parseFloat(d[1])
            var lng = parseFloat(d[0])
            var projectedLng = projection([lng,lat])[0]
              return projectedLng
          })
          .y(function(d) {
            var lat = parseFloat(d[1])
            var lng = parseFloat(d[0])
            var projectedLat = projection([lng,lat])[1]
              return projectedLat
          })
    
    mapSvg.append("path")
          .attr("d", line(data))
          .attr("fill","none")
          .attr("stroke",bikeColors[parseInt(Math.random()*8)])
          .attr("stroke-width",2)
          .attr("opacity",0)
          .attr("class",className)
}
function drawBusByLocation(busData,className,color,delay,opacity,radius){
    var rScale = d3.scale.linear().domain([1,40]).range([1,5])
    var mapSvg = d3.select("#map svg")
    var dataArray = jsonToArray(busData)
    mapSvg.selectAll(".circle")
        .data(dataArray)
        .enter()
        .append("circle")
        .attr("r",0)
        .attr("fill",function(d,i){
            if(color.length == 1){
                return color
            }else{
                return color[parseInt(Math.random()*(color.length-1))]
            }
            
        })
        .attr("opacity",opacity)
        .attr("class",function(d){return className})
        .attr("cx",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            //to get projected dot position, use this basic formula
            var projectedLng = projection([lng,lat])[0]
            return projectedLng
        })
        .attr("cy",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            var projectedLat = projection([lng,lat])[1]
            return projectedLat
        })
        .transition()
        .duration(1000)
        .delay(function(d,i){
            return delay
        })
        .attr("r",function(d){
            if(radius == null){
                //console.log(d.diameter)
                return rScale(d.diameter)
            }
            return radius
        })
}
   
function jsonToArray(data){
    var newArray = []
    for(var item in data){
        var entry = {}
        entry["name"]=item
        for(var key in data[item]){
            entry[key]=data[item][key]
        }
        newArray.push(entry)
    }
    return newArray
}
function cleanString(string){
    var newString = string.replace(/[^A-Z]/ig, "");
    return newString
}
function drawCoffee(data,busDistances,bikeDistances,bikeShareTraffic,businesses,businessTypes,trees,buildingsDistances,svg){
    var arrayData = jsonToArray(data)
    
    coffeeStats(arrayData)
    drawBus(busDistances)
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
	var projection = d3.geo.mercator().scale(util.scale).center(util.center).translate(util.translate)
    svg.selectAll(".dots")
        .data(arrayData)
        .enter()
        .append("svg:image")
        .attr("xlink:href","x.png")
        .attr("width",10)
        .attr("height",10)
        //.append("circle")
        .attr("class",function(d){
            return "coffee "+ cleanString(d.name)})
        //.attr("r",5)
        .attr("x",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            //to get projected dot position, use this basic formula
            var projectedLng = projection([lng,lat])[0]
            return projectedLng
        })
        .attr("y",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            var projectedLat = projection([lng,lat])[1]
            return projectedLat
        })
       // .attr("fill",function(d){
       //    return "#fff"
       // })
       // .attr("stroke","#000")
        .on("click",function(d){
            d3.select("#chartName").html(d.name)
            d3.selectAll("#map svg .coffee").transition().duration(300).style("opacity",.2)
            d3.selectAll("#map svg circle").transition().duration(300).style("opacity",0).remove()
            d3.select(this).transition().duration(300).style("opacity",1)
            d3.selectAll("#busC svg rect").transition().duration(300).style("fill","#000").style("opacity",.1)
            d3.selectAll("#busC svg ."+cleanString(d.name)).transition().duration(300).style("fill","red").style("opacity",.5)
            d3.selectAll("#map svg .buildings").transition().duration(300).style("opacity",0).remove()
            
            d3.selectAll("#map svg .routes").transition().duration(300).style("opacity",0).remove()
            d3.selectAll("#map svg .routes ."+cleanString(d.name)).transition().duration(300).style("opacity",1)
            
            drawStopsMap(d.name,busDistances)
            
            for(var i in d["independent"]){
                d3.selectAll("#map ."+cleanString(i)).transition().duration(300).style("opacity",.6)
            }
            for(var i in d["chain"]){
                d3.select("#map svg").append("circle")
                .attr("cx",function(){
                    var lat = parseFloat(d["chain"][i].lat)
                    var lng = parseFloat(d["chain"][i].lng)
                    //to get projected dot position, use this basic formula
                    var projectedLng = projection([lng,lat])[0]
                    return projectedLng
                })
                .attr("cy",function(){
                    var lat = parseFloat(d["chain"][i].lat)
                    var lng = parseFloat(d["chain"][i].lng)
                    //to get projected dot position, use this basic formula
                    var projectedLat = projection([lng,lat])[1]
                    return projectedLat
                })
                .attr("r",3)
                d3.selectAll("#map ."+cleanString(i)).style("fill","#aaa")
            }
           // drawRadius(d.lat,d.lng)
            drawTreesMap(trees[d.name])
            drawBuildingsByCoffee(buildingsDistances[d.name])
            drawBikeShare(bikeDistances[d.name].routes,bikeShareTraffic,d.name)
            drawBusiness(d)
            drawDiversityMap(businesses[d.name]["businesses"],businesses[d.name]["types"],businessTypes)
            
            d3.select("#description").html(d.name+" in Cambridge is .... <br/>Has te indoctum sadipscing, molestiae necvertitur. Ius tibique mediocritatem ei, soleat suavitate elaboraret sit et.")
        })
        .style("opacity",1)
       
}
function drawBuildings(geoData,svg){
	var path = d3.geo.path().projection(projection);
    //push data, add path
	svg.selectAll(".buildings")
		.data(geoData.features)
        .enter()
        .append("path")
		.attr("class","streets")
		.attr("d",path)
		.style("fill","#fff")
		.style("stroke","#000")
	    .style("opacity",.2)
        .attr("stroke-width",.5)
        .call(zoom)
    
}
function zoomed() {
	//console.log("calling zoomed" + d3.event.scale + ", translate: "+ d3.event.translate )
    util.scale = d3.event.scale
	util.translate = d3.event.translate
    map=d3.selectAll("#map path").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	map=d3.selectAll("#map circle").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	map=d3.selectAll("#map .trees").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	map=d3.selectAll("#map .locations").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  	//map.select("circle").style("stroke-width", 1.5 / d3.event.scale + "px").style("font-size",1.5 / d3.event.scale + "px");
	//var newScaleDistance = Math.round((5/d3.event.scale)* 100) / 100
	//d3.select("#scale .scale-text").text(newScaleDistance+"km")
	//window.location.hash = JSON.stringify([d3.event.translate, d3.event.scale])
}
