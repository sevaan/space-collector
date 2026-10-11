# Space Collector designed sound set (2026-10-11): one soft family in G major pentatonic (the key of "Permafrost",
# the background music). Glass bells, mallets, kalimba, felt taps, filtered-noise breaths, a warm pad and a choir-ish
# pad, through one gentle synthetic reverb, with the top end rolled off. Run:  python3 scripts/sfx-synth.py <outdir>
# It renders every variant from the sound board (<outdir>/<event>/dN.mp3). The app ships Sevaan's picks as
# assets/audio/sfx/<event>.mp3 (see CLAUDE.md for which variant each is). The shipped lock-on is a shorter version:
#   finish(bell(G['D6'], 0.3, 0.07, 0.8), wet=0.06, size=0.5, peak_db=-15)
import numpy as np, wave, os, subprocess, json
SR = 44100
rng = np.random.default_rng(7)
G = {'G3': 196.0, 'D4': 293.66, 'G4': 392.0, 'A4': 440.0, 'B4': 493.88, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.0, 'B5': 987.77, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98, 'A6': 1760.0, 'B6': 1975.53, 'D7': 2349.32, 'E7': 2637.02}
def t(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.004, d=0.4, curve=1.0):
    x = np.arange(n) / SR; e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)
    return e ** curve
def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y
def lp(x, fc, passes=2):
    for _ in range(passes): x = onepole_lp(x, fc)
    return x
def hp(x, fc): return x - lp(x, fc, 1)
def bell(f, dur=1.2, decay=0.5, amp=1.0):   # soft glass bell: a few inharmonic partials, upper ones die fast
    n = int(SR * dur); x = np.zeros(n); tt = t(dur)
    for r, a, dk in [(1, 1, 1), (2.0, 0.25, 0.5), (2.76, 0.18, 0.35), (5.4, 0.06, 0.15), (8.93, 0.025, 0.08)]:
        x += a * np.sin(2 * np.pi * f * r * tt) * env(n, 0.003, decay * dk)
    return amp * x
def mallet(f, dur=0.9, decay=0.3, amp=1.0):  # marimba-ish: warm fundamental, a quick 4th partial "knock"
    n = int(SR * dur); tt = t(dur)
    x = np.sin(2 * np.pi * f * tt) * env(n, 0.002, decay) + 0.35 * np.sin(2 * np.pi * f * 3.98 * tt) * env(n, 0.001, decay * 0.12) + 0.12 * np.sin(2 * np.pi * f * 9.9 * tt) * env(n, 0.001, decay * 0.04)
    return amp * x
def kalimba(f, dur=1.0, decay=0.45, amp=1.0):
    n = int(SR * dur); tt = t(dur)
    x = np.sin(2 * np.pi * f * tt) * env(n, 0.002, decay) + 0.22 * np.sin(2 * np.pi * f * 5.2 * tt) * env(n, 0.001, decay * 0.1)
    return amp * x
def felt(f, dur=0.3, decay=0.06, amp=1.0):     # felt tap: almost a pure tone, very short
    n = int(SR * dur); tt = t(dur)
    return amp * (np.sin(2 * np.pi * f * tt) + 0.15 * np.sin(4 * np.pi * f * tt)) * env(n, 0.0015, decay)
def noise(dur): return rng.standard_normal(int(SR * dur))
def swish(dur=0.45, f0=500, f1=2400, amp=0.5, peak=0.45):  # airy whoosh: noise through a sweeping band
    n = int(SR * dur); x = noise(dur); y = np.zeros(n); fc = np.geomspace(f0, f1, n)
    lo = 0.0; lo2 = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * fc[i] / SR); lo = (1 - a) * x[i] + a * lo; lo2 = (1 - a) * lo + a * lo2; y[i] = lo - lo2
    shape = np.sin(np.pi * np.clip(np.arange(n) / n, 0, 1) ** (peak / 0.5)) ** 2
    return amp * y * shape * 3
def paper(dur=0.12, amp=0.4):
    x = hp(lp(noise(dur), 6000), 900) * env(int(SR * dur), 0.002, dur * 0.25)
    return amp * x
def thud(f=110, dur=0.35, amp=1.0):
    tt = t(dur); ph = 2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-tt / 0.03))) / SR
    return amp * np.sin(ph) * env(len(tt), 0.002, 0.08)
def pad(freqs, dur=3.0, attack=0.8, amp=0.4):  # warm swell: detuned sines with a slow rise and fall
    tt = t(dur); n = len(tt); x = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0, 0.004): x += np.sin(2 * np.pi * f * (1 + det) * tt + rng.uniform(0, 6))
    shape = np.minimum(1, tt / attack) * np.minimum(1, (dur - tt) / (dur * 0.5))
    return amp * x / (3 * len(freqs)) * np.clip(shape, 0, 1) ** 1.5
def place(out, x, at):
    i = int(SR * at); j = min(len(out), i + len(x)); out[i:j] += x[: j - i]; return out
def seq(notes, gap, inst, total, **kw):
    out = np.zeros(int(SR * total))
    for k, nn in enumerate(notes): place(out, inst(G[nn], **kw), k * gap)
    return out
IR = None
def reverb(x, wet=0.22, size=1.6):
    global IR
    if IR is None or len(IR[0]) != int(SR * size):
        n = int(SR * size); tt = np.arange(n) / SR
        IR = [lp(rng.standard_normal(n), 3500, 1) * np.exp(-tt / (size / 5)) for _ in (0, 1)]
    L = np.convolve(x, IR[0])[: len(x) + len(IR[0])]; R = np.convolve(x, IR[1])[: len(L)]
    dry = np.concatenate([x, np.zeros(len(L) - len(x))])
    s = np.max(np.abs(L)) or 1
    return np.stack([dry + wet * L / s * np.max(np.abs(x)), dry + wet * R / s * np.max(np.abs(x))])
def finish(x, wet=0.22, size=1.4, soften=7000, peak_db=-12):
    st = reverb(lp(x, soften, 2), wet, size)
    # trim the reverb tail below -60 dB
    mag = np.max(np.abs(st), axis=0); thr = mag.max() * 10 ** (-60 / 20); last = np.nonzero(mag > thr)[0][-1] + int(0.05 * SR)
    st = st[:, :last]; fade = int(0.04 * SR); st[:, -fade:] *= np.linspace(1, 0, fade)
    return st / np.max(np.abs(st)) * 10 ** (peak_db / 20)
def write(path, st):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pcm = (np.clip(st.T, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

D = {}  # event -> list of (label, signal, finish kwargs)
D['lock'] = [('Glass tink', bell(G['D6'], 0.8, 0.35, 0.8), dict(wet=0.18, peak_db=-14)), ('Kalimba note', kalimba(G['B5'], 0.9, 0.35), dict(wet=0.18, peak_db=-14))]
D['collect'] = [('Rising mallet pair', seq(['G5', 'D6'], 0.07, mallet, 0.9, decay=0.22), dict(wet=0.2, peak_db=-13)), ('Felt double tap', seq(['D5', 'G5'], 0.06, felt, 0.4, decay=0.07), dict(wet=0.15, peak_db=-14))]
D['arrive'] = [('Airy swish', swish(0.5, 350, 1500, peak=0.6), dict(wet=0.15, soften=3200, peak_db=-16)), ('Breath', swish(0.7, 250, 1000, peak=0.45), dict(wet=0.2, soften=2600, peak_db=-17))]
D['flip'] = [('Soft card flick', place(place(np.zeros(int(SR * 0.3)), paper(0.09, 0.5), 0), 0.4 * felt(G['G4'], 0.2, 0.04), 0.05), dict(wet=0.12, soften=3000, peak_db=-16)),
             ('Paper turn', place(place(np.zeros(int(SR * 0.4)), paper(0.14, 0.4), 0), paper(0.07, 0.25), 0.11), dict(wet=0.12, soften=2800, peak_db=-17))]
D['r_common'] = [('Mallet dyad', place(mallet(G['G5'], 1.2, 0.35), mallet(G['D6'], 1.2, 0.3) * 0.7, 0.05), dict(wet=0.22, peak_db=-12))]
D['r_uncommon'] = [('Three-note mallet', seq(['G5', 'B5', 'D6'], 0.08, mallet, 1.3, decay=0.35), dict(wet=0.24, peak_db=-12))]
D['r_rare'] = [('Bell arpeggio', seq(['G5', 'B5', 'D6', 'G6'], 0.09, bell, 2.0, dur=1.6, decay=0.55), dict(wet=0.28, size=1.8, peak_db=-12))]
D['r_epic'] = [('Harp sweep', seq(['G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5', 'D6', 'G6'], 0.045, kalimba, 2.2, dur=1.4, decay=0.6), dict(wet=0.3, size=2.0, peak_db=-12))]
leg = pad([G['G3'], G['D4'], G['B4'], G['D5']], 3.4, 0.9, 0.9); leg = place(leg, seq(['D6', 'G6', 'B6', 'D7'], 0.14, bell, 2.4, dur=2.0, decay=0.7) * 0.5, 0.5)
D['r_legend'] = [('Warm swell + bells', leg, dict(wet=0.32, size=2.2, peak_db=-11))]
sp = np.zeros(int(SR * 1.1))
for k, nn in enumerate(['E6', 'G6', 'D7', 'B6', 'E7', 'A6', 'D7']): place(sp, bell(G[nn], 0.6, 0.18, 0.5 - k * 0.05), 0.06 * k + rng.uniform(0, 0.02))
D['shiny'] = [('Sparkle', sp, dict(wet=0.3, size=1.6, peak_db=-16))]
D['seen'] = [('Felt mallet', mallet(G['B5'], 0.7, 0.22, 0.8), dict(wet=0.2, peak_db=-16)), ('Low glass', bell(G['G5'], 0.9, 0.3), dict(wet=0.2, peak_db=-17))]
D['stamp'] = [('Soft stamp', place(thud(120, 0.3), paper(0.05, 0.3), 0.0), dict(wet=0.12, soften=4000, peak_db=-13))]
D['levelup'] = [('Rising bells', seq(['D5', 'G5', 'B5', 'D6'], 0.1, bell, 1.9, dur=1.3, decay=0.5), dict(wet=0.28, peak_db=-12))]
D['xp'] = [('Tiny tick', felt(G['D6'], 0.08, 0.018, 0.8), dict(wet=0.05, soften=3500, peak_db=-22)), ('Wood tick', mallet(G['G5'], 0.1, 0.02), dict(wet=0.05, soften=3500, peak_db=-22))]
D['mission'] = [('Kalimba motif', seq(['G5', 'A5', 'B5', 'D6', 'G6'], 0.085, kalimba, 1.8, dur=1.2, decay=0.5), dict(wet=0.26, peak_db=-12))]
rk = pad([G['G3'], G['D4'], G['G4'], G['B4']], 3.0, 0.5, 0.7); rk = place(rk, seq(['D5', 'G5', 'B5', 'D6', 'G6'], 0.16, bell, 2.6, dur=1.6, decay=0.6) * 0.7, 0.15)
D['rankup'] = [('Swell + bell melody', rk, dict(wet=0.32, size=2.2, peak_db=-11))]
D['patch'] = [('Coin ting', place(bell(G['E6'], 0.7, 0.25), bell(G['B6'], 0.7, 0.22) * 0.8, 0.06), dict(wet=0.22, peak_db=-14))]
cr = np.zeros(int(SR * 0.9)); tt0 = 0.0
for k in range(9): place(cr, felt(G['B6'] * (1 - 0.01 * k), 0.06, 0.012, 0.9 - k * 0.07), tt0); tt0 += 0.11 * (0.86 ** k)
D['coinroll'] = [('Rolling tinks', cr, dict(wet=0.12, peak_db=-18))]
cp = seq(['G4', 'B4', 'D5', 'G5', 'B5', 'D6', 'G6'], 0.05, kalimba, 2.4, dur=1.6, decay=0.7); cp = place(cp, pad([G['G4'], G['B4'], G['D5']], 2.0, 0.3, 0.5), 0.3)
D['complete'] = [('Gliss + chord', cp, dict(wet=0.3, size=2.0, peak_db=-12))]
rd = 0.06 * lp(noise(2.2), 2500) ; beeps = np.zeros(int(SR * 2.2))
for at, ln in [(0.2, .08), (0.35, .08), (0.5, .22), (0.85, .08), (1.0, .22), (1.35, .22), (1.7, .08)]:
    place(beeps, felt(G['D6'], ln + 0.05, ln * 0.6, 0.5), at)
D['secret'] = [('Distant signal', hp(rd, 400) + lp(beeps, 3000), dict(wet=0.25, size=1.8, peak_db=-16))]
fs = np.zeros(int(SR * 1.0))
for k in range(3): place(fs, lp(swish(0.22, 500, 900, amp=0.6, peak=0.4), 2500), 0.25 * k)
D['fossil'] = [('Soft brushing', fs, dict(wet=0.1, soften=3000, peak_db=-16))]
tu = t(2.2); ufo = 0.5 * np.sin(2 * np.pi * np.cumsum(G['D5'] * (1 + 0.02 * np.sin(2 * np.pi * 5.5 * tu)) * (1 + 0.15 * np.sin(np.pi * tu / 2.2))) / SR) * np.sin(np.pi * tu / 2.2) ** 2
D['ufo'] = [('Wobbling glide', ufo + pad([G['G3'], G['D4']], 2.2, 0.6, 0.5), dict(wet=0.3, size=2.0, peak_db=-15))]
D['welcome'] = [('Flick + chime', place(place(np.zeros(int(SR * 1.2)), paper(0.1, 0.5), 0), bell(G['G6'], 1.0, 0.4) * 0.5, 0.08), dict(wet=0.24, peak_db=-14))]
D['swipe'] = [('Quick swish', swish(0.28, 500, 1800, peak=0.35), dict(wet=0.1, soften=3000, peak_db=-18))]
tb = t(0.18); bub = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-tb / 0.05) + 300) / SR) * env(len(tb), 0.002, 0.04)
D['step'] = [('Soft bubble', bub, dict(wet=0.12, peak_db=-19)), ('Felt tap', felt(G['G5'], 0.2, 0.05), dict(wet=0.12, peak_db=-19))]
D['toggle'] = [('Felt click', place(felt(G['D5'], 0.06, 0.012), 0.12 * lp(noise(0.004), 2500), 0), dict(wet=0.03, soften=2500, peak_db=-21))]
D['toast'] = [('Quiet bell', bell(G['A5'], 0.7, 0.25, 0.7), dict(wet=0.2, peak_db=-19))]

# Second voicings (v2b): kalimba / bell alternatives for the rewards, a choir-ish pad for the big ones.
def choir(freqs, dur=3.0, attack=1.0, amp=0.5):  # breathy "ah": pad plus a little filtered noise breath
    x = pad(freqs, dur, attack, amp)
    br = lp(hp(noise(dur), 300), 1800) * 0.04 * np.minimum(1, t(dur) / attack) * np.clip((dur - t(dur)) / (dur * 0.5), 0, 1)
    return x + br[: len(x)]
D['r_common'].append(('Kalimba dyad', place(kalimba(G['D6'], 1.3, 0.45), kalimba(G['G5'], 1.3, 0.5) * 0.8, 0.04), dict(wet=0.22, peak_db=-12)))
D['r_uncommon'].append(('Kalimba three', seq(['D5', 'G5', 'B5'], 0.09, kalimba, 1.5, dur=1.2, decay=0.5), dict(wet=0.24, peak_db=-12)))
D['r_rare'].append(('Music box', seq(['B5', 'D6', 'G6', 'D6', 'B6'], 0.12, lambda f, **k: bell(f, 1.4, 0.45, 0.8) + 0.5 * kalimba(f * 2, 1.4, 0.2), 2.2), dict(wet=0.3, size=1.8, peak_db=-12)))
D['r_epic'].append(('Soft choir + kalimba', place(choir([G['G4'], G['D5'], G['B5']], 2.4, 0.5, 0.8), seq(['G5', 'B5', 'D6', 'G6'], 0.1, kalimba, 1.6, dur=1.2, decay=0.6) * 0.6, 0.2), dict(wet=0.3, size=2.0, peak_db=-12)))
D['r_legend'].append(('Choir swell', place(choir([G['G3'], G['D4'], G['G4'], G['B4'], G['D5']], 3.4, 1.0, 1.0), bell(G['G6'], 2.0, 0.8) * 0.35, 1.0), dict(wet=0.34, size=2.4, peak_db=-11)))
D['levelup'].append(('Kalimba climb', seq(['G4', 'B4', 'D5', 'G5', 'B5'], 0.07, kalimba, 1.6, dur=1.1, decay=0.45), dict(wet=0.26, peak_db=-12)))
D['mission'].append(('Bell motif', seq(['D6', 'B5', 'D6', 'G6'], 0.13, bell, 2.0, dur=1.4, decay=0.5), dict(wet=0.28, peak_db=-12)))
D['rankup'].append(('Choir + kalimba melody', place(choir([G['G3'], G['D4'], G['B4']], 3.0, 0.6, 0.8), seq(['G5', 'A5', 'B5', 'D6', 'G6'], 0.15, kalimba, 2.2, dur=1.4, decay=0.6) * 0.7, 0.2), dict(wet=0.32, size=2.2, peak_db=-11)))
D['patch'].append(('Kalimba pop', place(kalimba(G['G6'], 0.8, 0.3), kalimba(G['D6'], 0.8, 0.3) * 0.6, 0.0), dict(wet=0.2, peak_db=-14)))
D['complete'].append(('Choir + bell', place(choir([G['G4'], G['B4'], G['D5'], G['G5']], 2.6, 0.5, 0.8), seq(['D6', 'G6', 'B6'], 0.12, bell, 1.8, dur=1.4, decay=0.6) * 0.5, 0.3), dict(wet=0.3, size=2.0, peak_db=-12)))
D['shiny'].append(('Soft shimmer', place(np.zeros(int(SR * 1.2)), sum(place(np.zeros(int(SR * 1.2)), kalimba(G[nn], 0.8, 0.3, 0.4), 0.05 * k) for k, nn in enumerate(['G6', 'B6', 'D7', 'E7', 'D7', 'B6'])), 0), dict(wet=0.32, size=1.8, peak_db=-16)))

# Sideways swipe between cards in the collection (2026-10-11): a soft paper slide with a low felt touch, quieter than flip.
D['page'] = [('Paper slide', place(place(np.zeros(int(SR * 0.3)), swish(0.16, 900, 2600, amp=0.35, peak=0.3), 0), 0.25 * felt(G['B4'], 0.15, 0.03), 0.02), dict(wet=0.08, soften=2600, peak_db=-22))]

# The sealed welcome card shaking (2026-10-11): five soft card-stock taps in time with the CSS wobble (every 0.1 s,
# each quieter), a low felt knock under the first, and a faint glass glint, as if something is inside.
def _rattle(glint=True):
    out = np.zeros(int(SR * 1.1))
    for k in range(5):
        a = 0.55 * (0.78 ** k)
        t0 = 0.1 * k + rng.uniform(0, 0.008)
        place(out, paper(0.028, a), t0); place(out, 0.35 * a * felt(G['D4'] if k % 2 else G['G4'], 0.06, 0.012), t0)
    place(out, 0.18 * felt(G['G3'], 0.18, 0.05), 0.0)
    if glint: place(out, 0.09 * bell(G['D7'], 0.7, 0.3), 0.06)
    return out
D['rattle'] = [('Card rattle + glint', _rattle(True), dict(wet=0.1, soften=3600, peak_db=-20)), ('Card rattle', _rattle(False), dict(wet=0.08, soften=3200, peak_db=-20))]

if __name__ == '__main__':
    import sys
    out = sys.argv[1]; man = {}
    only = sys.argv[2:]
    for ev, lst in D.items():
        if only and ev not in only: continue
        man[ev] = []
        for i, (label, sig, kw) in enumerate(lst):
            st = finish(np.asarray(sig, dtype=np.float64), **kw)
            wav = f'{out}/{ev}/d{i + 1}.wav'; mp3 = wav[:-4] + '.mp3'; write(wav, st)
            subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-b:a', '192k', mp3], check=True); os.remove(wav)
            man[ev].append({'label': label, 'file': f'{ev}/d{i + 1}.mp3', 'dur': round(st.shape[1] / SR, 2)})
        print(ev, len(lst), end='; ')
    json.dump(man, open(f'{out}/designed.json', 'w'), indent=1)
