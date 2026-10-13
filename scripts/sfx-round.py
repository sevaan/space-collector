# Round sound proposals (2026-10-12, Sevaan: "less harsh beeps… more organic and round sounding clicks and taps…
# sci-fi but the way Apple would approach it… as little annoyance as possible"). Two alternates per event, built from a
# rounder palette: plucks with a tiny pitch settle, water-drop pops, short wooden tocks, harmonic-only glass, soft FM,
# everything an octave lower than the first set, darker filtering and less reverb. Nothing above ~D6 as a main note.
# Run:  python3 scripts/sfx-round.py <outdir> [event ...]   -> <outdir>/<event>/a.mp3, b.mp3 + round.json
import importlib.util, os, sys, json, subprocess
import numpy as np
spec = importlib.util.spec_from_file_location('synth', os.path.join(os.path.dirname(__file__), 'sfx-synth.py'))
S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
SR, t, env, lp, hp, place, swish, paper, thud, pad, choir, finish, write, noise = S.SR, S.t, S.env, S.lp, S.hp, S.place, S.swish, S.paper, S.thud, S.pad, S.choir, S.finish, S.write, S.noise
N = dict(S.G, D3=146.83, G3=196.0, A3=220.0, B3=246.94, E4=329.63)

def pluck(f, dur=0.7, decay=0.2, amp=1.0, settle=0.035):   # round pluck: a pure tone that settles into pitch
    tt = t(dur); ph = 2 * np.pi * np.cumsum(f * (1 + settle * np.exp(-tt / 0.012))) / SR
    x = np.sin(ph) + 0.14 * np.sin(2 * ph) * np.exp(-tt / (decay * 0.3))
    return amp * x * np.minimum(1, tt / 0.003) * np.exp(-tt / decay)
def drop(f, dur=0.3, decay=0.07, amp=1.0):                  # water drop: a quick upward glide into the note
    tt = t(dur); ph = 2 * np.pi * np.cumsum(f * (0.72 + 0.28 * (1 - np.exp(-tt / 0.018)))) / SR
    return amp * np.sin(ph) * np.minimum(1, tt / 0.002) * np.exp(-tt / decay)
def tock(f=900, amp=1.0, decay=0.007):                       # rounded wooden tap
    tt = t(0.1)
    return amp * (np.sin(2 * np.pi * f * tt) * np.exp(-tt / decay) + 0.6 * np.sin(2 * np.pi * f / 2.7 * tt) * np.exp(-tt / (decay * 2)))
def glass(f, dur=1.3, decay=0.45, amp=1.0):                  # rounder bell: harmonic partials only
    tt = t(dur); n = len(tt); x = np.zeros(n)
    for r, a, dk in [(1, 1, 1), (2, 0.12, 0.4), (3, 0.035, 0.2)]: x += a * np.sin(2 * np.pi * f * r * tt) * env(n, 0.004, decay * dk)
    return amp * x
def fm(f, dur=1.0, decay=0.35, idx=1.1, ratio=1.0, amp=1.0):  # soft electric-piano FM: the brightness fades first
    tt = t(dur); I = idx * np.exp(-tt / (decay * 0.25))
    return amp * np.sin(2 * np.pi * f * tt + I * np.sin(2 * np.pi * f * ratio * tt)) * env(len(tt), 0.003, decay)
def seq(notes, gap, inst, total, **kw):
    out = np.zeros(int(SR * total))
    for k, nn in enumerate(notes): place(out, inst(N[nn], **kw), k * gap)
    return out
def mix(total, *parts):                                       # parts: (signal, at, gain)
    out = np.zeros(int(SR * total))
    for x, at, g in parts: place(out, g * x, at)
    return out
R = dict(wet=0.14, size=1.2, soften=4200)                     # the room for everything: small, dark
def k(**kw): return {**R, **kw}

P = {}
P['lock'] = [('Water drop', drop(N['G5'], 0.25, 0.05), k(peak_db=-16)), ('Wood tock', tock(1050, decay=0.006), k(wet=0.06, peak_db=-17))]
P['collect'] = [('Pluck pair', seq(['D5', 'G5'], 0.07, pluck, 0.9, decay=0.16), k(peak_db=-13)), ('Soft keys pair', seq(['G4', 'D5'], 0.07, fm, 1.0, decay=0.25), k(peak_db=-13))]
P['arrive'] = [('Low air', swish(0.5, 220, 800, amp=0.5, peak=0.6), k(soften=2200, peak_db=-17)), ('Air + pluck', mix(0.8, (swish(0.45, 250, 900, amp=0.5, peak=0.6), 0, 1), (pluck(N['D4'], 0.6, 0.2), 0.3, 0.25)), k(soften=2400, peak_db=-17))]
P['flip'] = [('Card tock', mix(0.3, (paper(0.07, 0.3), 0, 1), (tock(700), 0.03, 0.4)), k(soften=2600, wet=0.08, peak_db=-17)), ('Double tock', mix(0.3, (tock(800), 0, 0.6), (tock(620), 0.07, 0.4)), k(soften=2600, wet=0.08, peak_db=-18))]
P['r_common'] = [('Pluck dyad', mix(1.0, (pluck(N['G4'], 0.9, 0.3), 0, 1), (pluck(N['D5'], 0.9, 0.28), 0.05, 0.7)), k(peak_db=-12)), ('Single glass', glass(N['G5'], 1.2, 0.4), k(peak_db=-13))]
P['r_uncommon'] = [('Pluck three', seq(['G4', 'B4', 'D5'], 0.08, pluck, 1.2, decay=0.3), k(peak_db=-12)), ('Keys three', seq(['D4', 'G4', 'B4'], 0.09, fm, 1.3, decay=0.4), k(peak_db=-12))]
P['r_rare'] = [('Low glass arpeggio', seq(['G4', 'B4', 'D5', 'G5'], 0.09, glass, 1.8, dur=1.4, decay=0.5), k(wet=0.2, size=1.6, peak_db=-12)), ('Music box, low', seq(['B4', 'D5', 'G5', 'D5', 'B5'], 0.12, fm, 2.0, dur=1.2, decay=0.45, ratio=2.0, idx=0.6), k(wet=0.2, size=1.6, peak_db=-12))]
P['r_epic'] = [('Harp + warm pad', mix(2.2, (pad([N['G3'], N['D4'], N['B4']], 2.2, 0.4, 0.6), 0, 1), (seq(['G4', 'A4', 'B4', 'D5', 'E5', 'G5'], 0.05, pluck, 1.6, dur=1.0, decay=0.45), 0.1, 0.8)), k(wet=0.22, size=1.8, peak_db=-12)),
               ('Choir + glass', mix(2.4, (choir([N['G3'], N['D4'], N['B4']], 2.4, 0.5, 0.8), 0, 1), (seq(['D5', 'G5', 'B5'], 0.12, glass, 1.6, dur=1.2, decay=0.5), 0.2, 0.5)), k(wet=0.24, size=2.0, peak_db=-12))]
P['r_legend'] = [('Warm swell + low bells', mix(3.4, (pad([N['G3'], N['D4'], N['B4'], N['D5']], 3.4, 0.9, 0.9), 0, 1), (seq(['G5', 'B5', 'D6'], 0.16, glass, 2.2, dur=1.8, decay=0.7), 0.5, 0.45)), k(wet=0.26, size=2.2, peak_db=-11)),
                 ('Choir swell + keys', mix(3.4, (choir([N['G3'], N['D4'], N['G4'], N['B4']], 3.4, 1.0, 1.0), 0, 1), (seq(['G4', 'D5', 'G5'], 0.2, fm, 2.0, dur=1.6, decay=0.8, idx=0.7), 0.7, 0.5)), k(wet=0.28, size=2.2, peak_db=-11))]
sp = np.zeros(int(SR * 1.0))
for i, nn in enumerate(['B5', 'D6', 'G5', 'D6', 'B5', 'G6']): place(sp, glass(N[nn], 0.6, 0.16, 0.5 - i * 0.05), 0.055 * i)
P['shiny'] = [('Soft glass sparkle', sp, k(wet=0.22, size=1.4, peak_db=-17)), ('Drop sparkle', mix(0.9, *[(drop(N[nn], 0.25, 0.05), 0.06 * i, 0.6 - 0.06 * i) for i, nn in enumerate(['D5', 'G5', 'B5', 'D6', 'G6'])]), k(wet=0.2, peak_db=-17))]
P['seen'] = [('Low pluck', pluck(N['D5'], 0.6, 0.18), k(peak_db=-16)), ('Tock + glass', mix(0.8, (tock(800), 0, 0.4), (glass(N['G4'], 0.8, 0.25), 0.01, 0.8)), k(peak_db=-17))]
P['stamp'] = [('Soft stamp', mix(0.35, (thud(100, 0.3), 0, 1), (tock(500), 0, 0.3)), k(soften=2600, wet=0.08, peak_db=-14)), ('Felt thump', thud(85, 0.35), k(soften=1800, wet=0.06, peak_db=-14))]
P['levelup'] = [('Pluck climb', seq(['D4', 'G4', 'B4', 'D5', 'G5'], 0.07, pluck, 1.4, decay=0.35), k(peak_db=-12)), ('Glass climb, low', seq(['G4', 'B4', 'D5', 'G5'], 0.1, glass, 1.8, dur=1.2, decay=0.45), k(wet=0.2, peak_db=-12))]
P['xp'] = [('Tiny tock', tock(1200, decay=0.004), k(wet=0.02, soften=3000, peak_db=-24)), ('Tiny drop', drop(N['D6'], 0.08, 0.018), k(wet=0.02, soften=3200, peak_db=-24))]
P['mission'] = [('Pluck motif', seq(['G4', 'A4', 'B4', 'D5', 'G5'], 0.085, pluck, 1.5, decay=0.35), k(peak_db=-12)), ('Keys motif', seq(['D5', 'B4', 'D5', 'G5'], 0.13, fm, 1.8, dur=1.2, decay=0.45), k(wet=0.2, peak_db=-12))]
P['rankup'] = [('Swell + glass melody', mix(3.0, (pad([N['G3'], N['D4'], N['G4'], N['B4']], 3.0, 0.5, 0.7), 0, 1), (seq(['D5', 'G5', 'B5', 'D6'], 0.16, glass, 2.4, dur=1.6, decay=0.6), 0.15, 0.6)), k(wet=0.26, size=2.0, peak_db=-11)),
                ('Choir + pluck melody', mix(3.0, (choir([N['G3'], N['D4'], N['B4']], 3.0, 0.6, 0.8), 0, 1), (seq(['G4', 'A4', 'B4', 'D5', 'G5'], 0.15, pluck, 2.2, dur=1.2, decay=0.45), 0.2, 0.7)), k(wet=0.26, size=2.0, peak_db=-11))]
P['patch'] = [('Drop pair', mix(0.6, (drop(N['G5'], 0.3, 0.07), 0, 1), (drop(N['D6'], 0.3, 0.06), 0.07, 0.7)), k(peak_db=-15)), ('Low glass pair', mix(0.9, (glass(N['D5'], 0.8, 0.25), 0, 1), (glass(N['G5'], 0.8, 0.22), 0.06, 0.7)), k(peak_db=-15))]
P['coinroll'] = [('Low swoosh + tock', mix(0.8, (swish(0.4, 1800, 350, amp=0.6, peak=0.4), 0, 1), (tock(650), 0.36, 0.35)), k(soften=2800, peak_db=-18)), ('Swoosh + drop', mix(0.8, (swish(0.4, 1600, 400, amp=0.6, peak=0.4), 0, 1), (drop(N['G5'], 0.25, 0.05), 0.36, 0.3)), k(soften=3000, peak_db=-18))]
P['complete'] = [('Pluck gliss + pad', mix(2.4, (seq(['G4', 'B4', 'D5', 'G5', 'B5', 'D6'], 0.05, pluck, 1.6, dur=1.0, decay=0.45), 0, 1), (pad([N['G4'], N['B4'], N['D5']], 2.0, 0.3, 0.5), 0.3, 1)), k(wet=0.24, size=1.8, peak_db=-12)),
                 ('Choir + low glass', mix(2.6, (choir([N['G4'], N['B4'], N['D5']], 2.6, 0.5, 0.8), 0, 1), (seq(['G5', 'B5', 'D6'], 0.12, glass, 1.8, dur=1.4, decay=0.55), 0.3, 0.45)), k(wet=0.24, size=1.8, peak_db=-12))]
# The Wow! signal: no beeps. A narrow tone that swells up out of soft radio hiss and fades (the real signal rose and fell
# over 72 seconds), then a warm two-note answer.
tw = t(2.4); glide = N['G4'] * (1 + 0.06 * np.sin(np.pi * tw / 2.4)); tone = np.sin(2 * np.pi * np.cumsum(glide) / SR) * np.sin(np.pi * np.clip(tw / 1.8, 0, 1)) ** 2
hiss = lp(hp(noise(2.4), 300), 1400) * 0.05 * np.sin(np.pi * tw / 2.4)
P['secret'] = [('Signal swell', mix(2.6, (tone * 0.6 + hiss, 0, 1), (pluck(N['D5'], 0.9, 0.35), 1.5, 0.45), (pluck(N['G5'], 0.9, 0.35), 1.62, 0.4)), k(wet=0.24, size=1.8, soften=3000, peak_db=-16)),
               ('Warm discovery', mix(2.6, (pad([N['G3'], N['D4'], N['B4']], 2.4, 0.6, 0.7), 0, 1), (seq(['D5', 'B4', 'G5'], 0.22, glass, 1.8, dur=1.4, decay=0.5), 0.35, 0.5)), k(wet=0.26, size=2.0, peak_db=-16))]
fsb = np.zeros(int(SR * 1.0))
for i in range(3): place(fsb, lp(swish(0.22, 300, 700, amp=0.6, peak=0.4), 1800), 0.25 * i)
P['fossil'] = [('Soft brush + low pluck', mix(1.2, (fsb, 0, 1), (pluck(N['G3'], 0.8, 0.3), 0.8, 0.4)), k(soften=2200, wet=0.08, peak_db=-17)), ('Brush only, darker', fsb, k(soften=1800, wet=0.06, peak_db=-17))]
tu = t(2.2); gl = N['D5'] * (1 + 0.1 * np.sin(np.pi * tu / 2.2)) * (1 + 0.006 * np.sin(2 * np.pi * 4.5 * tu)); th = np.sin(2 * np.pi * np.cumsum(gl) / SR) * np.sin(np.pi * tu / 2.2) ** 2
P['ufo'] = [('Gentle theremin', mix(2.3, (th * 0.4, 0, 1), (pad([N['G3'], N['D4']], 2.2, 0.6, 0.4), 0, 1)), k(wet=0.24, size=1.8, soften=3000, peak_db=-16)), ('Keys glide', mix(2.3, (pad([N['G3'], N['D4'], N['A4']], 2.2, 0.6, 0.6), 0, 1), (seq(['A4', 'D5', 'A4'], 0.3, fm, 2.0, dur=1.2, decay=0.5, ratio=1.5, idx=0.8), 0.2, 0.5)), k(wet=0.24, size=1.8, peak_db=-16))]
P['welcome'] = [('Card + low glass', mix(1.2, (paper(0.09, 0.35), 0, 1), (glass(N['G5'], 1.0, 0.35), 0.06, 0.5)), k(wet=0.18, soften=3600, peak_db=-15)), ('Drop + pluck', mix(1.0, (drop(N['D5'], 0.3, 0.06), 0, 0.7), (pluck(N['G5'], 0.8, 0.3), 0.08, 0.6)), k(wet=0.18, peak_db=-15))]
P['swipe'] = [('Soft swish', swish(0.26, 350, 1200, amp=0.5, peak=0.35), k(soften=2200, wet=0.06, peak_db=-19)), ('Breath', swish(0.32, 250, 800, amp=0.5, peak=0.4), k(soften=1800, wet=0.06, peak_db=-19))]
P['step'] = [('Drop', drop(N['G4'], 0.22, 0.05), k(peak_db=-19)), ('Tock', tock(760), k(wet=0.05, peak_db=-20))]
P['toggle'] = [('Tiny tock', tock(1300, decay=0.004), k(wet=0.02, soften=3000, peak_db=-22)), ('Tiny drop', drop(N['D5'], 0.1, 0.02), k(wet=0.02, peak_db=-22))]
P['toast'] = [('Low pluck pair', mix(0.8, (pluck(N['D5'], 0.6, 0.2), 0, 0.8), (pluck(N['G5'], 0.6, 0.2), 0.06, 0.6)), k(peak_db=-19)), ('Single drop', drop(N['G5'], 0.3, 0.06), k(peak_db=-19))]
P['page'] = [('Soft page', mix(0.3, (swish(0.14, 700, 1800, amp=0.3, peak=0.3), 0, 1), (tock(500), 0.02, 0.15)), k(soften=2200, wet=0.05, peak_db=-23)), ('Breath page', swish(0.18, 400, 1100, amp=0.3, peak=0.3), k(soften=1800, wet=0.05, peak_db=-23))]
rt = np.zeros(int(SR * 1.0))
for i in range(5): place(rt, 0.55 * 0.78 ** i * tock(520 if i % 2 else 640, decay=0.006), 0.1 * i)
P['rattle'] = [('Wooden rattle', rt, k(wet=0.06, soften=2400, peak_db=-21)), ('Wooden rattle + drop', mix(1.0, (rt, 0, 1), (drop(N['D6'], 0.25, 0.05), 0.06, 0.12)), k(wet=0.06, soften=2600, peak_db=-21))]
P['plane'] = [('Round "nuh-uh"', mix(0.5, (pluck(N['D4'], 0.25, 0.08, settle=0.0), 0, 1), (pluck(N['B3'], 0.3, 0.1, settle=0.0), 0.15, 1)), k(wet=0.05, soften=1800, peak_db=-16)), ('Low double tock', mix(0.4, (tock(300, decay=0.012), 0, 1), (tock(260, decay=0.014), 0.14, 1)), k(wet=0.05, soften=1600, peak_db=-16))]

if __name__ == '__main__':
    out = sys.argv[1]; only = sys.argv[2:]; man = {}
    for ev, lst in P.items():
        if only and ev not in only: continue
        man[ev] = []
        for i, (label, sig, kw) in enumerate(lst):
            st = finish(np.asarray(sig, dtype=np.float64), **kw); tag = 'ab'[i]
            wav = f'{out}/{ev}/{tag}.wav'; write(wav, st)
            subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-b:a', '160k', wav[:-4] + '.mp3'], check=True); os.remove(wav)
            man[ev].append({'label': label, 'file': f'{ev}/{tag}.mp3'})
        print(ev, end=' ', flush=True)
    json.dump(man, open(f'{out}/round.json', 'w'), indent=1)
