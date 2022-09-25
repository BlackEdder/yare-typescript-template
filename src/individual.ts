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
//
// console.log("Here");
function dist_sq(coor1: Position, coor2: Position) {
  let a = coor1[0] - coor2[0];
  let b = coor1[1] - coor2[1];
  return a * a + b * b;
}

function distance(coor1: Position, coor2: Position) {
  return Math.sqrt(dist_sq(coor1, coor2));
}

// TODO: Allow storing (and setting) of arbitrary number of arguments
// e.g. get_behaviour_at(spirit, 3), set_behaviour_at(spirit, 3)
// e.g. also need a target, so we choose one and can stick with it
function mark_position(spirit: Spirit, i: number) {
  var arr = spirit.mark.split(':');
  if (i < arr.length)
    return arr[i];
  return "";
}

function set_mark_position(spirit: Spirit, i: number, value: string) {
  var arr = spirit.mark.split(':');
  arr[i] = value;
  spirit.set_mark(arr.join(':'))
}

function behaviour(spirit: Spirit) { return mark_position(spirit, 0); }

function task(spirit: Spirit) { return mark_position(spirit, 1); }

function set_behaviour(spirit: Spirit, value: string) {
  set_mark_position(spirit, 0, value);
}

function set_task(spirit: Spirit, value: string) {
  set_mark_position(spirit, 1, value);
}

function find_closest_enemy(spirit: Spirit) {
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

var my_base: Base;
var bases = [ base_zxq, base_a2c, base_p89, base_nua ];
let basemap: Record<string, Base> = {
  "base_zxq" : base_zxq,
  "base_a2c" : base_a2c,
  "base_p89" : base_p89,
  "base_nua" : base_nua,
};

let structure_map: Record<string, _Structure> = {
  "base_zxq" : base_zxq,
  "base_a2c" : base_a2c,
  "base_p89" : base_p89,
  "base_nua" : base_nua,
  "pylon_u3p" : pylon_u3p,
  "outpost_mdo" : outpost_mdo,
};
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

function find_nearest_star(spirit: Spirit) {
  stars.sort(function(a, b) {
    return distance(a.position, spirit.position) -
           distance(b.position, spirit.position);
  });
  return stars[0];
}

function find_nearest_star_with_energy(spirit: Spirit) {
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
function in_enemy_control(entity: Base) {
  return (entity.control != "BlackEdder" && entity.control != "");
}

function find_nearest_non_enemy_base(spirit: Spirit) {
  var target = bases[0];
  var my_distance = distance(target.position, spirit.position);
  for (let base of bases.slice(1)) {
    if (!in_enemy_control(base)) {
      var dist = distance(spirit.position, base.position);
      if (dist < my_distance || in_enemy_control(target)) {
        my_distance = dist;
        target = base;
      }
    }
  }
  return target;
}

function choose_behaviour(spirit: Spirit, force: boolean) {
  let beh = behaviour(spirit);
  if (beh == "" || force) {
    // just born or forced to change
    beh = "default";
    if (Math.random() < 0.2) {
      if (Math.random() < 0.1) {
        set_mark_position(spirit, 2, pylon_u3p.id);
      } else if (Math.random() < 0.1) {
        set_mark_position(spirit, 2, outpost_mdo.id);
      } else {
        bases.sort(function(a, b) {
          return distance(a.position, spirit.position) -
                 distance(b.position, spirit.position);
        });
        set_mark_position(spirit, 2, bases[0].id);
      }
      beh = "maintainer";
    }
  }

  // Should we be defending?
  if (spirit.sight.enemies.length > 1) {
    for (let s_id of spirit.sight.structures) {
      if (basemap[s_id] != undefined && basemap[s_id].control == "BlackEdder") {
        if (Math.random() < 0.75) {
          beh = "defense";
          set_mark_position(spirit, 2, s_id);
        }
      }
    }
    console.log("enemy spotted: ", spirit.mark);
  }
  return beh;
}

function energy_level(entity: Entity) {
  return entity.energy / entity.energy_capacity;
}

function defend(spirit: Spirit, base_id: string) {
  if (spirit.sight.enemies.length > 1 && energy_level(spirit) > 0.1) {
    let enemy = find_closest_enemy(spirit);
    var dist = distance(spirit.position, enemy.position);
    if (dist < 300) {
      spirit.lock();
      spirit.energize(enemy);
      return;
    }
  }
  if (energy_level(spirit) >= 0.5) {
    spirit.unlock();
    let target = basemap[base_id];
    spirit.move(target.position);
    spirit.energize(target);
    if (spirit.sight.enemies.length == 0 && Math.random() < 0.05) {
      set_behaviour(spirit, choose_behaviour(spirit, true));
      set_task(spirit, "harvesting");
      if (energy_level(spirit) > 0.5)
        set_task(spirit, "charging");
      console.log("defense stopped: ", spirit.mark);
    }
    return;
  }
  let target = find_nearest_star(spirit);
  spirit.unlock();
  spirit.move(target.position);
  spirit.energize(spirit);
}

// Spirits decide what to do
for (let spirit of my_spirits) {
  if (spirit.hp == 0) {
    set_task(spirit, "dead");
    continue;
  }

  set_behaviour(spirit, choose_behaviour(spirit, false));
  console.log("Mark: ", spirit.mark);

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

  if (behaviour(spirit) == "defense") {
    defend(spirit, mark_position(spirit, 2));
    continue;
  }

  if (task(spirit) == 'harvesting') {
    spirit.unlock();
    let target = find_nearest_star_with_energy(spirit);
    if (behaviour(spirit) == "maintainer") {
      target = find_nearest_star(spirit);
    }
    if (energy_level(target) > 0.20) {
      spirit.move(target.position);
      spirit.energize(spirit);
    } else if (energy_level(spirit) > 0.30) {
      set_task(spirit, "charging");
    }
  }

  if (task(spirit) == 'charging') {
    spirit.unlock();
    if (behaviour(spirit) == "maintainer") {
      let target = structure_map[mark_position(spirit, 2)];
      spirit.move(target.position);
      spirit.energize(target)
    } else {
      let target = find_nearest_non_enemy_base(spirit);
      spirit.move(target.position);
      spirit.energize(target);
    }
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
      let target = find_nearest_non_enemy_base(spirit);
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
    if (energy_level(spirit) > 0 && Math.random() < 0.1) {
      spirit.jump([
        spirit.position[0] + (Math.random() - 0.5) * spirit.energy * 5,
        spirit.position[1] + (Math.random() - 0.5) * spirit.energy * 5
      ]);
    } else {
      let target = find_nearest_non_enemy_base(spirit);
      spirit.move(target.position);
      if (distance(spirit.position, target.position) < 300)
        set_task(spirit, "harvesting")
    }
  }
}
console.log("We made it to the end: ", my_spirits.length);
