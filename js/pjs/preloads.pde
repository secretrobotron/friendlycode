/**
 * override!
 * this disables the default "loop()" when using addScreen
 */
void addScreen(String name, Screen screen) {
  screenSet.put(name, screen);
  if (activeScreen == null) { activeScreen = screen; }
  else { SoundManager.stop(activeScreen); }
}

/* @pjs pauseOnBlur="true";
        preload=" ../js/pjs/graphics/mute.gif,
                  ../js/pjs/graphics/unmute.gif,
                  
                  ../js/pjs/graphics/assorted/Block.gif,
                  ../js/pjs/graphics/assorted/Coin-block.gif,
                  ../js/pjs/graphics/assorted/Coin-block-exhausted.gif,
                  ../js/pjs/graphics/assorted/Dragon-coin.gif,
                  ../js/pjs/graphics/assorted/Flower.gif,
                  ../js/pjs/graphics/assorted/Flowerpower.gif,
                  ../js/pjs/graphics/assorted/Goal-back.gif,
                  ../js/pjs/graphics/assorted/Goal-front.gif,
                  ../js/pjs/graphics/assorted/Goal-slider.gif,
                  ../js/pjs/graphics/assorted/Key.gif,
                  ../js/pjs/graphics/assorted/Keyhole.gif,
                  ../js/pjs/graphics/assorted/Mushroom.gif,
                  ../js/pjs/graphics/assorted/Passthrough-block.gif,
                  ../js/pjs/graphics/assorted/Pipe-body.gif,
                  ../js/pjs/graphics/assorted/Pipe-head.gif,
                  ../js/pjs/graphics/assorted/Regular-coin.gif,
                  ../js/pjs/graphics/assorted/Sky-block.gif,
                  ../js/pjs/graphics/assorted/Special.gif,
                  ../js/pjs/graphics/assorted/Target.gif,
                  ../js/pjs/graphics/assorted/Teleporter.gif,

                  ../js/pjs/graphics/backgrounds/bush-01.gif,
                  ../js/pjs/graphics/backgrounds/bush-02.gif,
                  ../js/pjs/graphics/backgrounds/bush-03.gif,
                  ../js/pjs/graphics/backgrounds/bush-04.gif,
                  ../js/pjs/graphics/backgrounds/bush-05.gif,

                  ../js/pjs/graphics/backgrounds/cave-corner-left.gif,
                  ../js/pjs/graphics/backgrounds/cave-corner-right.gif,
                  ../js/pjs/graphics/backgrounds/cave-filler.gif,
                  ../js/pjs/graphics/backgrounds/cave-side-left.gif,
                  ../js/pjs/graphics/backgrounds/cave-side-right.gif,
                  ../js/pjs/graphics/backgrounds/cave-top.gif,

                  ../js/pjs/graphics/backgrounds/ground-corner-left.gif,
                  ../js/pjs/graphics/backgrounds/ground-corner-right.gif,
                  ../js/pjs/graphics/backgrounds/ground-filler.gif,
                  ../js/pjs/graphics/backgrounds/ground-side-left.gif,
                  ../js/pjs/graphics/backgrounds/ground-side-right.gif,
                  ../js/pjs/graphics/backgrounds/ground-slant.gif,
                  ../js/pjs/graphics/backgrounds/ground-top.gif,

                  ../js/pjs/graphics/backgrounds/bonus.gif,
                  ../js/pjs/graphics/backgrounds/nightsky_bg.gif,
                  ../js/pjs/graphics/backgrounds/nightsky_fg.gif,
                  ../js/pjs/graphics/backgrounds/sky.gif,
                  ../js/pjs/graphics/backgrounds/sky_2.gif,

                  ../js/pjs/graphics/decals/100.gif,
                  ../js/pjs/graphics/decals/200.gif,
                  ../js/pjs/graphics/decals/300.gif,
                  ../js/pjs/graphics/decals/400.gif,
                  ../js/pjs/graphics/decals/500.gif,
                  ../js/pjs/graphics/decals/1000.gif,

                  ../js/pjs/graphics/enemies/Banzai-bill.gif,
                  ../js/pjs/graphics/enemies/Boo-chasing.gif,
                  ../js/pjs/graphics/enemies/Boo-waiting.gif,
                  ../js/pjs/graphics/enemies/Coin-boo-transition.gif,
                  ../js/pjs/graphics/enemies/Dead-koopa.gif,
                  ../js/pjs/graphics/enemies/Muncher.gif,
                  ../js/pjs/graphics/enemies/Naked-koopa-walking.gif,
                  ../js/pjs/graphics/enemies/Red-koopa-flying.gif,
                  ../js/pjs/graphics/enemies/Red-koopa-standing.gif,
                  ../js/pjs/graphics/enemies/Red-koopa-walking.gif,

                  ../js/pjs/graphics/mario/big/Crouching-mario.gif,
                  ../js/pjs/graphics/mario/big/Jumping-mario.gif,
                  ../js/pjs/graphics/mario/big/Looking-mario.gif,
                  ../js/pjs/graphics/mario/big/Running-mario.gif,
                  ../js/pjs/graphics/mario/big/Spinning-mario.gif,
                  ../js/pjs/graphics/mario/big/Standing-mario.gif,

                  ../js/pjs/graphics/mario/fire/Crouching-mario.gif,
                  ../js/pjs/graphics/mario/fire/Jumping-mario.gif,
                  ../js/pjs/graphics/mario/fire/Looking-mario.gif,
                  ../js/pjs/graphics/mario/fire/Running-mario.gif,
                  ../js/pjs/graphics/mario/fire/Spinning-mario.gif,
                  ../js/pjs/graphics/mario/fire/Standing-mario.gif,

                  ../js/pjs/graphics/mario/small/Crouching-mario.gif,
                  ../js/pjs/graphics/mario/small/Dead-mario.gif,
                  ../js/pjs/graphics/mario/small/Jumping-mario.gif,
                  ../js/pjs/graphics/mario/small/Looking-mario.gif,
                  ../js/pjs/graphics/mario/small/Running-mario.gif,
                  ../js/pjs/graphics/mario/small/Spinning-mario.gif,
                  ../js/pjs/graphics/mario/small/Standing-mario.gif,
                  ../js/pjs/graphics/mario/small/Winner-mario.gif"; */