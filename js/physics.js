/**

  This is a very simple Pong game, intended to be hackable.

  It may not be the most exciting and complex game, but it
  can act as a first step in taking something and making it
  your own, instead of settling.

  TODO:
  
  1) monitor DOM manipulation of the world container, so that new divs get turned into new game elements.
  2) monitor style changes of the elements in the world container (attr and css?)
  3) make world things draggable?
        
**/

var keys = [false, false, false, false];

function keyPressed(e) {
  switch(e.which) {
    // left player
    case 87 : keys[0] = true; break;  // w
    case 83 : keys[1] = true; break;  // s
    // right player
    case 38 : keys[2] = true; break;  // up cursor
    case 40 : keys[3] = true; break;  // down cursor
  }
}

function keyReleased(e) {
  switch(e.which) {
    // left player
    case 87 : keys[0] = false; break;  // w
    case 83 : keys[1] = false; break;  // s
    // right player
    case 38 : keys[2] = false; break;  // up cursor
    case 40 : keys[3] = false; break;  // down cursor
  }
}


// world event listening
document.querySelector("#world").onkeydown = keyPressed;
document.querySelector("#world").onkeyup = keyReleased;

// ================= DRAW LOOP REQUEST
window.requestAnimFrame = (function(){
  return window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function(/* function */ callback, /* DOMElement */ element){
      window.setTimeout(callback, 1000 / 60);
    };
})();

// ================= WIN HANDLING

var wins = function(selector) {
  var element = document.querySelector(selector);
  var value = parseInt(element.innerHTML);
  element.innerHTML = value+1;
};

var leftWins = function()  { wins(".scores .left");  };
var rightWins = function() { wins(".scores .right"); };

// ================= HANDLES
var balls = [], leftPaddle, rightPaddle, worldBBox;
 

// ================= TRY TO RUN BOX2D CODE:
(function tryPhysics() {

  if (typeof Box2D === "undefined") {
    setTimeout(tryPhysics, 200); 
    return;
  }

  // ================= SHORTCUT ALIASSES
  var b2Vec2 = Box2D.Common.Math.b2Vec2,
      b2BodyDef = Box2D.Dynamics.b2BodyDef,
      b2Body = Box2D.Dynamics.b2Body,
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
      b2Fixture = Box2D.Dynamics.b2Fixture,
      b2World = Box2D.Dynamics.b2World,
      b2MassData = Box2D.Collision.Shapes.b2MassData,
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  // ================= BOX2D CODE FOR BARS
  var Bar = function(gamediv, element, world) {
    var pbbox = gamediv.getBoundingClientRect();
    var bbox = element.getBoundingClientRect();

    this.el = element;    
    this.width = bbox.width;
    this.height = bbox.height;

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_staticBody;

    var fixDef = new b2FixtureDef;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(bbox.width/2, bbox.height/2);

    fixDef.density = 10;
    fixDef.friction = 0;
    fixDef.restitution = 0;

    bodyDef.position.x = bbox.left - pbbox.left + bbox.width/2;
    bodyDef.position.y = bbox.top - pbbox.top + bbox.height/2;
    
    this.start_x = bodyDef.position.x;
    this.start_y = bodyDef.position.y;

    this.b2 = world.CreateBody(bodyDef);
    this.b2.CreateFixture(fixDef);
    
    // mark as reflected
    element.box2dObject = this;

    // Contact listening
    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.BeginContact = function(contact) { }
    listener.EndContact = function(contact) {}
    listener.PreSolve = function(contact, oldManifold) {}
    listener.PostSolve = function(contact, impulse) {}
    world.SetContactListener(listener);
  };
  Bar.prototype = {
    el: null,
    b2: null,
    start_x: 0, start_y: 0,
    width: 0, height: 0,
    center: function() { return this.b2.GetWorldCenter(); },
    update: function() {
      var c = this.center();
      this.el.style.left = (c.x-this.width/2) + "px";
      this.el.style.top = (c.y-this.height/2) + "px";
    },
    applyImpulse: function(x,y) {
      var c = this.center();
      this.b2.ApplyImpulse(new b2Vec2(x,y), c); 
    },
    applyForce: function(x,y) {
      var c = this.center();
      this.b2.ApplyForce(new b2Vec2(x,y), c); 
    },
    moveBy: function(x,y) {
      var v = this.b2.GetPosition();
      v.x += x;
      v.y += y;
      this.b2.SetPosition(v);
    }
  };
  Bar.prototype.constructor = Bar;

  // ================= BOX2D CODE FOR THE BALL
  var Ball = function(gamediv, element, world) {
    var pbbox = gamediv.getBoundingClientRect();
    var bbox = element.getBoundingClientRect();

    this.el = element;
    this.width = bbox.width;
    this.height = bbox.height;

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;

    var fixDef = new b2FixtureDef;
    fixDef.shape = new b2CircleShape; //new b2PolygonShape;
    fixDef.shape.SetRadius(bbox.width/2);

    fixDef.density = element.getAttribute("data-density") || 0;
    fixDef.friction = element.getAttribute("data-friction") || 0;
    fixDef.restitution = element.getAttribute("data-bounciness") || 1;

    bodyDef.position.x = bbox.left - pbbox.left + bbox.width/2;
    bodyDef.position.y = bbox.top - pbbox.top + bbox.height/2;

    this.start_x = bodyDef.position.x;
    this.start_y = bodyDef.position.y;

    this.b2 = world.CreateBody(bodyDef);
    this.b2.CreateFixture(fixDef);

    // mark as reflected
    element.box2dObject = this; 

    // add change monitoring
    element.onchange = (function(ball) {
      return function() {
        // rebind attributes
        console.log("rebinding attrs for ", ball);
        var body = ball.b2,
            fixture = ball.b2.GetFixtureList(),
            element = ball.el;
        fixture.SetDensity(element.getAttribute("data-density"));
        fixture.SetFriction(element.getAttribute("data-friction"));
        fixture.SetRestitution(element.getAttribute("data-bounciness"));
      };
    }(this));
  };

  Ball.prototype = Bar.prototype;
  Ball.prototype.constructor = Ball;


  // ================= BOX2D MAIN CODE
  var gravity = new b2Vec2(0,0);
  var world = new b2World(gravity, true);

  // setup the world box
  var setupWorldBox = function(worldbox) {
    var worldAABB = new Box2D.Collision.b2AABB;
    worldAABB.lowerBound.Set(0,0);
    worldAABB.upperBound.Set(worldbox.width, worldbox.height);
    var gravity = new b2Vec2(0, 0);
    var doSleep = true;
    var world = new b2World(worldAABB, gravity, doSleep);
  }

  var movePaddles = function() {
   var speed = 2; // pixels per event trigger
   if(keys[0]) leftPaddle.moveBy(0,-speed);
   if(keys[1]) leftPaddle.moveBy(0,speed);
   if(keys[2]) rightPaddle.moveBy(0,-speed);
   if(keys[3]) rightPaddle.moveBy(0,speed);
  }

  // draw loop
  var paused = false;
  var drawFrame = function() {
     world.Step(1/60,10,10);
     world.ClearForces();
     movePaddles();
     balls.forEach(function(ball) {
       ball.update();
       var pos = ball.b2.GetPosition(),
           w = ball.width/2,
           h = ball.height/2;
       if (pos.x+w < 0 || pos.x-w > worldBBox.width) {
         if(pos.x+w<0) { rightWins(); }
         else { leftWins(); }
         pos.x = ball.start_x;
         pos.y = ball.start_y;
         ball.b2.SetPosition(pos);
       }
     });
     leftPaddle.update();
     rightPaddle.update();
     if(!paused) {
       requestAnimFrame(drawFrame);
     }
  };
  
  // pause/resume the game
  window.pause = function pause() {
    paused = !paused;
    if(!paused) { requestAnimFrame(drawFrame); }
  }

  // start the game
  window.start = function start() {
    var worldParent = document.querySelector("#world");
    worldBBox = worldParent.getBoundingClientRect();
    setupWorldBox(worldBBox);
    
    // top/bottom walls
    new Bar(worldParent, document.querySelector(".top.wall"), world);
    new Bar(worldParent, document.querySelector(".bottom.wall"), world);

    // paddles
    leftPaddle = new Bar(worldParent, document.querySelector(".paddle.left"), world);
    rightPaddle = new Bar(worldParent, document.querySelector(".paddle.right"), world);

    // the playing ball
    var ballElements = document.querySelectorAll(".ball"), len = ballElements.length, i, ballElement;
    for(i=0; i<len; i++) {
      ballElement = ballElements[i];
      ball = new Ball(worldParent, ballElement, world);
      ball.applyImpulse(-200,150);
      balls.push(ball);
    }

    /**
     * What do we do when a DOM node is inserted into the world?
     */
    worldParent.addEventListener("DOMNodeInserted", function(evt) {
      var el = evt.srcElement;
      if(el.nodeType===1 && typeof el.box2dObject === "undefined") {
        // what should we do with this thing?
        var classes = el.getAttribute("class");

        // new ball object?
        if(!!classes.match(new RegExp("\\b" + 'ball' + "\\b",""))) {
          var ball = new Ball(worldParent, el, world);
          ball.applyImpulse(Math.random() > 0.5 ? 200 : -200, Math.random() > 0.5 ? 150 : -150);
          balls.push(ball);
        }
        
        // new paddle/wall?
        // TODO: ...CODE GOES HERE...

      }
    }, false);

    /**
     * What do we do when a DOM node is removed from the world?
     */
    worldParent.addEventListener("DOMNodeRemoved", function(evt) {
      var el = evt.srcElement;
      if(el.nodeType===1 && typeof el.box2dObject !== "undefined") {
        // what should we do with this thing?
        var classes = el.getAttribute("class");

        // Ball object?
        if(!!classes.match(new RegExp("\\b" + 'ball' + "\\b",""))) {
          var ball = el.box2dObject;
          // destroy ball
          world.DestroyBody(ball.b2);
        }
        
        // Paddle/Wall?
        // TODO: ...CODE GOES HERE...

      }
    }, false);

    // focus on the game and start the loop
    worldParent.focus();
    drawFrame();
  };

}());

