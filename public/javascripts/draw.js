
var isPortrait = function() {
    // we can't rely on window.orientation, because some devices
    // report 0deg rotation for landscape mode :/
    // Check for screen dimensions instead
    return (!ig.ua.mobile || window.innerHeight > window.innerWidth);
};

var checkOrientation = function() {    
    if( isPortrait() ) {
        // all good
    }
    else {
        // display rotate message
    }
};

// Listen to resize and orientationchange events
window.addEventListener( 'orientationchange', checkOrientation, false );
window.addEventListener( 'resize', checkOrientation, false );

var drawGridRects = function(num_rectangles_wide, num_rectangles_tall, boundingRect, x,y) {
    var width_per_rectangle = boundingRect.width / num_rectangles_wide;
    var height_per_rectangle = boundingRect.height / num_rectangles_tall;
    for (var i = 0; i < num_rectangles_wide; i++) {
        for (var j = 0; j < num_rectangles_tall; j++) {
            var aRect = new paper.Path.Rectangle((x+boundingRect.left) + i * width_per_rectangle, (y+boundingRect.top) + j * height_per_rectangle, width_per_rectangle, height_per_rectangle);
            aRect.strokeColor = 'white';
            aRect.fillColor = 'black';
            aRect.name= "grid";
        }
    }
}
// The faster the user moves their mouse
// the larger the circle will be
// We dont want it to be larger than this
tool.maxDistance = 50;
var background = new Path.Rectangle(view.bounds);
background.fillColor = 'white';
var sessionId = io.socket.sessionid;
console.log ('bg',background.index);
gridx=16;
gridy=8;
lastid=-1;
pickedcolor={red:0,green:0,blue:0};
drawGridRects(gridx, gridy, paper.view.bounds.scale(0.75,0.75),paper.view.bounds.width*-0.1,0);

drawPicker(8, 8, paper.view.bounds.scale(0.15,0.5),paper.view.bounds.width*0.4,0);
drawButton();
//console.log(paper.view.bounds.width);


// Returns an object specifying a semi-random color
// The color will always have a red value of 0
// and will be semi-transparent (the alpha value)


// every time the user drags their mouse
// this function will be executed
function onMouseDown(event) {

  var hit = project.hitTest(event.point);
    if (hit){
     console.log('name',hit.item.name);

      
      if (hit.item.name=="grid") {
       
        if ( hit.item.fillColor != pickedcolor) {
          drawFill(hit.item,pickedcolor);
          sendcolor=pickedcolor
        } else 
        {
         sendcolor="#000000";
        drawFill(hit.item,sendcolor);}
        
        
        //console.log('drawto',hit.item);
        lastid=hit.item.index;
         emitFill(hit.item);
    }
      
      else if (hit.item.name=="picker")
        { pickedcolor=hit.item.fillColor;
        background.fillColor = pickedcolor;
        console.log('color',pickedcolor)
      }

      else if (hit.item.name=="clear")
        { clear();
        io.emit( 'clear',{data : 0}, sessionId);
      }

  }

}

function onMouseDrag(event) {

  var hit = project.hitTest(event.point);
    if (hit){

      
      if (hit.item.name=="grid") {

         
        if ((hit.item.fillColor != pickedcolor) && (hit.item.index != lastid)) {

        drawFill(hit.item,pickedcolor);
        sendcolor=pickedcolor;
        
        } else if (hit.item.index != lastid) { 
          sendcolor="#000000";
          drawFill(hit.item,sendcolor);
          }
        
        //console.log('drawto',hit.item);
        emitFill(hit.item);
        lastid=hit.item.index;
    }

      else if (hit.item.name=="picker") 
        { pickedcolor=hit.item.fillColor;
        background.fillColor = pickedcolor;
        //console.log('color',pickedcolor)
      }

  }

}






// function drawCircle( x, y, radius, color ) {
  function drawFill(item,color) {

  item.fillColor = color;
  

/*  // Render the circle with Paper.js
  var circle = new Path.Circle( new Point( x, y ), radius );
  circle.fillColor = new RgbColor( color.red, color.green, color.blue, color.alpha );*/

  // Refresh the view, so we always get an update, even if the tab is not in focus
  view.draw();
} 


  

// This function sends the data for a circle to the server
// so that the server can broadcast it to every other user
function emitFill(link) {

  // Lets have a look at the data we're sending
  //console.log('send', link.index, pickedcolor);

  // Each Socket.IO connection has a unique session id
  
  
  // An object to describe the circle's draw data
  var data = {
    index: link.index,
    r: sendcolor.red,
    g: sendcolor.green,
    b: sendcolor.blue,
            }

  // send a 'drawCircle' event with data and sessionId to the server
  io.emit( 'drawFill', data, sessionId);

}



function drawPicker(num_rectangles_wide, num_rectangles_tall, boundingRect, x,y) {
    var width_per_rectangle = boundingRect.width / num_rectangles_wide;
    var height_per_rectangle = boundingRect.height / num_rectangles_tall;
    for (var i = 0; i < num_rectangles_wide; i++) {
        for (var j = 0; j < num_rectangles_tall; j++) {
            var aRect = new paper.Path.Rectangle((x+boundingRect.left) + i * width_per_rectangle, (y+boundingRect.top) + j * height_per_rectangle, width_per_rectangle, height_per_rectangle);
            aRect.strokeColor = 'white';
            aRect.fillColor={hue:360*i*(1/num_rectangles_wide), lightness:(num_rectangles_tall-1-j)*(1/num_rectangles_tall), saturation:1};
            aRect.name="picker";
        }
      }
    }

function drawButton() {
  var button = new Path.Rectangle (1250,600,80,40);
  button.fillColor = 'blue';
  button.name="clear";
            
}

function clear() {
  var children = project.activeLayer.children;
  for (var i=1;i <= gridx*gridy;i++) {
 children[i].fillColor="#0000000";
 
 
  }
  
  view.draw();
}

// Listen for 'drawCircle' events
// created by other users
io.on( 'drawFill', function( data ) {
 
var children = project.activeLayer.children;

// Iterate through the items contained within the array:

  var child = children[data.index];

  // from another user
  drawFill(child,{red:data.r,green:data.g,blue:data.b});
  
})

io.on('clear',function(data) {
  clear();
  console.log('received clear');
})