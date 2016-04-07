//TODO:
//get business categories, calculate and color
//get park data and draw 
//explainer text for each
//overview graph for each
//rankings
//
$(function() {
	queue()
		.defer(d3.json,outline)
        .defer(d3.json,streets)
		.defer(d3.json,busDistances)
        .defer(d3.json,bikeShareDistances)
        .defer(d3.json,businesses)
        .defer(d3.json,trees)
        .defer(d3.json,buildingsDistances)
        .defer(d3.csv,potentialLocation)
        .defer(d3.json,openspaceDistances)
        .defer(d3.json,complementary)
        .defer(d3.json,competition)
        .await(dataDidLoad);
})
var w = window
x = w.innerWidth || e.clientWidth || g.clientWidth;
y = w.innerHeight|| e.clientHeight|| g.clientHeight;
var util = {
    scale:2000000,
    center:[-71.116580,42.374059],
    translate:[x/2,y/2]
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
function dataDidLoad(error,outline,streets,busDistances,bikeShareDistances,businesses,trees,buildingsDistances,potentialLocation,openspaceDistances,competition,complementary) {
    var mapSvg = d3.select("#map").append("svg").attr("width",x).attr("height",y)
    drawBuildings(outline,mapSvg)
    drawBuildings(streets,mapSvg)
    var mapSvg = d3.select("#map svg").call(zoom)
    var rankingData = {}
    var rankingArray = []
    var treeScale = d3.scale.linear().domain([0,1000]).range([0,40])
    
    
    for(var l in potentialLocation){
        var locationName = potentialLocation[l].id
        var locationClass = "_"+locationName
        drawBike(bikeShareDistances[locationName].routes,locationClass)
        drawBuildingsByCoffee(buildingsDistances[locationName].buildings,locationClass,null)
        drawBuildingsByCoffee(openspaceDistances[locationName].buildings,locationClass,"green")
        drawEntitiesByLocation(trees[locationName].trees,locationClass,treeColors,4,0,null)
        drawEntitiesByLocation(businesses[locationName].businesses,locationClass,"business",4,0,3)
        drawEntitiesByLocation(busDistances[locationName].stops,locationClass,["#000"],5,0,4)
        drawRectByLocation(competition[locationName].buildings,locationClass,["black"],5,0,8,"triangle-down")
        drawRectByLocation(complementary[locationName].buildings,locationClass,["black"],5,0,8,"triangle-up")
    
        rankingData[l]={}
        rankingData[l]["name"]=String(parseInt(l)+1)
        rankingData[l]["openSpace"]=Object.keys(openspaceDistances[locationName].buildings).length
        rankingData[l]["trees"]=treeScale(Object.keys(trees[locationName].trees).length)
        rankingData[l]["business"]=Object.keys(businesses[locationName].businesses).length
        rankingData[l]["bike"]=Object.keys(bikeShareDistances[locationName].routes).length
        console.log(rankingData[l]["bike"])

        rankingArray.push(rankingData[l])
    }
    drawLocations(potentialLocation)
    drawBusinessColorKey()
    var keys = ["trees","bike","openSpace","business"]
    drawRankings(rankingArray)
   // var tableData = formatTable()
   // drawTable(tableData)
}
function drawRankings(data){    
    var keys = d3.keys(data[0]).filter(function(key) {
      return key != "name";
    });
    
    d3.selectAll("thead td").data(keys).on("click", function(k) {
        console.log(k)
      tr.sort(function(a, b) { console.log([b,a]); return b[k] - a[k]; });
      console.log(tr)
    });
  var tr = d3.select("tbody").selectAll("tr")
      .data(data)
    .enter().append("tr");
    
    tr.append("th")
        .text(function(d) {return d.name; });

    tr.selectAll("td")
        .data(function(d) {return keys.map(function(k) { return d[k]; }); })
        .enter().append("td").append("svg")
        .attr("width", 60)
        .attr("height", 14)
        .append("rect")
        .attr("height", 14)
        .attr("width", function(d) {return d; })
        .attr("fill","#000")
}
function formatTable(){
    var keys = ["tree","bus","bike","buildings","Total"]
    var data = []
    for(var place =0;place<12;place++){
        placeData={}
        for(var k in keys){
            placeData["id"]=String(place)
            placeData[keys[k]]=parseInt(Math.random()*10)
        }
        data.push(placeData)
    }
    return data
}
function drawTable(data){
    console.log(data)
    console.log(tableSort(data,"tree"))
    var w = 500
    var h = 700
    var margin = 100
    var columnWidth = (h-margin)/data.length
    var tableSvg = d3.select("#chart").append("svg").attr("width",w).attr("height",h)
    
    var tableSvg = d3.select("#chart svg").append("g")
    var rScale = d3.scale.linear().domain([0,10]).range([2,columnWidth-5])

    var categories =   Object.keys(data[0])
        tableSvg.selectAll(".table")
        .data(categories)
        .enter()
        .append("text")
    .attr("class","categoryLabel")
        .text(function(d,i){return d})
        .attr("x",function(d,i){return i*columnWidth})
        .attr("y",-10)    
        .attr("transform","translate("+(margin)+","+margin+")")
        .attr("text-anchor","end")
        .on("click",function(d){updateTable(data,d,columnWidth)})

    for( var l in data){
        var arrayFormat = []
        for(var j in data[l]){
            arrayFormat.push(data[l][j])
        }
        
        tableSvg.selectAll(".table")
            .data(arrayFormat)
            .enter()
            .append("circle")
            .attr("class",function(d){console.log(d);return d})
            .attr("cx",function(d,i){return i*columnWidth})
            .attr("cy",l*columnWidth)
            .attr("r",function(d,i){return d})
            .attr("transform","translate("+margin+","+margin+")")
        
        tableSvg.append("text").text(l).attr("x",0).attr("y",l*columnWidth).attr("class","id")     
            .attr("transform","translate("+margin+","+margin+")")

    }
}
function updateTable(data,column,columnWidth){
    var data = tableSort(data,column)
     for( var l in data){
         console.log(l)
        d3.selectAll("#chart circle")
            .transition()
           // .attr("cx",function(d,i){return i*columnWidth})
            .attr("cy",l*columnWidth)
        d3.selectAll("#chart.id")
            .transition()
           // .attr("cx",function(d,i){return i*columnWidth})
            .attr("cy",l*columnWidth)
     }
}
function tableSort(data,column){
    data.sort(function(a,b){
        return parseFloat(b[column]) - parseFloat(a[column])
    })
    for (var i in data){
        console.log(data[i])
    }
    return data
}
function drawBusinessColorKey(){
    var locationL = d3.select("#locationL").append("svg").attr("width",200).attr("height",40)
    locationL.append("text").text("Potential Locations").attr("x",30).attr("y",30)
    locationL.append("svg:image")
        .attr("xlink:href","x.png").attr("x",10).attr("y",18).attr("width",15).attr("height",15)
    
    var legend = d3.select("#otherL").append("svg").attr("width",200).attr("height",400)
   
    var catArray = []
    for(var cat in colorsCategories){
        catArray.push([cat,colorsCategories[cat]])
    }
    var grayArray = new Array(12)
    legend.append("text").text("Building Footprints:").attr("x",12).attr("y",260)
    var grayScale = d3.scale.linear().domain([1,12]).range(["#ddd","#000"])
    legend.selectAll("rect").data(grayArray).enter()
        .append("rect")
        .attr("x",function(d,i){return i*12+12})
        .attr("y",270)
        .attr("width",10)
        .attr("height",20)
        .attr("fill",function(d,i){return grayScale(i)})
    legend.append("text").text("<2 Stories").attr("x",18).attr("y",292).attr("class","categoryLabel")
    legend.append("text").text(">18 Stories").attr("x",150).attr("y",292).attr("class","categoryLabel")
    
    
    legend.append("circle").attr("r",5).attr("cx",20).attr("cy",360).attr("fill","#000")
    legend.append("rect").attr("width",10).attr("height",2).attr("x",15).attr("y",380).attr("fill","#000")
    
    legend.append("text").text("Bus Stops").attr("x",30).attr("y",364)
    legend.append("text").text("Bike Lanes").attr("x",30).attr("y",384)
    
    legend.append("path")      
        .attr("d",d3.svg.symbol().type("triangle-down"))
        .attr("transform","translate(20,200)")
        .attr("fill","#000")
        .attr("class","schoolLegend")
    legend.append("path")      
        .attr("d",d3.svg.symbol().type("triangle-up"))
        .attr("transform","translate(20,220)")
        .attr("fill","#000")
        .attr("class","schoolLegend")
    legend.append("text").text("competing schools").attr("x",30).attr("y",204)
    legend.append("text").text("complementary schools").attr("x",30).attr("y",224)
    
    legend.selectAll(".legend")
    .data(catArray).enter().append("circle")
    .attr("cx",20)
    .attr("cy",function(d,i){return i*20+20})
    .attr("r",5)
    
    .attr("fill",function(d){
        var colorIndex = d[1]; 
        return businessTypeColorsArray[colorIndex]})
    legend.selectAll(".legend").data(catArray).enter().append("text")
    .attr("x",30)
    .attr("y",function(d,i){return i*20+24})
    .attr("fill",function(d){
            var colorIndex = d[1]; 
            return businessTypeColorsArray[colorIndex]
    })
    .text(function(d){return d[0]})
    
}
function drawLocations(locationData,locationClass){
    
    var mapSvg = d3.select("#map svg")
    mapSvg.selectAll(".circle")
        .data(locationData)
        .enter()
        .append("circle")
        .attr("r",14)
    //    .append("svg:image")
     //   .attr("xlink:href","x.png")
       // .attr("width",15)
    //    .attr("height",15)
        //.attr("opacity",.5)
        .attr("class",function(d){
            return "locations"})
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
        .attr("fill","black")
        .on("click",function(d){
            d3.selectAll("#map circle").transition().style("opacity",0)
            d3.selectAll("#map rect").transition().style("opacity",0)
            d3.selectAll("#map path").attr("opacity",0)
            d3.selectAll("._"+d.id).transition().duration(500).delay(function(d,i){ return i}).attr("opacity",.7)
            
            d3.selectAll("#map .locations").transition().duration(500).attr("opacity",.3)
            d3.select(this).transition().duration(500).style("opacity",1)
            //d3.selectAll("."+cleanString(d.name)).transition().duration(500).attr("width",15)
        })
        .attr("cursor","pointer")
        
        
    mapSvg.selectAll(".text")
        .data(locationData)
        .enter()
        .append("text")
        .attr("text-anchor","center")
        .text(function(d){return d.id})
        .attr("class",function(d){
            return "locations"})
        .attr("x",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            //to get projected dot position, use this basic formula
            var projectedLng = projection([lng,lat])[0]
            return projectedLng-6
        })
        .attr("y",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            var projectedLat = projection([lng,lat])[1]
            return projectedLat+5
        })
        .attr("fill","#fff")
        .on("click",function(d){
            d3.selectAll("#map circle").transition().style("opacity",0)
            d3.selectAll("#map rect").transition().style("opacity",0)
            d3.selectAll("#map path").attr("opacity",0)
            d3.selectAll("._"+d.id).transition().duration(500).delay(function(d,i){ return i}).attr("opacity",.7)
            
            d3.selectAll("#map .locations").transition().duration(500).attr("opacity",.3)
            d3.selectAll("text").transition().duration(500).attr("opacity",1)
            
            d3.select(this).transition().duration(500).style("opacity",1)
            //d3.selectAll("."+cleanString(d.name)).transition().duration(500).attr("width",15)
        })
        .style("font-family","Helvetica")
        .attr("cursor","pointer")
}
function drawBuildingsByCoffee(buildings,className,color){
    var buildingsArray = jsonToArray(buildings)
    for(var b in buildingsArray){
        var coordinates = buildingsArray[b].coordinates
        var distance = buildingsArray[b].distance
        var height = buildingsArray[b].height
        drawEachBuilding(coordinates,height,className,color)
    }
}
function drawEachBuilding(coordinates,height,className,color){
    var dScale = d3.scale.linear().domain([0,.20]).range([.7,0])
    var w = window
    var opacityScale = d3.scale.linear().domain([2,16]).range(["#FFF","#000"])
    
  //  console.log([height,opacityScale(height)])
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
          .attr("fill", function(){
              if(color == null){
           return opacityScale(height/8)
                      
              }else{return color}
          })
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
          .attr("stroke","#000")
          .attr("stroke-width",1)
          .attr("opacity",0)
          .attr("class",className)
}
function drawEntitiesByLocation(busData,className,color,delay,opacity,radius){
    var rScale = d3.scale.linear().domain([1,40]).range([.4,5])
    var mapSvg = d3.select("#map svg")
    var dataArray = jsonToArray(busData)
    mapSvg.selectAll(".circle")
        .data(dataArray)
        .enter()
        .append("circle")
        .attr("r",0)
        .attr("fill",function(d,i){
            if(color == "business"){
                if(businessTypeColors[d["type"]]==undefined){
                    return "none"
                }else{
                    var category = businessTypeColors[d["type"]]
                    var colorIndex = colorsCategories[category]
                    return businessTypeColorsArray[colorIndex]   
                }
            }
            else if(color.length == 1){
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
function drawRectByLocation(busData,className,color,delay,opacity,radius,symbolType){
    var dScale = d3.scale.linear().domain([0,1]).range([color,"#fff"])
    var mapSvg = d3.select("#map svg")
    var dataArray = jsonToArray(busData)
    mapSvg.selectAll(".rect")
        .data(dataArray)
        .enter()
        .append("path")
        .attr("d",d3.svg.symbol().type(symbolType))
        .attr("width",20)
        .attr("fill",function(d,i){
            return dScale(d.distance)
        })
        .attr("opacity",function(d){return 0})
        .attr("class",function(d){return className})
        .attr("transform",function(d){
            var lat = parseFloat(d.lat)
            var lng = parseFloat(d.lng)
            var projectedLng = projection([lng,lat])[0]
            var projectedLat = projection([lng,lat])[1]
            return "translate(" + projectedLng + "," + projectedLat + ")"
        })
        //.attr("x",function(d){
        //    var lat = parseFloat(d.lat)
        //    var lng = parseFloat(d.lng)
        //    //to get projected dot position, use this basic formula
        //    var projectedLng = projection([lng,lat])[0]
        //    return projectedLng
        //})
        //.attr("y",function(d){
        //    var lat = parseFloat(d.lat)
        //    var lng = parseFloat(d.lng)
        //    var projectedLat = projection([lng,lat])[1]
        //    return projectedLat
        //})
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
	map=d3.selectAll("#map rect").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	map=d3.selectAll("#map .trees").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	map=d3.selectAll("#map .locations").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  	//map.select("circle").style("stroke-width", 1.5 / d3.event.scale + "px").style("font-size",1.5 / d3.event.scale + "px");
	//var newScaleDistance = Math.round((5/d3.event.scale)* 100) / 100
	//d3.select("#scale .scale-text").text(newScaleDistance+"km")
	//window.location.hash = JSON.stringify([d3.event.translate, d3.event.scale])
}
