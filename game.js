const MOVE_SPEED = 120;
const JUMP_FORCE = 500;
const ENEMY_SPEED = 20;
const CAM_Y = 100;

const marioGame = document.getElementById('mario');

kaboom({
	global: true,
	width: 320,
	height: 240,
	scale: 2,
	background: [66, 170, 255, 1],
	root: marioGame,
});

// layer "ui" will be on top of layer "game", with "game" layer being the default
layers([
	"game",
	"ui",
], "game")

loadRoot('./graphics/');
loadSprite('coin', 'coin.png');
loadSprite('brick', 'brick.png');
loadSprite('block', 'block.png');
loadSprite('mushroom', 'mushroom.png');
loadSprite('surprise', 'surprise.png');
loadSprite('unboxed', 'unboxed.png');
loadSprite('pipe-top-left', 'pipe-top-left.png');
loadSprite('pipe-top-right', 'pipe-top-right.png');
loadSprite('pipe-bottom-left', 'pipe-bottom-left.png');
loadSprite('pipe-bottom-right', 'pipe-bottom-right.png');
loadSprite('blue-block', 'blue-block.png');
loadSprite('blue-brick', 'blue-brick.png');
loadSprite('blue-steel', 'blue-steel.png');
loadSprite('blue-surprise', 'blue-surprise.png');
loadSprite('evil-shroom', 'evil-shroom.png');
loadSprite('blue-evil-shroom', 'blue-evil-shroom.png');
loadSprite('evil-shroom-killed', 'evil-shroom-killed.png');
loadSprite('blue-evil-shroom-killed', 'blue-evil-shroom-killed.png');
loadSprite('mario-killed', 'mario-killed.png');


loadSprite('mario', 'mario.png', {
	sliceX: 5,
	anims: {
		'idle': 0,
		'run': {
			from: 1,
			to: 3,
		},
		'jump': 4,
	}
});

loadRoot('./sounds/');
loadSound('level1', 'super-mario-saundtrek.mp3');
loadSound('level2', 'underground.mp3');
loadSound('into-the-pipe', 'into-the-pipe.mp3');
loadSound('end', 'end.mp3');
loadSound('death', 'death.mp3');
loadSound('coin', 'coin.mp3');
loadSound('bonus', 'bonus.mp3');
loadSound('jump', 'jumping.mp3');
loadSound('kill', 'kill.mp3');

// Adjust global volume
volume(0.2);

const maps = [
	[
		'                                      ',
		'                                      ',
		'                                      ',
		'                                      ',
		'                                      ',
		'     %   =*=%=                        ',
		'                                      ',
		'                            -+        ',
		'                 ^  ^       ()        ',
		'===============================  =====',
	],
	[
		'&                                      &',
		'&                                      &',
		'&                                      &',
		'&                                      &',
		'&                                      &',
		'&        @@@@@@            xx          &',
		'&                         xxx          &',
		'&                        xxxx x   -+   &',
		'&                 z  z  xxxxx x   ()   &',
		'!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',],
];

const levelCfg = {
	width: 20,
	height: 20,
	'=': () => [sprite('block'), area(), solid()],
	'$': () => [sprite('coin'), body(), area(), 'coin'],
	'%': () => [sprite('surprise'), area(), solid(), 'coin-surprise'],
	'*': () => [sprite('surprise'), area(), solid(), 'mushroom-surprise'],
	'}': () => [sprite('unboxed'), area(), solid()],
	'(': () => [sprite('pipe-bottom-left'), area(), solid(), scale(0.5)],
	')': () => [sprite('pipe-bottom-right'), area(), solid(), scale(0.5)],
	'-': () => [sprite('pipe-top-left'), area(), solid(), scale(0.5), 'pipe'],
	'+': () => [sprite('pipe-top-right'), area(), solid(), scale(0.5), 'pipe'],
	'^': () => [sprite('evil-shroom'), body(), area(), patrol(), 'dangerous'],
	'#': () => [sprite('mushroom'), area(), patrol(), body(), 'mushroom'],
	'!': () => [sprite('blue-block'), area(), solid(), scale(0.5)],
	'&': () => [sprite('blue-brick'), area(), solid(), scale(0.5)],
	'z': () => [sprite('blue-evil-shroom'), body(), area(), scale(0.5), 'dangerous'],
	'@': () => [sprite('blue-surprise'), area(), solid(), scale(0.5), 'coin-surprise'],
	'x': () => [sprite('blue-steel'), area(), solid(), scale(0.5)],
}

// Prepare custom options for characters
function big() {
	let timer = 0
	let isBig = false
	let destScale = 1
	return {
		// component id / name
		id: "big",
		// it requires the scale component
		require: ["scale"],
		// this runs every frame
		update() {
			if (isBig) {
				timer -= dt()
				if (timer <= 0) {
					this.smallify()
				}
			}
			this.scale = this.scale.lerp(vec2(destScale), dt() * 6)
		},
		// custom methods
		isBig() {
			return isBig
		},
		smallify() {
			destScale = 1
			timer = 0
			isBig = false
		},
		biggify(time) {
			destScale = 2
			timer = time
			isBig = true
		},
	}
}

function patrol(speed = 30, dir = 1) {
	return {
		id: 'patrol',
		require: ['pos', 'area',],
		add() {
			this.on('collide', (obj, col) => {
				if (col.isLeft() || col.isRight()) {
					dir = -dir
				}
			})
		},
		update() {
			this.move(speed * dir, 0)
		},
	}
}

scene('game', ({ levelId, score } = { levelId: 0, score: 0 }) => {
	const level = addLevel(maps[levelId ?? 0], levelCfg);

	const scoreLabel = add([
		text(score),
		pos(30, 6),
		{
			value: score,
		}
	]);

	add([text('level ' + parseInt(levelId + 1)), pos(40, 6)]);

	const music = play('level' + parseInt(levelId + 1), {
		loop: true,
	});
	
	const player = add([
		sprite('mario'),
		area(),
		pos(40, 0),
		scale(1),
		body(),
		big(),
		origin('bot')
	]);

	function playerDie() {
		destroy(player),
			music.stop();
		play('death');
		const marioKilled = add([
			sprite('mario-killed'),
			pos(player.pos.x, player.pos.y),
			area(),
			body(),
		]);
		marioKilled.onUpdate(() => {
			marioKilled.move(MOVE_SPEED, 0);
		});
		marioKilled.jump(JUMP_FORCE);
		wait(1, () => {
			destroy(marioKilled);
			go('lose', { score: scoreLabel.value });
		});
	}

	function scoreFlow(score, position) {
		add([
			pos(position),
			text(score, { size: 12 }),
			lifespan(1),
			move(UP, 50),
		]);
	}

	// First, player spawns in air, so he's in 'jump' mode.
	player.play('jump');

	// onUpdate() runs every frame
	player.onUpdate(() => {
		// camera chases player
		camPos(player.pos.x, CAM_Y);
		// check fall death
		if (player.pos.y >= height()) {
			playerDie();
		}
	});

	player.onGround(() => {
		if (!isKeyDown("left") && !isKeyDown("right")) {
			player.play("idle");
		} else {
			player.play("run");
		}
	});

	player.onHeadbutt((obj) => {
		if (obj.is("coin-surprise")) {
			const coin = level.spawn("$", obj.gridPos.sub(0, 1));
			coin.jump(JUMP_FORCE / 2);
			destroy(obj);
			level.spawn('}', obj.gridPos.sub(0, 0));
			play('coin');
			wait(0.35, () => {
				destroy(coin);
				scoreFlow('100', coin.pos);
			})
		}
		if (obj.is('mushroom-surprise')) {
			level.spawn('#', obj.gridPos.sub(0, 1));
			destroy(obj);
			level.spawn('}', obj.gridPos.sub(0, 0));
			play('bonus');
		}
	});

	player.onGround((l) => {
		if (l.is('dangerous')) {
			player.jump(JUMP_FORCE);
			destroy(l);
			play('kill');
			const evilKilled = add([
				sprite('evil-shroom-killed'),
				pos(l.pos.x, l.pos.y),
				area(),
				body(),
				lifespan(0.5),
			]);
			evilKilled.move(50, 0);
			evilKilled.jump(200);
		}
	});

	player.onCollide('dangerous', (e, col) => {
		// if it's not from the top, die
		if (!col.isBottom()) {
			playerDie();
		}
	});

	onKeyPress("space", () => {
		if (player.isGrounded()) {
			player.jump(JUMP_FORCE);
			player.play("jump");
			play('jump');
		}
	});

	onKeyDown("left", () => {
		player.move(-MOVE_SPEED, 0);
		player.flipX(true);
		// .play() will reset to the first frame of the anim,
		// so we want to make sure it only runs when the current animation is not "run"
		if (player.isGrounded() && player.curAnim() !== "run") {
			player.play("run");
		}
	});

	onKeyDown("right", () => {
		player.move(MOVE_SPEED, 0);
		player.flipX(false);
		if (player.isGrounded() && player.curAnim() !== "run") {
			player.play("run");
		}
	});

	onKeyRelease(["left", "right"], () => {
		// Only reset to "idle" if player is not holding any of these keys
		if (player.isGrounded() && !isKeyDown("left") && !isKeyDown("right")) {
			player.play("idle");
		}
	})

});

scene('lose', ( { score } ) => {
	add([text(score, 32), origin('center'), pos(width() / 2, height() / 2)]);
});

go('game');


