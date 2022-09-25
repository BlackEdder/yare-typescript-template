// yarn build --main=src/individual.ts -s -w 
// Will upload and build automatically on changes

// Spirits behave as individuals.
// Memory is used to hold their base behaviour
// Behaviour is set at birth, and unlikely to change
//
// They rely heavily on what they see (sight). Goal is to rely as little as
// possible on global knowledge. Only thing they should know is the location of
// the different structures
//
// The following code should help you start things off. Learn more
// in the Documentation
function dist_sq(coor1: Position, coor2 : Position) {
  let a = coor1[0] - coor2[0];
  let b = coor1[1] - coor2[1];
  return a * a + b * b;
}

function distance(coor1, coor2) { return Math.sqrt(dist_sq(coor1, coor2)); }

// TODO: Allow storing (and setting) of arbitrary number of arguments
// e.g. get_memory_at(spirit, 3), set_memory_at(spirit, 3)
// e.g. also need a target, so we choose one and can stick with it
function mark_position(spirit, i) {
  var arr = spirit.mark.split(':');
  if (i < arr.length)
    return arr[i];
  return "";
}

function set_mark_position(spirit, i, value) {
  var arr = spirit.mark.split(':');
  arr[i] = value;
  spirit.set_mark(arr.join(':'))
}

function memory(spirit: Spirit) { return mark_position(spirit, 0); }

function task(spirit) { return mark_position(spirit, 1); }

function set_memory(spirit, value) { set_mark_position(spirit, 0, value); }

function set_task(spirit, value) { set_mark_position(spirit, 1, value); }

function find_closest_enemy(spirit) {
  var min_distance = 5000;
  var enemy = spirit.sight.enemies[0];
  for (let en of spirit.sight.enemies) {
    var dist = distance(spirit.position, spirits[en].position);
    if (dist < min_distance) {
      min_distance = dist;
      enemy = en;
    }
  }
  return spirits[enemy];
}

var my_base;
var enemy_base = base_a2c;
var bases = [ base_zxq, base_a2c, base_p89, base_nua ];
var stars = [ star_zxq, star_a2c, star_p89, star_nua ];

for (let base of bases) {
  // TODO: What if I control multiple?
  // spirits should just go to nearest that is uncontrolled or controlled by me
  if (base.control == "BlackEdder") {
    my_base = base;
    break;
  }
}

stars.sort(function(a, b) {
  return distance(a.position, my_base.position) -
         distance(b.position, my_base.position);
});

function find_nearest_star_with_energy(spirit) {
  var target = stars[0];
  var my_distance = distance(target.position, spirit.position);
  for (let star of stars.slice(1)) {
    var dist = distance(spirit.position, star.position);
    if ((target.energy < 0.25 * target.energy_capacity &&
         star.energy >= 0.25 * star.energy_capacity) ||
        (dist < my_distance && star.energy >= 0.25 * star.energy_capacity)) {
      my_distance = dist;
      target = star;
    }
  }
  return target;
}

function find_nearest_non_enemy_base(spirit) {
  var target = bases[0];
  var my_distance = distance(target.position, spirit.position);
  for (let base of bases.slice(1)) {
    if (base.control == "" || base.control == "BlackEdder") {
      var dist = distance(spirit.position, base.position);
      if (dist < my_distance) {
        my_distance = dist;
        target = base;
      }
    }
  }
  return target;
}

// Spirits decide what to do
for (let spirit of my_spirits) {

  if (spirit.hp == 0) {
    set_task(spirit, "dead");
    continue;
  }

  if (memory(spirit) == "") {
    var nvis = spirit.sight.friends.length;
    if (Math.random() < nvis / 100.0) {
      set_memory(spirit, "builder");
    } else {
      set_memory(spirit, "default");
    }
    console.log("mark: ", spirit.mark);
  }

  if (task(spirit) == "flee") {
    // Keep fleeing!
  } else if (spirit.sight.enemies.length > 0) {
    if (spirit.energy > 0.25 * spirit.energy_capacity) {
      set_task(spirit, "attacking");
    } else {
      set_task(spirit, "flee");
    }
  } else if (spirit.energy == spirit.energy_capacity) {
    set_task(spirit, 'charging');
  } else if (spirit.energy == 0) {
    set_task(spirit, 'harvesting');
  }
}

// Actions to do
for (let spirit of my_spirits) {
  if (task(spirit) == "dead")
    continue;

  if (task(spirit) == 'harvesting') {
    spirit.unlock();
    var target = find_nearest_star_with_energy(spirit);
    spirit.move(target.position);
    spirit.energize(spirit);
  }

  if (task(spirit) == 'charging') {
    spirit.unlock();
    var target = find_nearest_non_enemy_base(spirit);
    spirit.move(target.position);
    spirit.energize(target);
  }

  if (task(spirit) == 'attacking') {
    if (spirit.sight.enemies.length == 0) {
      set_task(spirit, "harvesting");
      continue;
    }
    var enemy = find_closest_enemy(spirit);
    var dist = distance(spirit.position, enemy.position);
    if (dist < 200) {
      spirit.unlock();
      var target = find_nearest_non_enemy_base(spirit);
      spirit.move(target.position);
      spirit.move(stars[0].position);
    } else if (dist < 300) {
      spirit.lock();
      spirit.energize(enemy);
    } else {
      spirit.unlock();
      spirit.move(enemy.position);
    }
  }

  if (task(spirit) == "flee") {
    spirit.unlock();
    var target = find_nearest_non_enemy_base(spirit);
    spirit.move(target.position);
    if (distance(spirit.position, target.position) < 300)
      set_task(spirit, "harvesting")
  }
}
//console.log("We made it to the end: ", my_spirits.length);
