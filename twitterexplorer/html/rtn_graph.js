//<script>

// initialize variables
var colorselector = document.getElementById("nodecolor");
var nodescaling = 0.05;
var nodecolor = colorselector.options[colorselector.selectedIndex].value;
var darkmode = false

// get node color options
ms = document.getElementById('nodecolor')
if ('louvain_com' in data.nodes[0]) { ms.innerHTML += `<option value = "louvain_com">Louvain community</option>\n` }
if ('leiden_com' in data.nodes[0]) { ms.innerHTML += `<option value = "leiden_com">Leiden community</option>\n` }

// hide links by default if there are more than 10.000
if (data.links.length > 10000) { var init_linkvis = false }
else { var init_linkvis = true }

// initialize graph
var elem = document.getElementById("graph")
var is3D = false;
var isCluster = false;


//Initializes a 2D force graph using the ForceGraph library
function init2DGraph() {
  return ForceGraph()(elem)
    .graphData({ nodes: data.nodes, links: data.links })
    .backgroundColor("rgba(0,0,0,0)")
    .nodeId('id')
    .nodeLabel(node => node.screen_name)
    .nodeColor(node => "black")
    .nodeVal(node => node.in_degree * nodescaling)
    .linkDirectionalParticleColor(() => 'red')
    .linkColor(() => darkmode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
    .linkHoverPrecision(10)
    .linkVisibility(init_linkvis)
    .onNodeRightClick(node => {
      Graph.centerAt(node.x, node.y, 1000);
      Graph.zoom(8, 2000);
    })
    .onLinkClick(link => {
      Graph.emitParticle(link);
    });
}

//Initializes a 3D force graph using the ForceGraph3D library
function init3DGraph() {
  return ForceGraph3D()(elem)
    .graphData({ nodes: data.nodes, links: data.links })
    .nodeId('id')
    .backgroundColor("rgba(0,0,0,0)")
    .nodeLabel(node => node.screen_name)
    .nodeColor(node => "black")
    .linkColor(() => darkmode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
    .nodeVal(node => {
      const sphereGeometry = new THREE.SphereGeometry(node.in_degree * nodescaling);
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: "black" });
      return new THREE.Mesh(sphereGeometry, sphereMaterial);
    })
    .linkDirectionalParticleColor(() => 'red')
    .linkHoverPrecision(10)
    .linkVisibility(init_linkvis)
    .linkOpacity(1)
    .onNodeRightClick(node => {
      Graph.centerAt(node.x, node.y, node.z, 1000);
      Graph.zoom(8, 2000);
    })
    .onLinkClick(link => {
      Graph.emitParticle(link);
    });
}
//Initializes a clustered force graph by creating a new graph data structure based on community information
function initClusterGraph() {
  let cluster_graph = {
    "nodes": [],
    "links": []
  }
  var colorselector = document.getElementById("nodecolor");
  var selectedoption = colorselector.options[colorselector.selectedIndex].value;
  let linkMap = new Map();

  switch (selectedoption) {
    case "none":
      return Graph;
    case "louvain_com":
      console.log("Louvain");
      for (let i = 0; i < data.graph.louvain_communities; i++) {
        cluster_graph.nodes.push({
          "id": i,
          "louvain_com": i,
          "followers": 0,
          "friends": 0,
          "out_degree": 0,
          "in_degree": 0
        })
      }
      data.nodes.forEach(node => {
        if (node.louvain_com <= data.graph.louvain_communities) {
          cluster_graph.nodes[node.louvain_com].followers += node.followers
          cluster_graph.nodes[node.louvain_com].friends += node.friends
          cluster_graph.nodes[node.louvain_com].out_degree += node.out_degree
          cluster_graph.nodes[node.louvain_com].in_degree += node.in_degree
        }
      })
      data.links.forEach((lnk) => {
        if (lnk.source.louvain_com <= data.graph.louvain_communities && lnk.target.louvain_com <= data.graph.louvain_communities) {
          let linkId = `${lnk.source.louvain_com}-${lnk.target.louvain_com}`; // Generate a unique identifier for the community link
          if (linkMap.has(linkId)) {
            linkMap.get(linkId).weight += 1; // If the link already exists, increment its weight
          } else {
            // Otherwise, create a new link with a weight of 1
            linkMap.set(linkId, {
              "source": lnk.source.louvain_com,
              "target": lnk.target.louvain_com,
              "weight": 1
            });
          }
        }


      });
      break;
    case "leiden_com":
      console.log("Leiden");
      for (let i = 0; i < data.graph.leiden_communities; i++) {
        cluster_graph.nodes.push({
          "id": i,
          "leiden_com": i,
          "followers": 0,
          "friends": 0,
          "out_degree": 0,
          "in_degree": 0
        })
      }
      data.nodes.forEach(node => {
        if (node.leiden_com <= data.graph.leiden_communities) {
          cluster_graph.nodes[node.leiden_com].followers += node.followers
          cluster_graph.nodes[node.leiden_com].friends += node.friends
          cluster_graph.nodes[node.leiden_com].out_degree += node.out_degree
          cluster_graph.nodes[node.leiden_com].in_degree += node.in_degree
        }
      })
      data.links.forEach((lnk) => {
        if (lnk.source.leiden_com <= data.graph.leiden_communities && lnk.target.leiden_com <= data.graph.leiden_communities) {
          let linkId = `${lnk.source.leiden_com}-${lnk.target.leiden_com}`; // Generate a unique identifier for the community link
          if (linkMap.has(linkId)) {
            linkMap.get(linkId).weight += 1; // If the link already exists, increment its weight
          } else {
            // Otherwise, create a new link with a weight of 1
            linkMap.set(linkId, {
              "source": lnk.source.leiden_com,
              "target": lnk.target.leiden_com,
              "weight": 1
            });
          }
        }
      });
      break;
  }
  cluster_graph.links = Array.from(linkMap.values());
  console.log(cluster_graph)


  return ForceGraph()(elem)
    .graphData({ nodes: cluster_graph.nodes, links: cluster_graph.links })
    .backgroundColor("rgba(0,0,0,0)")
    .nodeId('id')
    .nodeLabel(node => node.leiden_com)
    .nodeColor(node => "black")
    .nodeVal(node => node.in_degree * nodescaling * 0.2)
    .linkDirectionalParticleColor(() => 'red')
    .linkColor(() => darkmode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
    .linkHoverPrecision(10)
    .linkVisibility(init_linkvis)
    .linkWidth(link => link.weight)
    .onNodeRightClick(node => {
      Graph.centerAt(node.x, node.y, 1000);
      Graph.zoom(8, 2000);
    })
    .onLinkClick(link => {
      Graph.emitParticle(link);
    });
}
// Initialize the default graph (2D in this case)
Graph = init2DGraph();
document.getElementById('switchGraph').addEventListener('click', () => {
  // Remove current graph
  // Graph.resetProps();

  if (is3D) {
    Graph = init2DGraph();
    document.getElementById('switchGraph').textContent = 'Switch to 3D';
  } else {
    Graph = init3DGraph();
    document.getElementById('switchGraph').textContent = 'Switch to 2D';
  }

  // Toggle the is3D flag
  is3D = !is3D;
  rescalenodes();
  recolornodes();
  // USER INFO ON CLICK
  Graph.onNodeClick((node => {
    pastenodeinfo(node);
    $("#content03").slideDown(300)
    $("#content01").slideUp(300)
    highlight(node)
  }))

  Graph.linkDirectionalParticles(link => {
    if (link.colorthat == 1) {
      return 1
    }
    else {
      return 0
    }
  })

  Graph.onBackgroundClick(() => resetcolors())
});

document.getElementById('clusterGraph').addEventListener('click', () => {
  // Remove current graph
  // Graph.resetProps();
  var colorselector = document.getElementById("nodecolor");
  var selectedoption = colorselector.options[colorselector.selectedIndex].value;
  if(selectedoption != "none"){
    if (isCluster) {
      Graph = init2DGraph();
      is3D = false;
      document.getElementById('nodecolor_none').disabled = false;
      document.getElementById('switchGraph').style.display = "block";
      document.getElementById('switchGraph').textContent = 'Switch to 3D';
    } else {
      Graph = initClusterGraph();
      rescalenodes();
      // document.getElementById('switchGraph').textContent = 'Switch to 2D';
      document.getElementById('nodecolor_none').disabled = true;
      document.getElementById('switchGraph').style.display = "none";
    }
    isCluster = !isCluster;
    recolornodes();
}
});
// get list of all users for autocomplete
var users = []
for (var i in data.nodes) { users.push(data.nodes[i].screen_name) };

// Retrieves and displays original tweets by a selected user
function drawortweets() {
  if (darkmode === false) { var themecol = 'light' }
  else { var themecol = 'dark' }
  var name = document.getElementById("searchuser").value
  document.getElementById("useroriginaltweets").innerHTML = "";
  const getNode = id => {
    return data.nodes.find(node => node.screen_name === name);
  };
  var node = getNode(name)
  highlight(node)
  if (node.otweets != "None") {
    for (tweet of node.otweets) {
      twttr.widgets.createTweet(
        tweet,
        document.getElementById('useroriginaltweets'),
        {
          theme: themecol,
          dnt: true,
          width: 280
        }
      );
    }
  }
  else { document.getElementById('useroriginaltweets').innerHTML = "None" }

  $("#content04").slideUp(300)
  $("#content05").slideUp(300)
  $("#content04A").slideDown(300);
}

//Retrieves and displays retweets by a selected user
function drawretweets() {
  if (darkmode === false) { var themecol = 'light' }
  else { var themecol = 'dark' }
  var name = document.getElementById("searchuser").value
  document.getElementById("userretweets").innerHTML = "";
  const getNode = id => {
    return data.nodes.find(node => node.screen_name === name);
  };
  var node = getNode(name)
  highlight(node)
  if (node.interactions != "None") {
    for (tweet of node.interactions) {
      if (tweet != "None") {
        twttr.widgets.createTweet(
          tweet,
          document.getElementById('userretweets'),
          {
            theme: themecol,
            dnt: true,
            width: 280
          }
        );
      }
    }
  }
  else { document.getElementById('userretweets').innerHTML = "None" }

  $("#content04A").slideUp(300);
  $("#content05").slideUp(300);
  $("#content04").slideDown(300);
}


// Retrieves and displays the Twitter timeline of a selected user
function drawtimeline() {
  if (darkmode === false) { var themecol = 'light' }
  else { var themecol = 'dark' }
  var name = document.getElementById("searchuser").value
  document.getElementById("twitter_timeline").innerHTML = "";
  twttr.widgets.createTimeline(
    {
      sourceType: "profile",
      screenName: name
    },
    document.getElementById("twitter_timeline"),
    {
      theme: themecol,
      height: 400,
      chrome: 'noscrollbar',
      dnt: true
    });
  {
    $("#content05").slideDown(300);
    $("#content04").slideUp(300)
    $("#content04A").slideUp(300)
  };
}

// USER INFO ON CLICK
Graph.onNodeClick((node => {
  pastenodeinfo(node);
  $("#content03").slideDown(300)
  $("#content01").slideUp(300)
  highlight(node)
}))

function highlight(node) {
  var neighbors = []
  neighbors.push(node)

  for (link of data.links) {
    if (link.source == node) {
      neighbors.push(link.target)
      link.colorthat = 1
    }
    else if (link.target == node) {
      neighbors.push(link.source)
      link.colorthat = 1
    }
    else { link.colorthat = 0 }
  }
  for (node of data.nodes) {
    if (neighbors.includes(node)) {
      node.colorthat = 1
    }
    else node.colorthat = 0
  }
  colorbar = ['#d3d3d3', 'red']
  Graph.nodeColor(() => 'black')
  Graph.nodeColor(node => colorbar[node.colorthat])
  // linkcolor depending on dark/lightmode
  if (darkmode === false) { var colorbar2 = ['rgba(0,0,0,0.05)', 'rgba(255,0,0,0.5)'] }
  else { var colorbar2 = ['rgba(255,255,255,0.03)', 'rgba(255,0,0,0.5)'] }
  Graph.linkColor(link => colorbar2[link.colorthat])
}
Graph.linkDirectionalParticles(link => {
  if (link.colorthat == 1) {
    return 1
  }
  else {
    return 0
  }
})

Graph.onBackgroundClick(() => resetcolors())

function resetcolors() {
  var bodyelement = document.querySelector('body')
  var bodystyle = window.getComputedStyle(bodyelement)
  var bg = bodystyle.getPropertyValue('color')
  if (bg === 'rgb(0, 0, 0)') {
    var linkcol = 'rgba(0,0,0,0.2)'
  }
  if (bg === 'rgb(255, 255, 255)') {
    var linkcol = 'rgba(255,255,255,0.2)'
  }

  recolornodes()
  Graph.linkColor(() => linkcol)
}


var input = document.getElementById("searchuser");
new Awesomplete(input, {
  list: users
});

// ZOOM ON USER
function zoomonuser() {
  var name = document.getElementById("searchuser").value;
  const getNode = id => {
    return data.nodes.find(node => node.screen_name === name);
  }
  var nodeathand = getNode(name)
  Graph.centerAt(nodeathand.x, nodeathand.y, 1000); Graph.zoom(8, 2000);
  console.log(nodeathand);
}

// FLASH COLOR
function flashcolor() {
  var bodyelement = document.querySelector('body')
  var bodystyle = window.getComputedStyle(bodyelement)
  var bg = bodystyle.getPropertyValue('color')
  if (bg === 'rgb(0, 0, 0)') { var nodecol = 'black' }
  if (bg === 'rgb(255, 255, 255)') { var nodecol = 'white' }
  var name = document.getElementById("searchuser").value;
  const getNode = id => {
    return data.nodes.find(node => node.screen_name === name);
  };
  var nodeathand = getNode(name)
  console.log(nodeathand)
  originalcolor = nodeathand.color
  Graph.nodeColor(node => {
    if (node.screen_name === name) {
      return "red";
    }
    else { return nodecol }
  });
  setTimeout(function () {
    Graph.nodeColor(node => {
      if (node.screen_name === name) {
        return nodecol;
      }
      else { return nodecol }
    });
  }, 250);
}

function resetzoom() {
  Graph.centerAt(0, 0, 1000); Graph.zoom(0.4, 1000)
}

// LIGHT / DARK MODE
function toggle_darkmode() {

  if (darkmode == false) {
    document.documentElement.setAttribute('data-theme', 'darktheme');
    Graph.linkColor(() => 'rgba(255,255,255,0.2)');
    var colorselector = document.getElementById("nodecolor");
    var selectedoption = colorselector.options[colorselector.selectedIndex].value
    if (selectedoption === "none") { Graph.nodeColor(() => 'white') }
    darkmode = true
  }
  else {
    document.documentElement.setAttribute('data-theme', 'lighttheme');
    Graph.linkColor(() => 'rgba(0,0,0,0.2)');
    var colorselector = document.getElementById("nodecolor");
    var selectedoption = colorselector.options[colorselector.selectedIndex].value
    if (selectedoption === "none") { Graph.nodeColor(() => 'black') }
    darkmode = false
  }
}

// RECOLOR NODES
var colorscale = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']
document.getElementById("nodecolor").addEventListener("change", recolornodes);

function recolornodes() {
  if(isCluster){
    Graph = initClusterGraph();
  }
  var colorselector = document.getElementById("nodecolor");
  var selectedoption = colorselector.options[colorselector.selectedIndex].value
  if (selectedoption != "none") {
    Graph.nodeColor(node => colorscale[node[selectedoption]])
  }
  else {
    var bodyelement = document.querySelector('body')
    var bodystyle = window.getComputedStyle(bodyelement)
    var bg = bodystyle.getPropertyValue('color')
    if (bg === 'rgb(0, 0, 0)') { var nodecol = 'black' }
    if (bg === 'rgb(255, 255, 255)') { var nodecol = 'white' }
    Graph.nodeColor(node => nodecol)
  }
}





// NODE SIZE
document.getElementById("slido").addEventListener("change", rescalenodes);
function rescalenodes() {
  let follower_scale = 0.000005
  let friends_scale = 0.001
  let out_degree_scale = 0.1
  let in_degree_scale = 0.1
  if (isCluster) {
    follower_scale = 0.000001
    friends_scale = 0.000005
    out_degree_scale = 0.01
    in_degree_scale = 0.01

  }

  var nodescaleslider = document.getElementById("slido");
  var newscale = nodescaleslider.value
  var sizeselector = document.getElementById("nodesize");
  var selectedoption = sizeselector.options[sizeselector.selectedIndex].value
  if (selectedoption === "followers") { Graph.nodeVal(node => node[selectedoption] * follower_scale * newscale) }
  else if (selectedoption === "friends") { Graph.nodeVal(node => node[selectedoption] * friends_scale * newscale) }
  else if (selectedoption === "out_degree") { Graph.nodeVal(node => node[selectedoption] * out_degree_scale * newscale) }
  else if (selectedoption === "in_degree") { Graph.nodeVal(node => node[selectedoption] * in_degree_scale * newscale) }

}

document.getElementById("nodesize").addEventListener("change", changenodesize);
function changenodesize() {
  let follower_scale = 0.000005
  let friends_scale = 0.001
  let out_degree_scale = 0.1
  let in_degree_scale = 0.1

  var sizeselector = document.getElementById("nodesize");
  var selectedoption = sizeselector.options[sizeselector.selectedIndex].value
  if (selectedoption === "followers") { Graph.nodeVal(node => node[selectedoption] * follower_scale) }
  else if (selectedoption === "friends") { Graph.nodeVal(node => node[selectedoption] * friends_scale) }
  else if (selectedoption === "out_degree") { Graph.nodeVal(node => node[selectedoption] * out_degree_scale) }
  else if (selectedoption === "in_degree") { Graph.nodeVal(node => node[selectedoption] * in_degree_scale) }
  else { Graph.nodeVal(node => 1.0) }
}

$(function () {
  var colval = "none";
  $("#nodecolor").val(colval);
});
$(function () {
  var sizeval = "in_degree";
  $("#nodesize").val(sizeval);
});


// INCLUDE NETWORK INFORMATION FROM GRAPH DATA
var netinfo = `<ul> 
<li> Keyword: ${data.graph.keyword}</li>
<li> Collected on: ${data.graph.collected_on}</li>
<li> First retweet: ${data.graph.first_tweet}</li>
<li> Last retweet: ${data.graph.last_tweet}</li>
</ul>`
var netmeasures = `
<ul>
  <li>Nodes: ${data.graph.N_nodes}</li>
  <li>Links: ${data.graph.N_links}</li>
</ul>`
document.getElementById('panel00').innerHTML = data.graph.type
document.getElementById('content00').innerHTML = netinfo
document.getElementById('content02').innerHTML = netmeasures
document.getElementById('version_number').innerHTML = data.version_number

// NODE INFO
function pastenodeinfo(node) {
  userinfostring = `<ul> 
<li> Followers: ${node.followers}
<li> Followed accounts: ${node.friends}
<li> Times the user ${interaction_type_past.split(' ')[0]}: ${node.out_degree}
<li> Times the user got ${interaction_type_past}: ${node.in_degree}`
  if ("louvain_com" in node) {
    userinfostring += `<li> Louvain community: ${node.louvain_com}`
  }
  if ("leiden_com" in node) {
    userinfostring += `<li> Leiden community: ${node.leiden_com}`
  }
  userinfostring += `</ul>`
  document.getElementById('userinfostring').innerHTML = userinfostring
  document.getElementById("searchuser").value = node.screen_name
}


var interaction_type = data.graph.type.split(' ')[0].toLowerCase()

if (interaction_type == "retweet") {
  document.getElementById('indegreeoption').innerHTML = "In-Degree (Number of times the account got retweeted)"
  document.getElementById('outdegreeoption').innerHTML = "Out-Degree (Number of times the account retweeted another)"
  document.getElementById('panel04').innerHTML = "RETWEETS IN DATASET"
  document.getElementById('fetch_interaction').innerHTML = "Fetch retweets"
  var interaction_type_past = "retweeted"
}

if (interaction_type == "quote") {
  document.getElementById('indegreeoption').innerHTML = "In-Degree (Number of times the account got quoted)"
  document.getElementById('outdegreeoption').innerHTML = "Out-Degree (Number of times the account quoted another)"
  document.getElementById('panel04').innerHTML = "QUOTES IN DATASET"
  document.getElementById('fetch_interaction').innerHTML = "Fetch quotes"
  var interaction_type_past = "quoted"
}
if (interaction_type == "reply") {
  document.getElementById('indegreeoption').innerHTML = "In-Degree (Number of times the account got replied to)"
  document.getElementById('outdegreeoption').innerHTML = "Out-Degree (Number of times the account replied to another)"
  document.getElementById('panel04').innerHTML = "REPLIES IN DATASET"
  document.getElementById('fetch_interaction').innerHTML = "Fetch replies"
  var interaction_type_past = "replied to"
}
if (interaction_type == "mention") {
  document.getElementById('indegreeoption').innerHTML = "In-Degree (Number of times the account got mentioned)"
  document.getElementById('outdegreeoption').innerHTML = "Out-Degree (Number of times the account mentioned another)"
  document.getElementById('panel04').innerHTML = "MENTIONS IN DATASET"
  document.getElementById('fetch_interaction').innerHTML = "Fetch mentions"
  var interaction_type_past = "mentioned"
  document.getElementById('fetch_originaltweet').style = "display:none"
  document.getElementById('originaltweetsborders').style = "display:none"
}

$("#content00").slideToggle(300)

function toggle_linkvisibility() {
  if (Graph.linkVisibility() == true) {
    Graph.linkVisibility(false)
  }
  else { Graph.linkVisibility(true) }
}

function make_screenshot() {
  // var canvas = document.getElementsByClassName('force-graph-container')[0]['children'][0];
  var canvas = document.getElementById('graph')['children'][0]['children'][0]
  console.log(canvas)
  var link = document.getElementById('camera');
  link.setAttribute('download', 'screenshot.png');
  link.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  link.click()
}

function export_nodes_as_csv() {
  var csv_string = ""
  var options = Object.keys(data.nodes[0])
  var to_disregard = ['otweets', 'interactions', 'vx', 'vy', 'index']
  var filtered_options = options.filter(function (e) { return !to_disregard.includes(e) })
  for (option of filtered_options) { csv_string += option; csv_string += "," }
  csv_string = csv_string.slice(0, -1)
  csv_string += "\n"
  for (var i = 0; i < data.nodes.length; ++i)
  // for (var i = 0; i < 2; ++i)
  {
    node = data.nodes[i]
    for (option of filtered_options) {
      csv_string += node[option]
      csv_string += ","
    }
    csv_string = csv_string.slice(0, -1)
    csv_string += "\n"
  }
  csv_string = csv_string.slice(0, -1)
  var blob = new Blob([csv_string],
    { type: "text/plain;charset=utf-8" });
  saveAs(blob, "nodes_metadata.csv");
}

function d3graph_to_gml() {
  var gml_string = "graph\n[\n"
  var options = Object.keys(data.nodes[0])
  var to_disregard = ['otweets', 'interactions', 'vx', 'vy', 'index']
  var filtered_options = options.filter(function (e) { return !to_disregard.includes(e) })
  for (var i = 0; i < data.nodes.length; ++i) {
    node = data.nodes[i]
    gml_string += "node\n"
    gml_string += "[\n"
    for (option of filtered_options) {
      if (node[option].constructor !== Array || typeof node[option] !== 'object') {
        if (typeof node[option] === 'string' || node[option] instanceof String) {
          gml_string += option + " " + '"' + node[option] + '"' + "\n"
        }
        else {
          gml_string += option + " " + node[option] + "\n"
        }
      }
    }
    gml_string += "]\n"
  }
  for (var i = 0; i < data.links.length; ++i) {
    link = data.links[i], source = link.source, target = link.target;
    gml_string += "edge\n"
    gml_string += "[\n"
    gml_string += "source " + source.id + "\n"
    gml_string += "target " + target.id + "\n"
    gml_string += "]\n"
  }
  gml_string += "]"
  var blob = new Blob([gml_string],
    { type: "text/plain;charset=utf-8" });
  saveAs(blob, "network.gml");
}

function export_coordinates() {
  if (!is3D && !isCluster) {
    var positions = data.nodes.map(function (d) { return { id: d.id, screen_name: d.screen_name, x: d.x, y: d.y, leiden: d.leiden_com, louvain: d.louvain_com }; });
    var jsonPostition = JSON.stringify(positions);
    var blob = new Blob([jsonPostition], { type: "application/json" });
    saveAs(blob, "positions.json")
  }
  if (is3D && !isCluster) {
    var positions = data.nodes.map(function (d) { return { id: d.id, screen_name: d.screen_name, x: d.x, y: d.y, z: d.z, leiden: d.leiden_com, louvain: d.louvain_com }; });
    var jsonPostition = JSON.stringify(positions);
    var blob = new Blob([jsonPostition], { type: "application/json" });
    saveAs(blob, "positions3D.json")
  }
}


function monthDiff(d1, d2) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}
function dayDiff(d1, d2) {
  const oneDay = 24 * 60 * 60 * 1000;
  var days;
  var diffDays = Math.round(Math.abs((d1 - d2) / oneDay));
  return diffDays
}

function padStr(i) {
  return (i < 10) ? "0" + i : "" + i;
}
function addMonths(date, months) {
  var d = date.getDate();
  date.setMonth(date.getMonth() + +months);
  if (date.getDate() != d) {
    date.setDate(0);
  }
  return date;
}
function addDays(date, days) {
  var d = date.getDate();
  date.setDate(date.getDate() + +days);
  // if (date.getDate() != d) {
  //   date.setDate(0);
  // }
  return date;
}

// FILTER EDGES BY DATE SECTION
var all_dates = []
for (link of data.links) { all_dates.push(new Date(link.ts * 1000)) }
all_dates.sort((date1, date2) => date1 - date2)

// get the number of elements in the slider
var n_days = dayDiff(all_dates[0], all_dates[all_dates.length - 1]) + 1

var first_year = all_dates[0].getFullYear()
var first_month = all_dates[0].getMonth() + 1
var first_day = all_dates[0].getDay() + 1
var idx_to_date = {}
var idx_to_timestamp = {}

for (let i = 0; i < n_days; i++) {
  var newdate = new Date(all_dates[0].getTime());
  newdate = addDays(newdate, i)
  // console.log(i)
  // idx_to_date[i] = `${first_year}-${first_month}+${i}`
  newdate.setHours(0, 0, 0, 0);
  idx_to_date[i] = padStr(newdate.getFullYear()) + "-" + padStr(1 + newdate.getMonth()) + "-" + padStr(newdate.getDate())
  idx_to_timestamp[i] = newdate.getTime() / 1000
}
// console.log(all_dates)
// console.log(idx_to_date)

document.getElementById("time_slider").max = n_days - 1;
document.getElementById("time_slider").addEventListener("change", filter_edges_by_time);

function filter_edges_by_time() {
  var timeslider = document.getElementById("time_slider").value;
  // console.log(idx_to_date[timeslider])
  var show_this_date = idx_to_date[timeslider]
  var compute_this_date = idx_to_timestamp[timeslider]
  // console.log(new Date(compute_this_date * 1000))
  document.getElementById("current_time_filter").innerHTML = show_this_date

  // USE THIS IF YOU ONLY WANT TO ALTER THE LINKS
  // for (link of data.links){    
  //     if (link.ts > compute_this_date && link.ts < compute_this_date+(60*60*24)) {link.show=true;temporal_nodes.push(link.source);temporal_nodes.push(link.target) }
  //     else {link.show=false}}

  for (link of data.links) {
    link.source.show = false
    link.target.show = false
  }
  for (link of data.links) {
    if (link.ts >= compute_this_date && link.ts <= compute_this_date + (60 * 60 * 24)) {
      link.show = true;
      link.source.show = true;
      link.target.show = true;
    }
    else { link.show = false }
  }


  Graph.linkVisibility(link => link.show)

  var colorselector = document.getElementById("nodecolor");
  var selectedoption = colorselector.options[colorselector.selectedIndex].value
  if (selectedoption != "none") {
    Graph.nodeColor(node => {
      if (node.show == true) { return colorscale[node[selectedoption]] }
      else { return 'rgba(0,0,0,0.07)' }
    })
  }
  else {
    var bodyelement = document.querySelector('body')
    var bodystyle = window.getComputedStyle(bodyelement)
    var bg = bodystyle.getPropertyValue('color')
    if (bg === 'rgb(0, 0, 0)') { var nodecol = 'black' }
    if (bg === 'rgb(255, 255, 255)') { var nodecol = 'white' }
    Graph.nodeColor(node => {
      if (node.show == true) { return nodecol }
      else { return 'rgba(0,0,0,0.07)' }
    })
  }
  // Graph.nodeVisibility(node => node.show)
}
</script >
</body >