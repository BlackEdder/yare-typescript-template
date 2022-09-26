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
import {distance} from "./basic_functions";
import {
  behaviour,
  mark_position,
  set_behaviour,
  set_mark_position,
  set_task,
  task
} from "./mark";

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

function charge_target(spirit: Spirit, target: Entity) {
  if (distance(spirit.position, target.position) > 200)
    spirit.move(target.position);
  else
    spirit.energize(target)
}

function charge(spirit: Spirit) {
  if (behaviour(spirit) == "maintainer") {
    let target = structure_map[mark_position(spirit, 2)];
    let suit = spirit.sight.friends.map((a) => spirits[a])
                   .filter((b) => {
                     return (task(b) == "charging" &&
                             mark_position(b, 2) == target.id &&
                             energy_level(b) < 0.75 &&
                             (distance(b.position, target.position) + 100 <
                              distance(spirit.position, target.position)) &&
                             distance(b.position, spirit.position) > 150 &&
                             distance(b.position, spirit.position) < 200);
                   })
                   .sort((a, b) => distance(b.position, spirit.position) -
                                   distance(a.position, spirit.position));
    if (suit.length > 0) {
      charge_target(spirit, suit[0]);
    } else {
      charge_target(spirit, target);
    }
  } else {
    let friends = spirit.sight.friends;
    let target = find_nearest_non_enemy_base(spirit);
    let suit = friends.map((a) => spirits[a])
                   .filter((b) => {
                     return (task(b) == "charging" && energy_level(b) < 0.75 &&
                             (distance(b.position, target.position) + 100 <
                              distance(spirit.position, target.position)) &&
                             distance(b.position, spirit.position) > 150 &&
                             distance(b.position, spirit.position) < 200);
                   })
                   .sort((a, b) => distance(b.position, spirit.position) -
                                   distance(a.position, spirit.position));
    if (suit.length > 0) {
      charge_target(spirit, suit[0]);
    } else {
      charge_target(spirit, target);
    }
  }
}

function merge(spirit: Spirit) {
  let target_id: any = mark_position(spirit, 2);
  if (target_id == "") {
    let arr = spirit.sight.friends.map((a) => spirits[a])
                  .filter((a) => a.size < 100 && energy_level(a) > 0.2 &&
                                 task(a) != "merge")
                  .sort((a, b) => distance(a.position, spirit.position) -
                                  distance(b.position, spirit.position));
    if (arr.length == 0) {
      set_task(spirit, "charging");
    }
    target_id = arr[0].id;
    set_mark_position(spirit, 2, arr[0].id);
  }
  if (spirits[target_id] != undefined &&
      spirits[target_id].position != undefined) {
    spirit.move(spirits[target_id].position);
    spirit.merge(spirits[target_id]);
  } else {
    set_task(spirit, "charging");
  }
}

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
  if (spirit.hp == 0)
    return "dead";
  if (beh == "" || force) {
    // just born or forced to change
    beh = "default";
    if (Math.random() < 0.2) {
      if (Math.random() < 0.1) {
        set_mark_position(spirit, 2, pylon_u3p.id);
      } else if (Math.random() < 0.1) {
        set_mark_position(spirit, 2, outpost_mdo.id);
      } else {
        let bss =
            bases.filter((a) => !in_enemy_control(a)).sort(function(a, b) {
              return distance(a.position, spirit.position) -
                     distance(b.position, spirit.position);
            });
        let id = 0;
        if (Math.random() < 0.1) {
          id = 1;
        } else if (Math.random() < 0.1) {
          id = 2;
        }
        if (id >= bss.length)
          id = bss.length - 1;
        set_mark_position(spirit, 2, bss[id].id);
      }
      beh = "maintainer";
    }
  }
  return beh;
}

function energy_level(entity: Entity) {
  return entity.energy / entity.energy_capacity;
}

// Spirits decide what to do
for (let spirit of my_spirits) {
  if (spirit.hp == 0) {
    set_task(spirit, "dead");
    set_behaviour(spirit, "dead");
    continue;
  }

  set_behaviour(spirit, choose_behaviour(spirit, false));
  // console.log("Mark: ", spirit.mark);

  if (task(spirit) == "flee") {
    // Keep fleeing!
  } else if (spirit.sight.enemies.length > 0) {
    if (spirit.energy > 2 && energy_level(spirit) > 0.1) {
      set_task(spirit, "attacking");
    } else {
      set_task(spirit, "flee");
    }
  } else if (spirit.shape == "circles", spirit.sight.friends.length > 25 &&
                                            spirit.size == 1 &&
                                            Math.random() < 0.1) {
    set_task(spirit, "merge");
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
    let target = find_nearest_star_with_energy(spirit);
    if (behaviour(spirit) == "maintainer") {
      target = find_nearest_star(spirit);
    }
    if (energy_level(target) > 0.20) {
      if (distance(spirit.position, target.position) > 200)
        spirit.move(target.position);
      else
        spirit.energize(spirit);
    } else if (energy_level(spirit) > 0.30) {
      set_task(spirit, "charging");
    }
  }

  if (task(spirit) == 'charging') {
    charge(spirit);
  }

  if (task(spirit) == 'attacking') {
    if (spirit.sight.enemies.length == 0) {
      set_task(spirit, "harvesting");
      continue;
    }
    var enemy = find_closest_enemy(spirit);
    var dist = distance(spirit.position, enemy.position);
    if (dist < 300) {
      spirit.move(enemy.position);
      spirit.energize(enemy);
    } else {
      spirit.move(enemy.position);
    }
  }

  if (task(spirit) == "merge") {
    merge(spirit);
  }

  if (task(spirit) == "flee") {
    let target_id = mark_position(spirit, 2);
    if (target_id == "" ||
        (spirit.sight.enemies.length > 0 && Math.random() < 0.25)) {
      let targets = bases.filter((a) => !in_enemy_control(a));
      let id = Math.floor(Math.random() * targets.length);
      if (targets[id] == undefined)
        target_id = targets[0].id;
      else
        target_id = targets[id].id;
      set_mark_position(spirit, 2, target_id);
    }
    let target = basemap[target_id];
    if (energy_level(spirit) > 0.1 && Math.random() < 0.1) {
      spirit.jump([
        spirit.position[0] + (Math.random() - 0.5) * spirit.energy * 5,
        spirit.position[1] + (Math.random() - 0.5) * spirit.energy * 5
      ]);
    } else {
      spirit.move(target.position);
      if (distance(spirit.position, target.position) < 300)
        set_task(spirit, "harvesting")
    }
  }
}

console.log("We made it to the end: ", my_spirits.length);

let res = my_spirits.reduce<Record<string, number>>((acc, value: Spirit) => {
  let b = behaviour(value);
  if (acc[b] == undefined)
    acc[behaviour(value)] = 1;
  else
    acc[behaviour(value)] += 1;
  return acc;
}, {});
console.log(JSON.stringify(res));

res = my_spirits.reduce((acc, value: Spirit) => {
  let b = task(value);
  if (acc[b] == undefined)
    acc[task(value)] = 1;
  else
    acc[task(value)] += 1;
  return acc;
}, {} as Record<string, number>);
console.log("Tasks: ", JSON.stringify(res));
