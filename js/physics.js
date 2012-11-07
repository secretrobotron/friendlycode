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

// ================= Very simple API for onbounce="..." handling

var OnBounceAPI = {
  // destroy the box2d object associated with the selector's element
  destroy: function(selector) {
    var element = document.querySelector(selector);
    if(!element) return
    var box2d = element.box2dObject;
    scheduleDestroy(box2d);
    element.setAttribute("data-destroyed",true);
  },

  // set an HTML element's css class to something (reverting after [expiry] seconds)
  setClass: function(selector, className, expiry) {
    var element = document.querySelector(selector);
    if(!element) return;
    element.classList.add(className);
    if(expiry) {
      setTimeout(function() { element.classList.remove(className); }, expiry);
    }
  },

  // scale the speed box2d object associated with the selector's element
  scaleSpeed: function(selector, factor) {
    var element = document.querySelector(selector);
    if(!element) return;
    var box2d = element.box2dObject;
    box2d.scaleSpeed(factor);
  },

  // play a sound from an <audio> element
  audio: new Audio(),
  play: function(selector) {
    var element = document.querySelector(selector);
    if(!element) return;
    this.audio.src = element.src;
    this.audio.play();
  },

  // keep score by incrementing the selector's innerHTML value by <increment>
  tally: function(selector, increment) {
    var element = document.querySelector(selector);
    if(element) {
      var value = (element.innerHTML == "" ? 0 : parseInt(element.innerHTML));
      element.innerHTML = value+parseInt(increment);
    }
  },

  // simple scoring for the "left" and "right" spans in the score pane
  scoreLeft: function(val) { this.tally(".scores .left", val || 1);},
  scoreRight: function(val) { this.tally(".scores .right", val || 1);}
}


// ================= Simplistic keyhandling (for now...)

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
  if(element) {
    var value = (element.innerHTML == "" ? 0 : parseInt(element.innerHTML));
    element.innerHTML = value+1;
  }
};

var leftWins = function()  { wins(".scores .left");  };
var rightWins = function() { wins(".scores .right"); };

// ================= HANDLES

var balls = [], bars = [], leftPaddle, rightPaddle, worldBBox;


// ================= TRY TO RUN BOX2D CODE:

(function tryPhysics() {

  if (typeof Box2D === "undefined") {
    setTimeout(tryPhysics, 200);
    return;
  }

// ================= SCALING IS HARDCORE REQUIRED: 30 pixels to 1 meter

var BOX2D_PIXELS_PER_METER = 30;
function toBox2DValue(v) { return v/BOX2D_PIXELS_PER_METER; }
function fromBox2DValue(v) { return BOX2D_PIXELS_PER_METER*v; }

// ================= SHORTCUT ALIASSES

  var b2Vec2 = Box2D.Common.Math.b2Vec2,
      b2BodyDef = Box2D.Dynamics.b2BodyDef,
      b2Body = Box2D.Dynamics.b2Body,
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
      b2Fixture = Box2D.Dynamics.b2Fixture,
      b2World = Box2D.Dynamics.b2World,
      b2ContactListener = Box2D.Dynamics.b2ContactListener,
      b2MassData = Box2D.Collision.Shapes.b2MassData,
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

// ================= BOX2D CODE FOR BARS

  var Bar = function(gamediv, element, world) {
    this.world = world;

    var pbbox = gamediv.getBoundingClientRect();
    var bbox = element.getBoundingClientRect();

    this.el = element;
    this.width = toBox2DValue(bbox.width);
    this.height = toBox2DValue(bbox.height);

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_staticBody;

    var fixDef = new b2FixtureDef;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(toBox2DValue(bbox.width/2), toBox2DValue(bbox.height/2));

    fixDef.density = 1;
    fixDef.friction = 0;
    fixDef.restitution = 0;

    bodyDef.position.x = toBox2DValue(bbox.left - pbbox.left + bbox.width/2);
    bodyDef.position.y = toBox2DValue(bbox.top - pbbox.top + bbox.height/2);

    this.start_x = bodyDef.position.x;
    this.start_y = bodyDef.position.y;

    this.b2 = world.CreateBody(bodyDef);
    this.b2.CreateFixture(fixDef);

    // mark as reflected
    element.box2dObject = this;
    this.b2.SetUserData({element: element, object: this});
  };
  Bar.prototype = {
    world: null,
    el: null,
    b2: null,
    start_x: 0, start_y: 0,
    width: 0, height: 0,
    center: function() { return this.b2.GetWorldCenter(); },
    update: function() {
      var c = this.center();
      this.el.style.left = fromBox2DValue(c.x-this.width/2) + "px";
      this.el.style.top = fromBox2DValue(c.y-this.height/2) + "px";

      // make sure our dimensions are still correct, based on CSS
      var bbox = this.el.getBoundingClientRect(),
          w = toBox2DValue(parseInt(bbox.width)),
          h = toBox2DValue(parseInt(bbox.height));
      if((w|0)!=(this.width|0) || (h|0)!=(this.height|0)) {
        var fixdef = this.b2.GetFixtureList(),
            shape = fixdef.GetShape();
        this.updateShape(shape, c, w, h);
      }
    },
    updateShape: function(shape, c, w, h) {
      // modify as box
      if(shape.SetAsBox) {
        shape.SetAsBox(w/2, h/2);
        this.el.style.left = fromBox2DValue(c.x-w/2) + "px";
        this.el.style.top = fromBox2DValue(c.y-h/2) + "px";
      }
      // modify as circle
      else if(shape.SetRadius) {
        // FIXME: right now we're treating balls as circles,
        //        although, really, we want to treat them as
        //        high-n polygons.
        shape.SetRadius((w+h)/4);
        this.el.style.left = fromBox2DValue(c.x-w/2) + "px";
        this.el.style.top = fromBox2DValue(c.y-h/2) + "px";
      }
      // universal binds
      this.b2.SetPosition(c);
      this.width = w;
      this.height = h;
    },
    applyImpulse: function(x,y) {
      var c = this.center();
      this.b2.ApplyImpulse(new b2Vec2(x,y), c);
    },
    applyForce: function(x,y) {
      var c = this.center();
      this.b2.ApplyForce(new b2Vec2(x,y), c);
    },
    setSpeed: function(x, y) {
      this.b2.SetAwake(true);
      this.b2.SetLinearVelocity(new b2Vec2(x,y));
    },
    scaleSpeed: function(f) {
      var v = this.b2.GetLinearVelocity();
      v.Multiply(f);
      this.setSpeed(v.x, v.y);
    },
    moveBy: function(x,y) {
      var v = this.b2.GetPosition();
      v.x += x;
      v.y += y;
      this.b2.SetPosition(v);
    },
    onbounce: function() {
      var element = this.el;
      if(element.hasAttribute("onbounce")) {
        var bounceCode = element.getAttribute("onbounce");
        // form the list of function calls
        var split = bounceCode.split(")"),
            code = [];
        split.forEach(function(s) {
          if(!s.trim()) return;
          code.push("OnBounceAPI." + s.trim() + ");");
        });
        // create a new function that runs through the calls,
        // and is triggered as an onbounce (called by box2d contact listener)
        try {
          var fn = new Function(code.join("\n"));
          try { fn(); }
          catch(runtimeError) {
            // runtime error in code: throw it up
            throw(runtimeError);
          }
        } catch(syntaxRrror) {
          // syntax error in Function - don't run it.
          console.log("syntax error");
        }
      }
    }
  };
  Bar.prototype.constructor = Bar;

// ================= BOX2D CODE FOR THE BALL

  var Ball = function(gamediv, element, world) {
    this.world = world;

    var pbbox = gamediv.getBoundingClientRect();
    var bbox = element.getBoundingClientRect();

    this.el = element;
    this.width = toBox2DValue(bbox.width);
    this.height = toBox2DValue(bbox.height);

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;

    var fixDef = new b2FixtureDef;
    fixDef.shape = new b2CircleShape; //new b2PolygonShape;
    fixDef.shape.SetRadius(toBox2DValue(bbox.width/2));

    fixDef.density = element.getAttribute("data-density") || 0;
    fixDef.friction = element.getAttribute("data-friction") || 0;
    fixDef.restitution = element.getAttribute("data-elasticity") || element.getAttribute("data-bounciness") || 1;

    bodyDef.position.x = toBox2DValue(bbox.left - pbbox.left + bbox.width/2);
    bodyDef.position.y = toBox2DValue(bbox.top - pbbox.top + bbox.height/2);

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

    this.b2.SetUserData({element: element, object: this});
  };

  Ball.prototype = Bar.prototype;
  Ball.prototype.constructor = Ball;

// ================= CONTACT LISTENING

  function createCollisionListener() {
    var listener = new b2ContactListener();
    listener.BeginContact = function(contact) {
      var bar = contact.GetFixtureA().GetBody().GetUserData().element;
      var ball = contact.GetFixtureB().GetBody().GetUserData().element;
       bar.classList.add("colliding");
       ball.classList.add("colliding");
    };
    listener.EndContact = function(contact) {
      var bar = contact.GetFixtureA().GetBody().GetUserData().element;
      var ball = contact.GetFixtureB().GetBody().GetUserData().element;
      bar.classList.remove("colliding");
      ball.classList.remove("colliding");
    };
    listener.PreSolve = function(contact, oldManifold) {};
    listener.PostSolve = function(contact, impulse) {
      var o1 = contact.GetFixtureA().GetBody().GetUserData().object;
      var o2 = contact.GetFixtureB().GetBody().GetUserData().object;
      o1.onbounce();
      o2.onbounce();
    };
    return listener;
  };

// ================= BOX2D MAIN CODE

  var gravity = new b2Vec2(0,0);
  var world = new b2World(gravity, true);
  var scheduledRemoval = [];

  var movePaddles = function() {
   var speed = 0.1; // pixels per event trigger
   if(leftPaddle) {
     if(keys[0]) leftPaddle.moveBy(0,-speed);
     if(keys[1]) leftPaddle.moveBy(0,speed);
   }
   if(rightPaddle) {
     if(keys[2]) rightPaddle.moveBy(0,-speed);
     if(keys[3]) rightPaddle.moveBy(0,speed);
   }
  }

  // schedule an object for destruction
  window.scheduleDestroy = function(body) {
    scheduledRemoval.push(body);
  }

  // draw loop
  var paused = false;
  var drawFrame = function() {

    // cleanup bodies that should have been removed during collision
    scheduledRemoval.forEach(function(body) {
      world.DestroyBody(body.b2);
      var pos = bars.indexOf(body);
      bars.splice(pos,1);
    });
    scheduledRemoval = [];

    // next step.
    world.Step(1/60,10,10);
    world.ClearForces();

    // allow the paddles to be moved based on keyinput
    movePaddles();

    // check ball-in-world validity
    balls.forEach(function(ball) {
      ball.update();
      var pos = ball.b2.GetPosition(),
          w = ball.width/2,
          h = ball.height/2;
      // out of bounds?
      if (pos.x+w < 0 || pos.x-w > toBox2DValue(worldBBox.width) || pos.y+h < 0 || pos.y-h > toBox2DValue(worldBBox.height)) {
        if(pos.x+w < 0) { rightWins(); }
        else { leftWins(); }
        pos.x = ball.start_x;
        pos.y = ball.start_y;
        ball.b2.SetPosition(pos);
      }
    });

    bars.forEach(function(bar) {
      bar.update();
    });

    if(!paused) {
      requestAnimFrame(drawFrame);
    }
  };

  // pause/resume the game
  window.pause = function pause() {
    paused = !paused;
    if(!paused) { requestAnimFrame(drawFrame); }

    document.querySelector("button[onclick='pause()']").innerHTML = (paused ? "Resume" : "Pause") + " the game";
  }

  // start the game
  window.start = function start() {
    // disable start button
    document.querySelector("button[onclick='start()']").disabled = true;

    var worldParent = document.querySelector("#world");
    worldBBox = worldParent.getBoundingClientRect();

    // fix gravity
    (function(){
      var grav = worldParent.getAttribute("data-gravity");
      if(grav) {
        var values = grav.split(",");
        if(values.length==2 && typeof values[0] !== "undefined" && typeof values[1] !== "undefined") {
          var xval = parseFloat(values[0]);
          if(xval != values[0]) return;
          var yval = parseFloat(values[1]);
          if(yval != values[1]) return;
          gravity.x = xval;
          gravity.y = yval;
          world = new b2World(gravity, true);
        }
      }
    }());

    // set up the bounce listening
    world.SetContactListener(createCollisionListener());

    // walls
    (function(){
      var wallElements = document.querySelectorAll(".wall"), len = wallElements.length, i, wallElement;
      for(i=0; i<len; i++) {
        wallElement = wallElements[i];
        wall = new Bar(worldParent, wallElement, world);
        bars.push(wall);
      }
    }());

    // paddles
    (function(){
      var lp = document.querySelector(".paddle.left");
      if(lp) {
        leftPaddle = new Bar(worldParent, lp, world);
        bars.push(leftPaddle);
      }
      var rp = document.querySelector(".paddle.right");
      if(rp) {
        rightPaddle = new Bar(worldParent, rp, world);
        bars.push(rightPaddle);
      }
    }());


    // user defined "bars"
    (function(){
      var barElements = document.querySelectorAll(".bar"), len = barElements.length, i, barElement;
      for(i=0; i<len; i++) {
        barElement = barElements[i];
        bar = new Bar(worldParent, barElement, world);
        bars.push(bar);
      }
    }());

    // the playing ball(s)
    (function(){
      var ballElements = document.querySelectorAll(".ball"), len = ballElements.length, i, ballElement;
      for(i=0; i<len; i++) {
        ballElement = ballElements[i];
        ball = new Ball(worldParent, ballElement, world);
        ball.applyForce(gravity.x, gravity.y);
        ball.applyImpulse(-3,2);
        balls.push(ball);
      }
    }());

    worldParent.onchange = (function(element) {
      return function() {
        // handle gravity
        var grav = element.getAttribute("data-gravity");
        if(grav) {
          var values = grav.split(",");
          if(values.length==2 && typeof values[0] !== "undefined" && typeof values[1] !== "undefined") {
            var xval = parseFloat(values[0]);
            if(xval != values[0]) return;
            var yval = parseFloat(values[1]);
            if(yval != values[1]) return;
            bars.forEach(function(e) { e.applyForce(xval, yval); });
            balls.forEach(function(e) { e.applyForce(xval, yval); });
            gravity.x = xval;
            gravity.y = yval;
          }
        }
      }
    }(worldParent));

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
          ball.applyImpulse((Math.random() * 4) - 2, (Math.random() * 3) - 1.5);
          balls.push(ball);
        }

        // new wall/bar/paddle object?
        var isWallObject = !!classes.match(new RegExp("\\b" + 'wall' + "\\b","")),
            isBarObject = !!classes.match(new RegExp("\\b" + 'bar' + "\\b","")),
            isPaddleObject = !!classes.match(new RegExp("\\b" + 'paddle' + "\\b",""));
        if(isWallObject || isBarObject || isPaddleObject) {
          var bar = new Bar(worldParent, el, world);
          bars.push(bar);
        }
      }
    }, false);

    /**
     * What do we do when a DOM node is removed from the world?
     */
    worldParent.addEventListener("DOMNodeRemoved", function(evt) {
      var el = evt.srcElement;
      if(el.nodeType===1 && typeof el.box2dObject !== "undefined") {
        // step 1: destroy the box2d physics object
        var box2dthing = el.box2dObject;
        world.DestroyBody(box2dthing.b2);

        // step 2: remove the reference to the wrapper object
        //         from the appropriate list of game objects.
        var classes = el.getAttribute("class");

        // Ball object? Remove its reference from the balls list.
        if(!!classes.match(new RegExp("\\b" + 'ball' + "\\b",""))) {
          balls.splice(balls.indexOf(box2dthing),1);
        }

        // Wall/bar/paddle? Remove its reference from the bars list.
        var isWallObject = !!classes.match(new RegExp("\\b" + 'wall' + "\\b","")),
            isBarObject = !!classes.match(new RegExp("\\b" + 'bar' + "\\b","")),
            isPaddleObject = !!classes.match(new RegExp("\\b" + 'paddle' + "\\b",""));
        if(isWallObject || isBarObject || isPaddleObject) {
          bars.splice(bars.indexOf(box2dthing),1);
        }
      }
    }, false);

    // focus on the game and start the loop
    worldParent.focus();
    drawFrame();
  };

}());

