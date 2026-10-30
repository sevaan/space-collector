// Story cards (2026-10-14, Sevaan; design/card-redesign.html): moments and history, not objects you can point at. Each is
// earned by finding a secret (js/secrets.js): the deep-space probes, the Wow! signal, Starman, and the dated and hidden
// ones. Registered as natural cards (natural: 'story'), album "Stories". Facts must stay true. Art: assets/art/cards/story-*.
import { NATURAL, NATURAL_BY_KEY } from './natural.js?v=0.1.1452';

const S = (id, secret, name, when, stats, fact) => ({ key: `story:${id}`, id: `story:${id}`, card: `story:${id}`, natural: 'story', type: 'story', story: true, secret, name, when, code: 'STORY', tier: 'epic', stats, fact, art: id });
export const STORIES = [
  S('wow', 'wow', 'The Wow! Signal', '15 August 1977 · Big Ear telescope, Ohio', [['DETECTED FOR', '72', 's'], ['CODE', '6EQUJ5', ''], ['FROM', 'Sagittarius', ''], ['HEARD AGAIN', 'Never', '']],
    'A strong, narrow-band radio signal whose origin remains **unexplained**. Astronomer **Jerry Ehman** circled it on the printout and wrote “**Wow!**”. It has never been reliably detected again.'),
  S('pale-blue-dot', 'voyager', 'Pale Blue Dot', '14 February 1990 · Voyager 1, 6 billion km out', [['DISTANCE', '6', 'bn km'], ['EARTH', '0.12', 'pixel'], ['PICTURES', '60', ''], ['ON BOARD', 'Golden record', '']],
    'Voyager 1 turned round and took a **family portrait** of the planets. Earth came out as **less than a pixel** in a beam of sunlight. It still carries its **golden record**.'),
  S('grand-tour', 'voyager2', 'The Grand Tour', '1977 to 1989 · Voyager 2', [['LAUNCHED', '1977', ''], ['PLANETS', '4', ''], ['INTERSTELLAR', '2018', ''], ['NEPTUNE', '1989', '']],
    'Jupiter, Saturn, Uranus and Neptune in one trip. Voyager 2 is still the **only spacecraft** to have visited **Uranus and Neptune**.'),
  S('plaque', 'pioneer10', 'The Plaque', '2 March 1972 · Pioneer 10', [['LAUNCHED', '1972', ''], ['JUPITER', '1973', ''], ['LAST HEARD', '2003', ''], ['PLAQUE', '23 × 15', 'cm']],
    'The first craft through the asteroid belt and the first to Jupiter. It carries a **gold-coloured plaque** with a drawing of two people and a **map to the Sun**, in case anyone finds it.'),
  S('ringside', 'pioneer11', 'Ringside', 'September 1979 · Pioneer 11 at Saturn', [['LAUNCHED', '1973', ''], ['SATURN', '1979', ''], ['LAST HEARD', '1995', ''], ['HEADING', 'Aquila', '']],
    'The **first spacecraft to visit Saturn**. Skimming past the edge of the rings, it spotted a thin new one: the **F ring**. It fell silent in 1995 and is still heading out of the solar system.'),
  S('heart', 'newhorizons', 'Heart of Pluto', '14 July 2015 · New Horizons', [['LAUNCHED', '2006', ''], ['PLUTO', '2015', ''], ['ARROKOTH', '2019', ''], ['PLUTO FLYBY', '12,500', 'km']],
    'Nine years to reach Pluto, and it revealed a giant **heart-shaped region** with a vast plain of nitrogen ice on its western side. On board is some of the ashes of **Clyde Tombaugh**, who discovered Pluto.'),
  S('starman', 'roadster', 'Starman', '6 February 2018 · Falcon Heavy', [['LAUNCHED', '2018', ''], ['CAR', 'Tesla Roadster', ''], ['DRIVER', 'Starman', ''], ['ONE LAP', '~557', 'days']],
    'Elon Musk’s own cherry-red **Tesla Roadster**, with a dummy in a spacesuit at the wheel, sent round the Sun as a test load on the **first Falcon Heavy**. The dashboard says “**Don’t Panic**”.'),
  S('arecibo', 'arecibo', 'The Arecibo Message', '16 November 1974 · Arecibo, Puerto Rico', [['SENT', '1974', ''], ['BITS', '1,679', ''], ['TO', 'M13', ''], ['ENCODING', '23 × 73', 'bits']],
    'A picture encoded in **1,679 bits**, beamed toward the Hercules Cluster: numbers, DNA, a person, our planets and the telescope. The radio waves take about **25,000 years** to cross that distance.'),
  S('halley', 'halley', 'Halley’s Way Home', '9 February 1986 · last time round', [['LAST', '1986', ''], ['NEXT', '2061', ''], ['ONE LAP', '~76', 'yrs'], ['APHELION', '2023', '']],
    'The comet most people see **once in a lifetime**. It turned round at the far end of its orbit in **2023** and is now falling back towards the Sun, due in **2061**.'),
  S('sputnik', 'sputnik', 'Sputnik’s Beep', '4 October 1957 · Baikonur', [['LAUNCHED', '1957', ''], ['SIZE', '58', 'cm'], ['BEEPED FOR', '22', 'days'], ['ONE LAP', '96', 'min']],
    'The **first artificial satellite**: a shiny ball with four antennas, broadcasting “**beep, beep**”. Radio operators around the world tuned in. The space age had begun.'),
  S('laika', 'laika', 'Laika', '3 November 1957 · Sputnik 2', [['LAUNCHED', '1957', ''], ['CRAFT', 'Sputnik 2', ''], ['FIRST TO ORBIT', 'Animal', ''], ['FROM', 'Moscow', '']],
    'A small stray dog from the streets of Moscow became the **first animal to orbit Earth**. She never came home, but she showed that a living thing could survive the trip to orbit.'),
  S('apollo11', 'apollo11', 'One Small Step', '20 July 1969 · Sea of Tranquility', [['LANDED', '1969', ''], ['WALK', '2 h 31', 'min'], ['ROCKS', '21.5', 'kg'], ['CREW', '3', '']],
    '**Neil Armstrong** and **Buzz Aldrin** walked on the Moon while **Michael Collins** circled overhead. Their footprints are still there: there is no wind to blow them away.'),
  S('two-homes', 'twohomes', 'Two Homes', 'Lived in since 2000 and 2021', [['ISS', '2000', ''], ['TIANGONG', '2021', ''], ['STATIONS', '2', ''], ['YOU SAW', 'Both', '']],
    'Two homes in orbit at once: the **International Space Station**, lived in since November 2000, and China’s **Tiangong**, since 2021. You caught both in one sitting.'),
];
STORIES.forEach((s, i) => { s.order = i; });
for (const s of STORIES) if (!NATURAL_BY_KEY.has(s.key)) { NATURAL.push(s); NATURAL_BY_KEY.set(s.key, s); }
export const STORY_BY_SECRET = new Map(STORIES.map((s) => [s.secret, s]));
