window.define = {}
// stats
const gunstat = {
  blank: {
    reload: 1/4,
    recoil: 1,
    shudder: 0,
    size: 1,
    health: 1,
    damage: 10,
    penetration: 1,
    speed: 1,
    max_speed: 1,
    range: 1,
    density: 1,
    spread: 0,
    resist: 1
  }
}
// tanks
define.unknown_class = {
  label: "unknown class",
  body: {
    health: 500,
    shield: 200,
    damage: 10,
    regen: 10,
    speed: 5
  }
}
define.base = {
  parent: define.unknown_class,
  label: "base",
  guns: {
    {
      position: [1, 0.5, 1, 0, 0, 0, 0],
      properties: {
        shoot_settings: stats([gunstat.blank]),
        type: define.bullet
      }
    }
  }
}
