//load csv data
Promise.all([d3.csv('https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv'),
             d3.json('https://raw.githubusercontent.com/abhi-876/F21DV/main/world_countries.json')]).then(function (values) {

    //storing data from csv into files
    const covid_data = values[0];
    const map_data = values[1];

    map_data.features.forEach(element=>{
        var filteredCountryData = covid_data.filter(d=>{return d.location == element.properties.name})
        element.properties.deaths = d3.sum(filteredCountryData, d=>{return d.total_deaths})
        element.properties.cases = d3.sum(filteredCountryData, d=>{return d.total_cases})
        element.properties.boosters = d3.sum(filteredCountryData, d=>{return d.total_boosters})
        element.properties.vaccinations = d3.sum(filteredCountryData, d=>{return d.total_vaccinations})
    })

    
    drawMap(map_data , covid_data)
    LineChart(covid_data , 'United States')
    Scatter(covid_data)
    
})

function LineChart(data, country){

    d3.select('#lineChart').remove()
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 110, bottom: 50, left: 90},
    width = 660 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]).nice();

    data = data.filter(d=>{return d.location == country})

    var color = d3.scaleOrdinal()
    .domain(["total_deaths", "total_cases", "total_boosters", "total_vaccinations"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);
  

    var parseTime = d3.timeParse("%Y-%m-%d");
    x.domain(d3.extent(data, function(d) { return parseTime(d.date); }));
    
    maxCases = d3.max(data, function(d) { return Math.max(+d.total_deaths, +d.total_cases, +d.total_boosters); })
    y.domain([0,maxCases])

    // append the svg object to the body of the page
    var svg = d3.select("#line").append("svg").attr('id' , 'lineChart')
    .attr('width' , width + margin.left + margin.right)
    .attr('height' , height + margin.top + margin.bottom)
    .attr("transform", "translate(" + 635 + "," + (-735) + ")")
    .append("g")
        .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    // Add the X Axis
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    function createLine(attribute){

        dataset = data.filter(d=>{return d[attribute]!=0})
        // define the line
        var valueline = d3.line()
            .x(function(d) { return x(parseTime(d.date)); })
            .y(function(d) { return y(d[attribute]); });

        // Add the valueline path.
        svg.append("path")
            .data([dataset])
            .attr("class", "line")
            .attr('fill' , 'none')
            .attr('stroke' , color(attribute))
            .attr('stroke-width' , '2px')
            .attr("d", valueline)

        var lastDataPoint = dataset[dataset.length - 1];
        svg.append("text")
            .attr("class", "attribute-label")
            .attr("x", x(parseTime(lastDataPoint.date)) + 5)
            .attr("y", y(lastDataPoint[attribute]) +5)
            .attr('fill' , color(attribute))
            .text(attribute);
    }
    createLine('total_deaths')
    createLine('total_cases')
    createLine('total_boosters')
    //createLine('total_vaccinations')

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height + margin.bottom - 5)
        .text("Date");

    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text('Total Number');

    //add title
    svg.append("text")
    .attr("x", width/2)
    .attr("y",(-margin.top/2 +5))
    .attr("text-anchor", "middle")
    .style("font-size", "15px")
    .text("COVID-19 Growth in "+country);

    
}

function drawMap(data, covid){
     // set the dimensions and margins of the graph
     var margin = {top: 30, right: 20, bottom: 50, left: 100},
     width = 750 - margin.left - margin.right,
     height = 810 - margin.top - margin.bottom;

     // Append the svg object to the body of the page
    var svg = d3.select('#map')
    .append("svg").attr('width' , width).attr('height' , height);

    // D3 Projection
	var projection = d3.geoMercator()
	.translate([(width / 2)+15, (height / 2)+80]) // translate to center of screen
	.scale([110]); // scale things down so see entire world

	// Define path generator
	var path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
	.projection(projection); // tell path generator to use albersUsa projection

    const colorScale = d3.scaleLinear()
        .domain([d3.min(data.features, d=>{return d.properties.deaths}),d3.max(data.features, d=>{return d.properties.deaths})])
        .range(['#F9EBEA','#d34127'])

    svg.selectAll("path")
        .data(data.features.filter(d => d.id !== "GRL" && d.id !== "ATA"))
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#fff")
        .attr('class' , 'Country')
        .attr("stroke-width", "1")
        .attr('fill', d=>{return colorScale(+d.properties.deaths)})
         .on("mousemove", function(event ,d) {
            d3.select(this).attr("stroke", "black").attr("stroke-width", "2px").style("cursor", "pointer");

            d3.select('#tooltip').html("<b>Country:</b>" + d.properties.name+ 
            "<br/><b>Total Deaths:</b>" + d.properties.deaths.toFixed(2))
            .style('left', (event.pageX+25) + 'px')
            .style('top', (event.pageY - 28) + 'px').style('opacity' , 1);
        })
        .on('mouseleave' , function(){
            d3.select(this).attr('stroke', 'white').attr("stroke-width", "1px").style("cursor", "default");
            d3.select('#tooltip').style('opacity' , 0)
        
        })
        
        .on('click' , function(event ,d) {

            //update the line chart
           LineChart(covid, d.properties.name)
        

        });


    //add title
    svg.append("text")
    .attr("x", width/2)
    .attr("y",(25))
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("Global Covid-19 Total Deaths");  

    //add subtitle
    svg.append("text")
    .attr("x", width/2)
    .attr("y",(50))
    .attr("text-anchor", "middle")
    .style("font-size", "15px")
    .style("color", "red")
    .text("Click a country to update line chart");  


}

function Scatter(data){
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 20, bottom: 50, left: 90},
    width = 660 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

    let nestedData = Array.from(d3.group(data, d => d.location), ([key, values]) => {
        return {
            location: key,
            gdp: d3.mean(values, d => +d.gdp_per_capita),
            deaths: d3.sum(values, d => +d.total_deaths_per_million)
        };
    });
    nestedData = nestedData.filter(d=>{return d.gdp != 0 && d.location!='World'})
// Append the svg object to the body of the page
var svg = d3.select('#scatter')
.append("svg")
.attr('width' , width + margin.left + margin.right)
.attr('height' , height + margin.top + margin.bottom)
.attr("transform", "translate(" + 635 + "," + (-735) + ")")
.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Add X axis
var x = d3.scaleLinear()
    .domain([0, d3.max(nestedData, d=>{return d.gdp})])
    .range([ 0, width ]);
svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

// Add Y axis
var y = d3.scaleLinear()
    .domain([0, d3.max(nestedData, d=>{return d.deaths})])
    .range([ height, 0]);
svg.append("g")
    .call(d3.axisLeft(y));

svg.append('g')
    .selectAll("dot")
    .data(nestedData)
    .enter()
    .append("circle")
        .attr('id' , d=>{return d.location})
        .attr("cx", function (d) { return x(d.gdp); } )
        .attr("cy", function (d) { return y(d.deaths); } )
        .attr("r", 3)
        .style("fill", "#d34127")
        .on("mousemove", function(event ,d) {
            d3.select(this).attr("stroke", "black").attr("stroke-width", "2px")
            .attr('r' , 8)

            d3.select('#tooltip').html("<b>Country:</b>" + d.location+ 
            "<br/><b>GPD:</b>" + d.gdp.toFixed(2) +
            "<br/><b>Total Deaths:</b>" + d.deaths.toFixed(2))
            .style('left', (event.pageX+25) + 'px')
            .style('top', (event.pageY - 28) + 'px').style('opacity' , 1);
        })
        .on('mouseleave' , function(){
            d3.select(this).attr("stroke", "none").attr('r' , 3)
            d3.select('#tooltip').style('opacity' , 0)
        });

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height + margin.bottom - 5)
        .text("GPD per Capita");

    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total Deaths");



        //add title
    svg.append("text")
    .attr("x", width/2)
    .attr("y",(-margin.top/2 +5))
    .attr("text-anchor", "middle")
    .style("font-size", "15px")
    .text("Relationship between GDP per Capita and Total COVID-19 Deaths")

}

