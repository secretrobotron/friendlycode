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

document.querySelector("#world").onkeydown = keyPressed;
document.querySelector("#world").onkeyup = keyReleased;


// ================= DRAW LOOP REQUEST
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var ball, leftPaddle, rightPaddle;
  
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

    this.b2 = world.CreateBody(bodyDef);
    this.b2.CreateFixture(fixDef);

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
    fixDef.restitution = element.getAttribute("data-bounciness") || 20;

    bodyDef.position.x = bbox.left - pbbox.left + bbox.width/2;
    bodyDef.position.y = bbox.top - pbbox.top + bbox.height/2;

    this.b2 = world.CreateBody(bodyDef);
    this.b2.CreateFixture(fixDef);

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

    // ground
    var SCALE = 30;
    var canvas = {
      width: worldbox.width,
      height: worldbox.height
    }
     
    var fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;
   
    var bodyDef = new b2BodyDef;
   
    //create ground
    bodyDef.type = b2Body.b2_staticBody;
    
    // positions the center of the object (not upper left!)
    bodyDef.position.x = canvas.width / 2 / SCALE;
    bodyDef.position.y = canvas.height / SCALE;
    
    fixDef.shape = new b2PolygonShape;
    
    // half width, half height. eg actual height here is 1 unit
    fixDef.shape.SetAsBox((600 / SCALE) / 2, (10/SCALE) / 2);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
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
     ball.update();
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
    var worldBBox = worldParent.getBoundingClientRect();
    setupWorldBox(worldBBox);
    
    // top/bottom walls
    new Bar(worldParent, document.querySelector(".top.wall"), world);
    new Bar(worldParent, document.querySelector(".bottom.wall"), world);

    // paddles
    leftPaddle = new Bar(worldParent, document.querySelector(".paddle.left"), world);
    rightPaddle = new Bar(worldParent, document.querySelector(".paddle.right"), world);

    // the playing ball
    ball = new Ball(worldParent, document.querySelector(".ball"), world);
    ball.applyImpulse(-200,150);

    // focus on the game and start the loop
    worldParent.focus();
    drawFrame();
  }
  
}());

