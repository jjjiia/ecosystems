$(function() {
	queue()
		.defer(d3.json,outline)
        .defer(d3.json,buildings)
		.defer(d3.json,coffeeDistances)
		.defer(d3.json,busDistances)
        .defer(d3.json,bikeShareDistances)
		.defer(d3.json,bikeShareTraffic)
        .defer(d3.json,businesses)
        .defer(d3.json,businessTypes)
        .defer(d3.json,trees)
        .await(dataDidLoad);
})

$("#topDifferences .hideTop").hide()

function dataDidLoad(error,outline,buildings,coffeeDistances,busDistances,bikeShareDistances,bikeShareTraffic,businesses,businessTypes,trees) {
//make 1 svg for everything
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    var mapSvg = d3.select("#map").append("svg").attr("width",x*.9).attr("height",y*.9)
    drawBuildings(outline,mapSvg)
    drawBuildings(buildings,mapSvg)
    //uses csv version
    //this version of the data uses shortened, not exact lat and lngs
    //for(var tract in children.tracts){
    //    var tractNumber = children.tracts[tract]
    //    drawDots(children.points[tractNumber],mapSvg,tractNumber)
    //}
    drawCoffee(coffeeDistances,busDistances,bikeShareDistances,bikeShareTraffic,businesses,businessTypes,trees,mapSvg)

}
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 20])
    .on("zoom", zoomed);
    
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
function drawBus(data){
    var arrayData = jsonToArray(data)
    var chartSvg = d3.select("#busC").append("svg").attr("width",400).attr("height",150)
    for (var coffee in arrayData){
        var coffeeName = arrayData[coffee]["name"]
        for(var s in arrayData[coffee]["stops"]){
            var stopData = arrayData[coffee]["stops"][s]
            drawStopsBar(stopData["distance"],coffeeName)
        }
    }
    chartSvg.append("text").text("distance of bus stops from coffee").attr("x",70).attr("y",70)
    var distanceScale =d3.scale.linear().domain([0,.25]).range([1,350])
    var xAxis = d3.svg.axis()
        .scale(distanceScale)
        .tickValues(distanceScale.domain())
        .orient("top")
        
    chartSvg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform","translate(20,79)");
}
function drawStopsMap(coffee,busData){
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
	var projection = d3.geo.mercator().scale(600000).center([-71.116580,42.374059]).translate([x/3,y/2])
    var stopsArray = jsonToArray(busData[coffee]["stops"])
    var svg = d3.select("#map svg")
    svg.selectAll(".buses")
    .data(stopsArray)
    .enter()
    .append("circle")
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
    .attr("r",2)
    .attr("class","buses_"+cleanString(coffee))
    .attr("fill","red")
    
    d3.select("#bus").html("<strong>Bus</strong>: There are "+stopsArray.length+" bus stops within a .25 mile radius")
}
function drawStopsBar(distance,coffee){
    var distanceScale =d3.scale.linear().domain([0,.25]).range([0,350])
    var chart = d3.select("#busC svg")
    chart.append("rect")
    .attr("x",distanceScale(distance))
    .attr("y",0)
    .attr("width",2)
    .attr("height",40)
    .attr("opacity",.1)
    .attr("class",cleanString(coffee))
    .attr("transform","translate(20,80)")
}
function drawBikeShare(routes,bikeShareTraffic,coffee){
   // console.log(Object.keys(routes).length)
    var totalTraffic = 0
    var routeIndex = 0
    for(var route in routes){
        var color = bikeColors[routeIndex%9]
        totalTraffic+=bikeShareTraffic[route].traffic
        drawPath(routes[route],bikeShareTraffic[route].traffic,coffee,color)
    }
    d3.select("#bike").html("<strong>Bike Share</strong> Over the course of a day, there is an average of "+Math.round(totalTraffic/365)+" trips being make on "+ Object.keys(routes).length+ " popular bike share routes within .5 miles")   
}
function drawPath(route,traffic,coffee,color){
   // console.log(route)
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
    var trafficScale = d3.scale.linear().domain([500,4000]).range([.5,5])
	var projection = d3.geo.mercator().scale(600000).center([-71.116580,42.374059]).translate([x/3,y/2])
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
          .attr("d", line(route))
          .attr("fill","none")
          .attr("stroke",color)
          .attr("stroke-width",trafficScale(traffic))
          .attr("opacity",.3)
          .attr("class","routes ."+cleanString(coffee))
          
}
function coffeeStats(data){
   // console.log(data)
   // data.sort(function(a, b) {return Object.keys(b.independent).length - Object.keys(a.independent).length})
    var width = 400
    var chartSvg = d3.select("#adversityC").append("svg").attr("width",width).attr("height",200)
    var sizeScale = d3.scale.linear().domain([0,10]).range([1,10*20-1])
    var sizeScaleY = d3.scale.linear().domain([0,5]).range([0,5*20])
    chartSvg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x",function(d){
        return sizeScale(Object.keys(d.independent).length)
    })
    .attr("y",function(d){
        return sizeScale(Object.keys(d.chain).length)
    })
    .attr("height",sizeScale(1))
    .attr("width",sizeScale(1))
    .attr("class",function(d){return cleanString(d.name)})
    .attr("opacity",.1)
    .attr("transform","translate(60,70)")
    
    var xAxis = d3.svg.axis()
        .scale(sizeScale)
        .tickValues(sizeScale.domain())
        .orient("top")
        
    chartSvg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
    .attr("transform","translate(60,70)");

    var yAxis = d3.svg.axis()
        .scale(sizeScaleY)
        .tickValues(sizeScaleY.domain())
        .orient("left")
    
    chartSvg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
    .attr("transform","translate(59,70)");
          
    chartSvg.append("text").text("independent shops").attr("x",80).attr("y",50)
    chartSvg.append("text").text("high").attr("x",sizeScale(10)).attr("y",sizeScale(5)).attr("transform","translate(60,80)").style("font","12px sans-serif")
    chartSvg.append("text").text("low").attr("x",0).attr("y",0).attr("transform","translate(55,60)").style("font","12px sans-serif").attr("text-anchor","end")
    chartSvg.append("text").text("chains").attr("x",-140).attr("y",30).attr("transform", "rotate(-90)")

    
}
function drawBusiness(data){
    //var chartSvg = d3.select("#adversity").append("svg").attr("width",400).attr("height",400)
    var nOfChains = Object.keys(data.chain).length
    var nOfInd = Object.keys(data.independent).length
    d3.select("#adversity").html("<strong>Adversity</strong> shows similar competing entities within .5 miles: <br/>"+nOfChains+" chain shops<br/>"+nOfInd+" independent shops<br/>")
    d3.selectAll("#adversityC rect").attr("opacity",.1)
    d3.select("#adversityC ."+cleanString(data.name)).attr("opacity",1)
   // console.log(cleanString(data.name))
}
function drawRadius(lat,lng){
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
	var projection = d3.geo.mercator().scale(600000).center([-71.116580,42.374059]).translate([x/3,y/2])
    
    d3.select("#map svg").append("circle")
    .attr("cx",function(){
        //to get projected dot position, use this basic formula
        var projectedLng = projection([lng,lat])[0]
        return projectedLng
    })
    .attr("cy",function(){
        var projectedLat = projection([lng,lat])[1]
        return projectedLat
    })
    .attr("r",50)
    .attr("opacity",.1)
}
//var chains = ["Starbucks","Dunkin' Donuts","Peet's Coffee & Tea","Au Bon Pain","Dunkin Donuts","Tatte Fine Cookies and Cakes","Tealuxe","Starbucks Coffee"]
var businessColors =["#597FC4",
"#929094",
"#5778E9",
"#86A6C4",
"#488EEE",
"#8986AA",
"#8989E3",
"#5486AD",
"#8D9EDC",
"#55A4E4"]
var treeColors = ["#91E3A5","#76E837","#6B865D","#5ACC47","#547C35","#5EDF81","#ADDC57","#53A76E","#599A30","#B9D989"] 
var bikeColors =["#8C3E57",
"#B02994",
"#705951",
"#892570",
"#421E28",
"#B12967",
"#754752",
"#53143D",
"#8B416E",
"#6B1535"]
function formatBusinessTypes(types){
    typesArray = []
    for(var t in types){
        if(t!="uncatagorized" && t!="bus_station"){
            typesArray.push([t,types[t]])
        }
    }
    typesArray.sort(function(a, b) {return b[1]-a[1]})
    var topFive = typesArray.slice(0,5)
    var topFiveString =""
    for(var j in topFive){
        topFiveString+= topFive[j][0]+": "+topFive[j][1]+"<br/>"
    }
    return topFiveString
}
function drawDiversityMap(businesses,types,allbusinessTypes){
    //console.log(jsonToArray(businesses))
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
    var businessArray = jsonToArray(businesses)
    var topFive = formatBusinessTypes(types)
    var totalBusinesses =businessArray.length
    d3.select("#diversity").html("<strong>Diversity</strong> There are "+totalBusinesses+" businesses within .25 miles. <br/>The top businesses types are:<br/>"+topFive)
    
    var projection = d3.geo.mercator().scale(600000).center([-71.116580,42.374059]).translate([x/3,y/2])
    var mapSvg = d3.select("#map svg")
    mapSvg.selectAll(".diversity")
    .data(businessArray)
    .enter()
    .append("circle")
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
    .attr("r",1)
    .attr("opacity",.5)
    .attr("fill",function(){
        return businessColors[parseInt(Math.random()*9)]
    })
}
function drawTreesMap(trees){
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    var treesArray = jsonToArray(trees["trees"])
    var projection = d3.geo.mercator().scale(600000).center([-71.116580,42.374059]).translate([x/3,y/2])
    var mapSvg = d3.select("#map svg")
    mapSvg.selectAll(".diversity")
    .data(treesArray)
    .enter()
    .append("circle")
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
    .attr("r",1)
    .attr("opacity",.5)
    .attr("fill",function(){
        return "green"
    })
}
function drawCoffee(data,busDistances,bikeDistances,bikeShareTraffic,businesses,businessTypes,trees,svg){
    var arrayData = jsonToArray(data)
    
    coffeeStats(arrayData)
    drawBus(busDistances)
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
	var projection = d3.geo.mercator().scale(600000).center([-71.116580,42.374059]).translate([x/3,y/2])
    svg.selectAll(".dots")
        .data(arrayData)
        .enter()
        .append("circle")
        .attr("class",function(d){
            return cleanString(d.name)})
        .attr("r",5)
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
        .attr("fill",function(d){
           return "#fff"
        })
        .attr("stroke","#000")
        .on("click",function(d){
            d3.select("#chartName").html(d.name)
            d3.selectAll("#map svg circle").transition().duration(300).style("fill","#fff").style("opacity",.2)
            d3.select(this).transition().duration(300).style("fill","#000").style("opacity",1)
            d3.selectAll("#busC svg rect").transition().duration(300).style("fill","#000").style("opacity",.1)
            d3.selectAll("#busC svg ."+cleanString(d.name)).transition().duration(300).style("fill","red").style("opacity",.5)
            
            d3.selectAll("#map svg .routes").transition().duration(300).style("opacity",0).remove()
            d3.selectAll("#map svg .routes ."+cleanString(d.name)).transition().duration(300).style("opacity",1)
            
            drawStopsMap(d.name,busDistances)
            
            for(var i in d["independent"]){
                d3.selectAll("#map ."+cleanString(i)).transition().duration(300).style("fill","#aaa").style("opacity",1)
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
            drawBusiness(d)
            drawBikeShare(bikeDistances[d.name].routes,bikeShareTraffic,d.name)
            drawDiversityMap(businesses[d.name]["businesses"],businesses[d.name]["types"],businessTypes)
            drawTreesMap(trees[d.name])
            
            d3.select("#description").html(d.name+" in Cambridge is .... <br/>Has te indoctum sadipscing, molestiae necvertitur. Ius tibique mediocritatem ei, soleat suavitate elaboraret sit et.")
        })
        .style("opacity",1)
       
}
function drawBuildings(geoData,svg){
    //need to generalize projection into global var later
    var w = window
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
	var projection = d3.geo.mercator().scale(600000).center([-71.116580,42.374059]).translate([x/3,y/2])
    //d3 geo path uses projections, it is similar to regular paths in line graphs
	var path = d3.geo.path().projection(projection);
    
    //push data, add path
	svg.selectAll(".buildings")
		.data(geoData.features)
        .enter()
        .append("path")
		.attr("class","buildings")
		.attr("d",path)
		.style("fill","#fff")
		.style("stroke","#000")
	    .style("opacity",.2)
    .attr("stroke-width",.5)
        .call(zoom)
    
}
function zoomed() {
	//console.log("calling zoomed" + d3.event.scale + ", translate: "+ d3.event.translate )
	map=d3.selectAll("#map path").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	map=d3.selectAll("#map circle").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  	//map.select("circle").style("stroke-width", 1.5 / d3.event.scale + "px").style("font-size",1.5 / d3.event.scale + "px");
	//var newScaleDistance = Math.round((5/d3.event.scale)* 100) / 100
	//d3.select("#scale .scale-text").text(newScaleDistance+"km")
	//window.location.hash = JSON.stringify([d3.event.translate, d3.event.scale])
}
