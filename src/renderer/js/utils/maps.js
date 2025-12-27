import { GAMES, GAME_PROCESSES } from "./constants"

export const maps = {
  [GAME_PROCESSES.RETHAWED]: {
    THPS1: {
      ware: 'WAREHOUSE',
      sc: 'SCHOOL',
      MA: 'THE MALL',
      CH: 'CHICAGO',
      DN: 'MINNEAPOLIS',
      dj: 'DOWNHILL JAM',
      Burnside: 'BURNSIDE',
      ros: 'ROSWELL'
    },
    THPS2: {
      hn: 'HANGAR',
      sc2: 'SCHOOL II',
      MS: 'MARSEILLE',
      nyc: 'NEW YORK',
      Skatestreet: 'SKATESTREET VENTURA',
      phl: "PHILADELPHIA",
      Bullring: "THE BULLRING",
      chopper: 'CHOPPER DROP',
    },
    THPS3: {
      found: 'FOUNDRY',
      th3can: 'CANADA',
      rio: 'RIO',
      sub: 'SUBURBIA',
      th3ap: 'AIRPORT',
      si: 'SKATER ISLAND',
      la: 'LOS ANGELES',
      to: 'TOKYO',
      crushp: 'CRUISE SHIP',
      th3oil: 'OIL RIG'
    },
    THPS4: {
      sch: 'COLLEGE',
      sf: 'SAN FRANCISCO',
      alc: 'ALCATRAZ',
      kon: 'KONA SKATEPARK',
      jn: 'SHIPYARD',
      lo: 'LONDON',
      zo: 'ZOO',
      cn: 'CARNIVAL',
      ho: 'CHICAGO',
      pr: 'PRACTICE',
    },
    THUG: {
      nj: 'NEW JERSEY',
      ny: 'MANHATTAN',
      fl: 'TAMPA',
      sd: 'SAN DIEGO',
      hi: 'HAWAII',
      vc: 'VANCOUVER',
      sj: 'SLAM CITY JAM',
      ru: 'MOSCOW',
      se3: 'HOTTER THAN HELL'
    },
    THUG2: {
      tr: 'TRAINING',
      BO: 'BOSTON',
      ba: 'BARCELONA',
      BE: 'BERLIN',
      AU: 'AUSTRALIA',
      no: 'NEW ORLEANS',
      st: 'SKATOPIA',
      SE: 'PRO SKATER',
      SE2: 'THE TRIANGLE',
      ap: 'AIRPORT'
    },
    THAW: {
      HO: 'HOLLYWOOD',
      BH: 'BEVERLY HILLS',
      DT: 'DOWNTOWN LA',
      EL: 'EAST LA',
      SM: 'SANTA MONICA',
      OI: 'OIL RIG',
      SV: 'VANS PARK',
      LV: 'CASINO',
      SR: 'SKATE RANCH',
      SZ: 'SANTA CRUZ',
      JA: 'KYOTO',
      SV2: 'THE RUINS',
      AT: 'ATLANTA',
    },
    THP8: {
      training: 'TRAINING',
      houses: 'SUBURBS',
      shops: 'DOWNTOWN',
      Center: 'CITY CENTER',
      inschool: 'HIGH SCHOOL',
      cf: 'CAR FACTORY',
      cretepark: 'CRETE PARK',
      funpark: 'FUN PARK',
      riod: 'DOWNHILL',
    },
    DESA: {
      andysroom: 'ANDY\'S ROOM',
      pizza: 'PIZZA PLANET',
    },
    "MISC LEVELS": {
      canpsx: 'CANADA (PSX)',
      ParisR: 'PARIS (RESURRECTED)'
    },
    "CUSTOM LEVELS": {
    }
  },
  [GAME_PROCESSES.THUGPRO]: {
    THPS1: {
      ware: 'WAREHOUSE',
      SC: 'SCHOOL',
      z_ma: 'THE MALL',
      skatepark: 'SKATEPARK',
      z_dn: 'MINNEAPOLIS',
      DJ: 'DOWNHILL JAM',
      burn: 'BURNSIDE',
      ros: 'ROSWELL'
    },
    THPS2: {
      hn: 'HANGAR',
      SC2: 'SCHOOL II',
      z_ms: 'MARSEILLE',
      VN: 'VENICE',
      PH: 'PHILADELPHIA'
    },
    THPS3: {
      foun: 'FOUNDRY',
      CA: 'CANADA',
      rio: 'RIO',
      sub: 'SUBURBIA',
      AP: 'AIRPORT',
      si: 'SKATER ISLAND',
      LA: 'LOS ANGELES',
      tok: 'TOKYO',
      shp: 'CRUISE SHIP',
      oil: 'OIL RIG'
    },
    THPS4: {
      sch: 'COLLEGE',
      sf2: 'SAN FRANCISCO',
      alc: 'ALCATRAZ',
      kon: 'KONA',
      lon: 'LONDON',
      jnk: 'SHIPYARD',
      zoo: 'ZOO',
      cnv: 'CARNIVAL',
      hof: 'CHICAGO',
      practice: 'PRACTICE'
    },
    THUG: {
      NJ: 'NEW JERSEY',
      ny: 'MANHATTAN',
      FL: 'TAMPA',
      SD: 'SAN DIEGO',
      HI: 'HAWAII',
      vc: 'VANCOUVER',
      sj: 'SLAM CITY JAM',
      ru: 'MOSCOW',
      hh: 'HOTTER THAN HELL'
    },
    THUG2: {
      TR: 'TRAINING',
      BO: 'BOSTON',
      BA: 'BARCELONA',
      BE: 'BERLIN',
      AU: 'AUSTRALIA',
      NO: 'NEW ORLEANS',
      ST: 'SKATOPIA',
      SE: 'PRO SKATER',
      SE2: 'THE TRIANGLE',
      ap: 'AIRPORT',
    },
    THAW: {
      z_ho: 'HOLLYWOOD',
      z_bh: 'BEVERLY HILLS',
      z_dt: 'DOWNTOWN',
      z_el: 'EAST LA',
      z_sm: 'SANTA MONICA',
      z_oi: 'OIL RIG',
      vans: 'VANS PARK',
      z_lv: 'CASINO',
      z_sr: 'SKATE RANCH',
      z_sv2: 'THE RUINS',
      sz: 'SANTA CRUZ',
      kyoto: 'KYOTO',
      atlanta: 'ATLANTA'
    },
    THP8: {
      z_center: 'CITY CENTER',
      HISCH: 'HIGH SCHOOL',
      z_funpark: 'FUN PARK',
      z_riod: 'DOWNHILL'
    },
    "THPG (Larxian's ports)": {
      Philly: 'PHILLY',
      Baltimore: 'BALTIMORE',
      WashingtonDC: 'DC'
    },
    "MISC LEVELS": {
      toystory_bedroom: "ANDY'S ROOM"
    },
    "CUSTOM LEVELS": {}
  },
  [GAME_PROCESSES.THUG2]: {
    [GAMES.THUG2]: {
      TR: 'TRAINING',
      BO: 'BOSTON',
      BA: 'BARCELONA',
      BE: 'BERLIN',
      AU: 'AUSTRALIA',
      NO: 'NEW ORLEANS',
      ST: 'SKATOPIA',
      SE: 'PRO SKATER',
      SE2: 'THE TRIANGLE',
      SC: 'SCHOOL',
      PH: 'PHILADELPHIA',
      DJ: 'DOWNHILL JAM',
      LA: 'LOS ANGELES',
      CA: 'CANADA',
      AP: 'AIRPORT',
    }
  },
  [GAME_PROCESSES.THAW]: {
    [GAMES.THAW]: {
      HO: 'HOLLYWOOD',
      BH: 'BEVERLY HILLS',
      DT: 'DOWNTOWN',
      EL: 'EAST LA',
      SM: 'SANTA MONICA',
      OI: 'OIL RIG',
      SV: 'VANS PARK',
      LV: 'CASINO',
      SR: 'SKATE RANCH',
      DN: 'MINNEAPOLIS',
      SZ: 'SANTA CRUZ',
      MA: 'THE MALL',
      CH: 'CHICAGO',
      JA: 'KYOTO',
      SV2: 'THE RUINS',
    }
  },
}
